import Link from "next/link";
import ClearStoredStateButton from "@/components/ClearStoredStateButton";
import type { ReviewReport } from "@/lib/schemas/incident";
import type { LoopOutcome } from "@/lib/manufacturing/outcome";
import JourneySteps from "@/components/JourneySteps";
import OutcomePanel from "@/components/manufacturing/OutcomePanel";
import { INCIDENT_STORAGE_KEY } from "@/data/manufacturing";

interface IncidentLike {
  product_name?: string | null;
  batch?: string | null;
  incident_type?: string | null;
}

function fmt(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  const v = Number.isNaN(d.getTime()) ? new Date() : d;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}`;
}

/** LLM 生成的结构化复盘报告视图（专业报告排版）。 */
export default function ReviewReportView({
  incident,
  report,
  createdAt,
  outcome,
}: {
  incident: IncidentLike;
  report: ReviewReport;
  createdAt: string | null;
  outcome?: LoopOutcome | null;
}) {
  const reportNo = `QA-${incident.batch || "XXXX"}-${fmt(createdAt).replace(/-/g, "")}`;
  return (
    <>
      <JourneySteps current={2} />
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-12 sm:py-16">
          <Link
            href="/manufacturing-demo/task-board"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <span aria-hidden>←</span> 返回任务看板
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-brand-500">
            步骤 05 · 质量异常复盘报告
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              质量异常复盘报告
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              AI 生成
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-500">
            <span>报告编号：{reportNo}</span>
            <span>生成日期：{fmt(createdAt)}</span>
            <span>关联批次：{incident.batch || "—"}</span>
          </div>
        </div>
      </section>

      <div className="container-page space-y-8 py-12 sm:py-16">
        {outcome && <OutcomePanel outcome={outcome} />}
        <Block index="1" title="异常概况">
          <p className="text-sm leading-relaxed text-ink-700">{report.overview}</p>
        </Block>
        <Block index="2" title="影响范围">
          <p className="text-sm leading-relaxed text-ink-700">{report.impact}</p>
        </Block>
        <Block index="3" title="可能根因">
          <List items={report.rootCauses} />
        </Block>
        <Block index="4" title="处理过程">
          <List items={report.actionsTaken} />
        </Block>
        <Block index="5" title="整改措施">
          <List items={report.corrections} />
        </Block>
        <Block index="6" title="预防建议">
          <List items={report.prevention} />
        </Block>
        <Block index="7" title="沉淀到知识库的案例标签">
          <div className="flex flex-wrap gap-2">
            {report.knowledgeTags.map((t) => (
              <span
                key={t}
                className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700"
              >
                #{t}
              </span>
            ))}
          </div>
        </Block>
        <Block index="8" title="后续追踪指标">
          <div className="grid gap-4 sm:grid-cols-2">
            {report.trackingMetrics.map((m) => (
              <div
                key={m.name}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <p className="text-sm font-semibold text-ink-900">{m.name}</p>
                <p className="mt-1 text-sm text-brand-600">{m.target}</p>
              </div>
            ))}
          </div>
        </Block>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/manufacturing-demo"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            返回制造业 Demo 首页
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
          >
            返回工作台首页
          </Link>
          <ClearStoredStateButton
            label="重新上报"
            storageKeys={[INCIDENT_STORAGE_KEY]}
            href="/manufacturing-demo/incident-submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
          />
        </div>
      </div>
    </>
  );
}

function Block({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-ink-900 text-xs font-bold text-white">
          {index}
        </span>
        <h2 className="text-xl font-bold tracking-tight text-ink-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 rounded-xl border border-slate-200 bg-white p-5">
      {items.map((it) => (
        <li key={it} className="flex gap-2.5 text-sm leading-relaxed text-ink-700">
          <span aria-hidden className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-brand-500" />
          {it}
        </li>
      ))}
    </ul>
  );
}
