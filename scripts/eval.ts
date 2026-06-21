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
  checkCoverage,
  checkKeywords,
  checkRecall,
} from "../lib/eval/evaluators";
import { judgeFaithfulness } from "../lib/eval/judge";
import { cassette, cassetteMode, saveCassette } from "../lib/eval/cassette";

const BASE = process.env.EVAL_BASE_URL?.trim() || "http://localhost:3000";
const FAITHFULNESS_THRESHOLD = 0.8;

// 鉴权：Auth+RLS 后业务路由需带 JWT 才能持久化（拿到 id）。
// 与浏览器一致，用 Supabase 匿名登录换 token；replay 无需联网/鉴权。
let authToken: string | null = null;
async function ensureToken(): Promise<void> {
  if (cassetteMode === "replay" || authToken) return;
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return; // 未配 Supabase → 退化为旧行为（diagnosis/incident 不持久化）
  const r = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: anon, "content-type": "application/json" },
    body: "{}",
  });
  authToken = (await r.json().catch(() => ({})))?.access_token ?? null;
}
function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return authToken ? { ...extra, Authorization: `Bearer ${authToken}` } : extra;
}

// post/get 与 judge 都经 cassette：live 直调；record 真调并录制；replay 仅回放（无服务器/无密钥）。
async function post(p: string, body?: unknown) {
  return cassette(`POST ${p} ${JSON.stringify(body ?? null)}`, async () => {
    const r = await fetch(`${BASE}${p}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: body ? JSON.stringify(body) : undefined,
    });
    return { ok: r.ok, status: r.status, json: await r.json().catch(() => ({})) };
  });
}
async function get(p: string) {
  return cassette(`GET ${p}`, async () => {
    const r = await fetch(`${BASE}${p}`, { headers: authHeaders() });
    return { ok: r.ok, status: r.status, json: await r.json().catch(() => ({})) };
  });
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
  // 完全没有引用 = 诚实弃权（是否 grounding 足够由 coverage 单独考核）
  if (judged.length === 0)
    return { name: "faithfulness", passed: true, score: 1, detail: "无引用（诚实弃权）" };
  let supported = 0;
  const fails: string[] = [];
  for (const c of judged) {
    const ev = evidenceFor(c.cites, sources);
    const res = await cassette(`JUDGE ${c.claim} ||| ${ev}`, () =>
      judgeFaithfulness(c.claim, ev),
    );
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
      if (c.expectGroundingCoverage != null) {
        checks.push(
          checkCoverage(
            recs.map((r: { citations: number[] }) => r.citations),
            c.expectGroundingCoverage,
          ),
        );
      }
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
      if (c.expectGroundingCoverage != null) {
        checks.push(
          checkCoverage(
            causes.map((x: { citations: number[] }) => x.citations),
            c.expectGroundingCoverage,
          ),
        );
      }
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
  const where = cassetteMode === "replay" ? "回放磁带（离线·无密钥）" : BASE;
  console.log(`\n评测开始 [${cassetteMode}] @ ${where}\n`);
  await ensureToken();
  if (cassetteMode !== "replay" && !authToken)
    console.warn("  ⚠ 未取得鉴权 token：diagnosis/incident 将不持久化（检查 Supabase 配置与匿名登录）\n");
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

  // record 模式：把本轮真调录成磁带，供 CI 离线回放
  saveCassette();
  if (cassetteMode === "record") console.log(`\n磁带已写入 evals/cassettes.json`);

  // replay 模式不落地报告文件（CI 只关心退出码），避免污染工作树
  if (cassetteMode !== "replay") {
    const dir = path.join(process.cwd(), "evals", "results");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${report.startedAt.replace(/[:.]/g, "-")}.json`);
    fs.writeFileSync(file, JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(process.cwd(), "evals", "latest.json"), JSON.stringify(report, null, 2));
    console.log(`\n报告已写入 evals/latest.json`);
  }

  // 任一用例失败则非零退出（便于 CI 门禁）
  process.exit(report.summary.passedCases === report.summary.totalCases ? 0 : 1);
}

main().catch((e) => {
  console.error("评测异常：", e);
  process.exit(1);
});
