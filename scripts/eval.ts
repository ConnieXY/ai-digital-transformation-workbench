/**
 * 离线评测 harness：把黄金集跑过真实 API（dev server），
 * 评测 schema 合法性 / 引用有效性 / 忠实度(LLM-as-judge) / 检索召回，输出 scorecard + JSON。
 *
 * 运行：先 `npm run dev`（需配好 keys），再 `npm run eval`
 */
import fs from "node:fs";
import path from "node:path";
import { DiagnosisInsightSchema } from "../lib/schemas/diagnosis";
import { GroundedSolutionSchema, type SolutionSource } from "../lib/schemas/solution";
import { IncidentAnalysisSchema } from "../lib/schemas/incident";
import { cases } from "../evals/cases";
import type { Check, CaseResult, EvalReport } from "../lib/eval/types";
import {
  checkSchema,
  checkCitations,
  checkKeywords,
  checkRecall,
} from "../lib/eval/evaluators";
import { judgeFaithfulness } from "../lib/eval/judge";

const BASE = process.env.EVAL_BASE_URL?.trim() || "http://localhost:3000";
const FAITHFULNESS_THRESHOLD = 0.6;

async function post(p: string, body?: unknown) {
  const r = await fetch(`${BASE}${p}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { ok: r.ok, status: r.status, json: await r.json().catch(() => ({})) };
}
async function get(p: string) {
  const r = await fetch(`${BASE}${p}`);
  return { ok: r.ok, status: r.status, json: await r.json().catch(() => ({})) };
}

function evidenceFor(cites: number[], sources: SolutionSource[]): string {
  return sources
    .filter((s) => cites.includes(s.index))
    .map((s) => s.snippet)
    .join(" / ");
}

/** 对一组「结论 + 引用」做忠实度评判，返回通过率 + Check。 */
async function faithfulness(
  claims: { claim: string; cites: number[] }[],
  sources: SolutionSource[],
): Promise<Check> {
  const judged = claims.filter((c) => c.cites.length > 0);
  if (judged.length === 0)
    return { name: "faithfulness", passed: false, score: 0, detail: "无可评判引用" };
  let supported = 0;
  const fails: string[] = [];
  for (const c of judged) {
    const ev = evidenceFor(c.cites, sources);
    const res = await judgeFaithfulness(c.claim, ev);
    if (res.supported) supported++;
    else fails.push(c.claim.slice(0, 20));
  }
  const rate = supported / judged.length;
  return {
    name: "faithfulness",
    passed: rate >= FAITHFULNESS_THRESHOLD,
    score: Number(rate.toFixed(2)),
    detail: `${supported}/${judged.length} 被证据支撑${fails.length ? `；存疑：${fails.join("、")}` : ""}`,
  };
}

async function runCase(c: (typeof cases)[number]): Promise<CaseResult> {
  const checks: Check[] = [];
  try {
    if (c.type === "diagnosis") {
      const created = await post("/api/diagnosis", {
        sessionId: `eval-${c.id}`,
        companyInfo: c.companyInfo,
        answers: c.answers,
      });
      const id = created.json.id;
      const got = await get(`/api/diagnosis/${id}`);
      const insight = got.json.insight;
      checks.push(checkSchema(DiagnosisInsightSchema, insight));
      checks.push(checkKeywords(JSON.stringify(insight ?? {}), c.expectKeywords));
    } else if (c.type === "solution") {
      const res = await post("/api/solutions", {
        sessionId: `eval-${c.id}`,
        input: c.input,
      });
      const grounded = res.json.grounded;
      const sources: SolutionSource[] = res.json.sources ?? [];
      checks.push(checkSchema(GroundedSolutionSchema, grounded));
      const recs = grounded?.recommendations ?? [];
      checks.push(
        checkCitations(
          recs.map((r: { citations: number[] }) => r.citations),
          sources.length,
        ),
      );
      checks.push(checkKeywords(JSON.stringify(grounded ?? {}), c.expectKeywords));
      checks.push(
        await faithfulness(
          recs.map((r: { scenario: string; solution: string; citations: number[] }) => ({
            claim: `${r.scenario}：${r.solution}`,
            cites: r.citations,
          })),
          sources,
        ),
      );
    } else if (c.type === "incident") {
      const created = await post("/api/incidents", {
        sessionId: `eval-${c.id}`,
        incident: c.incident,
      });
      const id = created.json.id;
      const res = await post(`/api/incidents/${id}/analyze`);
      const analysis = res.json.analysis;
      const sources: SolutionSource[] = res.json.sources ?? [];
      checks.push(checkSchema(IncidentAnalysisSchema, analysis));
      const causes = analysis?.probableCauses ?? [];
      checks.push(
        checkCitations(
          causes.map((x: { citations: number[] }) => x.citations),
          sources.length,
        ),
      );
      const topCause = causes[0]?.cause ?? "";
      checks.push({
        name: "top_cause_relevant",
        passed: c.expectTopCauseKeywords.some((k) => topCause.includes(k)),
        detail: `首要原因：${topCause.slice(0, 30)}`,
      });
      checks.push(
        checkKeywords(JSON.stringify(analysis ?? {}), c.expectKeywords),
      );
      checks.push(
        await faithfulness(
          causes.map((x: { cause: string; basis: string; citations: number[] }) => ({
            claim: `${x.cause}（${x.basis}）`,
            cites: x.citations,
          })),
          sources,
        ),
      );
    } else if (c.type === "retrieval") {
      const res = await post("/api/rag/search", { query: c.query, k: 5 });
      const titles = (res.json.chunks ?? []).map((x: { title: string }) => x.title);
      checks.push(checkRecall(titles, c.expectedTitle));
    }
  } catch (e) {
    return {
      id: c.id,
      type: c.type,
      checks,
      passed: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
  return {
    id: c.id,
    type: c.type,
    checks,
    passed: checks.every((x) => x.passed),
  };
}

async function main() {
  console.log(`\n评测开始 @ ${BASE}\n`);
  const results: CaseResult[] = [];
  for (const c of cases) {
    process.stdout.write(`  running ${c.id} … `);
    const r = await runCase(c);
    results.push(r);
    console.log(r.passed ? "✓" : r.error ? `✗ (${r.error})` : "✗");
    for (const ck of r.checks) {
      const s = ck.score != null ? ` [${ck.score}]` : "";
      console.log(`      ${ck.passed ? "✓" : "✗"} ${ck.name}${s}  ${ck.detail ?? ""}`);
    }
  }

  const byMetric: Record<string, { passed: number; total: number }> = {};
  let totalChecks = 0;
  let passedChecks = 0;
  for (const r of results)
    for (const ck of r.checks) {
      byMetric[ck.name] ??= { passed: 0, total: 0 };
      byMetric[ck.name].total++;
      totalChecks++;
      if (ck.passed) {
        byMetric[ck.name].passed++;
        passedChecks++;
      }
    }

  const report: EvalReport = {
    startedAt: new Date().toISOString(),
    baseUrl: BASE,
    cases: results,
    summary: {
      totalCases: results.length,
      passedCases: results.filter((r) => r.passed).length,
      totalChecks,
      passedChecks,
      byMetric,
    },
  };

  console.log("\n──────── Scorecard ────────");
  console.log(
    `用例通过：${report.summary.passedCases}/${report.summary.totalCases}    检查通过：${passedChecks}/${totalChecks}`,
  );
  for (const [m, v] of Object.entries(byMetric)) {
    console.log(`  ${m.padEnd(20)} ${v.passed}/${v.total}`);
  }

  const dir = path.join(process.cwd(), "evals", "results");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${report.startedAt.replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(process.cwd(), "evals", "latest.json"), JSON.stringify(report, null, 2));
  console.log(`\n报告已写入 evals/latest.json`);

  // 任一用例失败则非零退出（便于 CI 门禁）
  process.exit(report.summary.passedCases === report.summary.totalCases ? 0 : 1);
}

main().catch((e) => {
  console.error("评测异常：", e);
  process.exit(1);
});
