import Link from "next/link";
import type { GroundedSolution, SolutionSource } from "@/lib/schemas/solution";
import type { SolutionInput } from "@/data/solution";

const docTypeLabel: Record<string, string> = {
  sop: "SOP",
  qm: "质量标准",
  playbook: "方法论",
  "incident-case": "案例库",
};

/** RAG grounded 方案视图：含引用编号与来源清单。 */
export default function GroundedSolutionView({
  input,
  grounded,
  sources,
}: {
  input: SolutionInput;
  grounded: GroundedSolution;
  sources: SolutionSource[];
}) {
  return (
    <PageBody>
      {/* 抬头 */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-12 sm:py-16">
          <Link
            href="/solution-builder/input"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <span aria-hidden>←</span> 返回修改输入
          </Link>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                {input.industry} · RAG grounded 方案
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                {input.industry}数智化解决方案
              </h1>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              AI 生成 · 知识库引用 {sources.length} 条
            </span>
          </div>
        </div>
      </section>

      <div className="container-page space-y-10 py-12 sm:py-16">
        {/* 概述 */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-lg font-bold tracking-tight text-ink-900">
            方案概述
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-700">
            {grounded.summary}
          </p>
        </section>

        {/* 推荐方案 + 引用 */}
        <section>
          <h2 className="mb-4 text-xl font-bold tracking-tight text-ink-900">
            推荐方案（含来源引用）
          </h2>
          <div className="grid gap-4">
            {grounded.recommendations.map((r) => (
              <div
                key={r.scenario}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-ink-900">
                    {r.scenario}
                  </h3>
                  <span className="flex flex-wrap gap-1">
                    {r.citations.map((n) => (
                      <span
                        key={n}
                        className="rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700"
                        title="知识库来源序号"
                      >
                        [{n}]
                      </span>
                    ))}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">
                  {r.solution}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-slate-50 px-2 py-1 text-ink-700">
                    工具：{r.tools}
                  </span>
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
                    价值：{r.expectedValue}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 角色价值 + 风险 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-brand-200 bg-brand-50/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-600">
              给「{grounded.roleValue.role}」的价值
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">
              {grounded.roleValue.value}
            </p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500">
              落地风险与前提
            </h2>
            <ul className="mt-2 space-y-1.5">
              {grounded.risks.map((risk) => (
                <li key={risk} className="flex gap-2 text-sm leading-relaxed text-ink-700">
                  <span aria-hidden className="mt-1.5 h-1 w-1 flex-none rounded-full bg-amber-400" />
                  {risk}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* 来源清单 */}
        <section>
          <h2 className="mb-4 text-xl font-bold tracking-tight text-ink-900">
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

        {/* 底部按钮 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/solution-builder/one-pager"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            生成一页纸方案
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/manufacturing-demo"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
          >
            查看制造业场景 Demo
          </Link>
        </div>
      </div>
    </PageBody>
  );
}

function PageBody({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
