"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import {
  type IncidentInput,
  INCIDENT_STORAGE_KEY,
} from "@/data/manufacturing";
import { analyzeIncident } from "@/lib/incidentAnalyzer";
import type { SolutionSource } from "@/lib/schemas/solution";

const likelihoodStyle: Record<string, string> = {
  高: "bg-rose-100 text-rose-600",
  中: "bg-amber-100 text-amber-700",
  低: "bg-slate-100 text-ink-500",
};

/** 统一的可渲染分析结构（规则与 LLM 输出共同满足）。 */
interface RenderAnalysis {
  incidentType: string;
  scope: string;
  severity: { level: string; rationale: string };
  probableCauses: {
    cause: string;
    likelihood: string;
    basis: string;
    citations?: number[];
  }[];
  responsibleDepartments: string[];
  containment: string[];
  rootCauseInvestigation: string[];
  prevention: string[];
  nextTasks: { title: string; owner: string; due: string }[];
}

const docTypeLabel: Record<string, string> = {
  sop: "SOP",
  qm: "质量标准",
  playbook: "方法论",
  "incident-case": "案例库",
};

export default function AnalysisPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [incident, setIncident] = useState<IncidentInput | null>(null);
  const [analysis, setAnalysis] = useState<RenderAnalysis | null>(null);
  const [sources, setSources] = useState<SolutionSource[]>([]);
  const [source, setSource] = useState<"llm" | "rule" | null>(null);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    setMounted(true);

    const loadLocal = () => {
      try {
        const raw = localStorage.getItem(INCIDENT_STORAGE_KEY);
        if (raw) {
          const inc = JSON.parse(raw) as IncidentInput;
          setIncident(inc);
          setAnalysis(analyzeIncident(inc) as unknown as RenderAnalysis);
          setSource("rule");
        }
      } catch {
        setIncident(null);
      }
    };

    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      loadLocal();
      return;
    }
    setIncidentId(id);
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/incidents/${id}`);
        if (!res.ok) throw new Error("not found");
        const d = await res.json();
        const inc = d.incident;
        setIncident({
          productName: inc.product_name ?? "",
          productionLine: inc.production_line ?? "",
          process: inc.process ?? "",
          batch: inc.batch ?? "",
          incidentType: inc.incident_type ?? "",
          incidentDescription: inc.description ?? "",
          affectedQuantity: inc.affected_quantity ?? "",
          severity: inc.severity ?? "",
          discoveredAt: inc.discovered_at ?? "",
          reporter: inc.reporter ?? "",
        });

        if (d.analysis) {
          setAnalysis(d.analysis as RenderAnalysis);
          setSources((d.analysisSources as SolutionSource[]) ?? []);
          setSource((d.analysisSource as "llm" | "rule") ?? "llm");
        } else {
          // 尚未分析 → 触发 AI 分析
          const ar = await fetch(`/api/incidents/${id}/analyze`, {
            method: "POST",
          });
          const a = await ar.json();
          if (ar.ok && a.analysis) {
            setAnalysis(a.analysis as RenderAnalysis);
            setSources((a.sources as SolutionSource[]) ?? []);
            setSource("llm");
          } else {
            loadLocal();
          }
        }
      } catch {
        loadLocal();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleGenerateTasks() {
    if (!incidentId) {
      router.push("/manufacturing-demo/task-board");
      return;
    }
    setAdvancing(true);
    try {
      await fetch(`/api/incidents/${incidentId}/tasks`, { method: "POST" });
    } catch {
      // 忽略，仍跳转
    }
    router.push(`/manufacturing-demo/task-board?id=${incidentId}`);
  }

  if (!mounted) {
    return (
      <PageShell>
        <div className="container-page py-24" />
      </PageShell>
    );
  }

  if (loading) {
    return (
      <PageShell>
        <section className="container-page py-24 text-center">
          <p className="text-sm text-ink-500">AI 正在检索知识库并分析根因…</p>
        </section>
      </PageShell>
    );
  }

  if (!incident || !analysis) {
    return (
      <PageShell>
        <section className="container-page py-24">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-xl">
              🔍
            </span>
            <h1 className="mt-5 text-xl font-semibold text-ink-900">
              暂无异常数据
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              尚未检测到上报的质量异常。请先提交一条异常，再查看 AI 分析。
            </p>
            <Link
              href="/manufacturing-demo/incident-submit"
              className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              返回上报异常
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* 抬头 */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-12 sm:py-14">
          <Link
            href="/manufacturing-demo/incident-submit"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <span aria-hidden>←</span> 返回上报信息
          </Link>
          {source && (
            <div className="mt-4">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  source === "llm"
                    ? "bg-brand-50 text-brand-700"
                    : "bg-slate-100 text-ink-500"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${source === "llm" ? "bg-brand-500" : "bg-slate-400"}`}
                />
                {source === "llm"
                  ? `AI 生成 · 知识库引用 ${sources.length} 条`
                  : "规则引擎（未接 LLM）"}
              </span>
            </div>
          )}
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-brand-500">
            步骤 02-03 · AI 异常结构化与分析
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            AI 异常分析结果
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-700">
            基于上报的「{incident.productName || "质量异常"}
            」，AI 已完成结构化识别与根因分析，建议如下。
          </p>
        </div>
      </section>

      <div className="container-page py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 1. 异常类型识别 */}
          <AnalysisCard index="1" title="异常类型识别">
            <p className="text-lg font-semibold text-ink-900">
              {analysis.incidentType}
            </p>
          </AnalysisCard>

          {/* 2. 影响范围 */}
          <AnalysisCard index="2" title="影响范围">
            <p className="text-sm leading-relaxed text-ink-700">
              {analysis.scope}
            </p>
          </AnalysisCard>

          {/* 3. 严重等级判断 */}
          <AnalysisCard index="3" title="严重等级判断">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-rose-100 px-3 py-1 text-sm font-bold text-rose-600">
                {analysis.severity.level}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-700">
              {analysis.severity.rationale}
            </p>
          </AnalysisCard>

          {/* 5. 建议责任部门 */}
          <AnalysisCard index="5" title="建议责任部门">
            <div className="flex flex-wrap gap-2">
              {analysis.responsibleDepartments.map((dept) => (
                <span
                  key={dept}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-ink-700"
                >
                  {dept}
                </span>
              ))}
            </div>
          </AnalysisCard>

          {/* 4. 可能原因排序 */}
          <AnalysisCard index="4" title="可能原因排序" wide>
            <ol className="space-y-3">
              {analysis.probableCauses.map((cause, i) => (
                <li
                  key={cause.cause}
                  className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-md bg-white text-xs font-semibold text-ink-500 shadow-sm">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink-900">
                        {cause.cause}
                      </p>
                      <span
                        className={`flex-none rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          likelihoodStyle[cause.likelihood]
                        }`}
                      >
                        可能性 {cause.likelihood}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">
                      {cause.basis}
                    </p>
                    {cause.citations && cause.citations.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {cause.citations.map((n) => (
                          <span
                            key={n}
                            className="rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700"
                            title="知识库来源序号"
                          >
                            [{n}]
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </AnalysisCard>

          {/* 6. 临时遏制措施 */}
          <AnalysisCard index="6" title="临时遏制措施">
            <PointList points={analysis.containment} accent="amber" />
          </AnalysisCard>

          {/* 7. 根因排查建议 */}
          <AnalysisCard index="7" title="根因排查建议">
            <PointList points={analysis.rootCauseInvestigation} accent="brand" />
          </AnalysisCard>

          {/* 8. 长期预防措施 */}
          <AnalysisCard index="8" title="长期预防措施">
            <PointList points={analysis.prevention} accent="emerald" />
          </AnalysisCard>

          {/* 9. 建议下一步任务 */}
          <AnalysisCard index="9" title="建议下一步任务">
            <ul className="space-y-2.5">
              {analysis.nextTasks.map((task) => (
                <li
                  key={task.title}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900">
                      {task.title}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      责任方：{task.owner}
                    </p>
                  </div>
                  <span className="flex-none rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                    {task.due}
                  </span>
                </li>
              ))}
            </ul>
          </AnalysisCard>
        </div>

        {/* 知识库来源（grounded 证据） */}
        {sources.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">
              知识库来源
            </h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
              <ul className="divide-y divide-slate-100">
                {sources.map((s) => (
                  <li key={s.index} className="flex gap-3 p-4">
                    <span className="grid h-6 w-6 flex-none place-items-center rounded-md bg-slate-100 text-xs font-semibold text-ink-500">
                      {s.index}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-ink-900">
                          {s.title}
                        </p>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-ink-500">
                          {docTypeLabel[s.docType] ?? s.docType}
                        </span>
                        <span className="text-[11px] text-ink-300">
                          相似度 {s.similarity}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-ink-500">
                        {s.snippet}…
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 底部按钮 */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleGenerateTasks}
            disabled={advancing}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {advancing ? "生成中…" : "生成闭环任务"}
            {!advancing && <span aria-hidden>→</span>}
          </button>
          <Link
            href="/manufacturing-demo/incident-submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
          >
            返回修改上报信息
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

/** 要点列表：圆点 + 文本，accent 控制圆点颜色。 */
function PointList({
  points,
  accent,
}: {
  points: string[];
  accent: "amber" | "brand" | "emerald";
}) {
  const dot = {
    amber: "bg-amber-400",
    brand: "bg-brand-500",
    emerald: "bg-emerald-500",
  }[accent];
  return (
    <ul className="space-y-2">
      {points.map((point) => (
        <li
          key={point}
          className="flex gap-2.5 text-sm leading-relaxed text-ink-700"
        >
          <span
            aria-hidden
            className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${dot}`}
          />
          {point}
        </li>
      ))}
    </ul>
  );
}

/** 分析结果卡片：序号标记 + 标题 + 内容；wide 时占两列。 */
function AnalysisCard({
  index,
  title,
  wide,
  children,
}: {
  index: string;
  title: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-card ${
        wide ? "lg:col-span-2" : ""
      }`}
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-ink-900 text-xs font-bold text-white">
          {index}
        </span>
        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}
