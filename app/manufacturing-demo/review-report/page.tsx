"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import ReviewReportView from "@/components/manufacturing/ReviewReportView";
import {
  type IncidentInput,
  INCIDENT_STORAGE_KEY,
} from "@/data/manufacturing";
import type { ReviewReport } from "@/lib/schemas/incident";
import { analyzeIncident } from "@/lib/incidentAnalyzer";
import { buildTasks, taskColumns } from "@/lib/taskBuilder";

const statusStyle: Record<string, string> = {
  待确认: "bg-slate-100 text-ink-500",
  待分派: "bg-amber-100 text-amber-700",
  处理中: "bg-brand-100 text-brand-700",
  待验证: "bg-violet-100 text-violet-700",
  已关闭: "bg-emerald-100 text-emerald-700",
};

/** 追踪指标（mock，结合常见质量管理目标）。 */
const trackingMetrics = [
  { name: "该批次不良率", target: "目标 ≤ 0.5%" },
  { name: "异常处理闭环时长", target: "目标 ≤ 72 小时" },
  { name: "新供应商来料合格率", target: "目标 ≥ 99%" },
  { name: "同类异常季度复发次数", target: "目标 0 次" },
];

function formatDate(iso: string): string {
  const d = iso ? new Date(iso) : new Date();
  const valid = !Number.isNaN(d.getTime()) ? d : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${valid.getFullYear()}-${pad(valid.getMonth() + 1)}-${pad(
    valid.getDate(),
  )}`;
}

interface LlmReportPayload {
  incident: { product_name?: string | null; batch?: string | null; incident_type?: string | null };
  report: ReviewReport;
  createdAt: string | null;
}

export default function ReviewReportPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [incident, setIncident] = useState<IncidentInput | null>(null);
  const [llm, setLlm] = useState<LlmReportPayload | null>(null);

  useEffect(() => {
    setMounted(true);
    const loadLocal = () => {
      try {
        const raw = localStorage.getItem(INCIDENT_STORAGE_KEY);
        if (raw) setIncident(JSON.parse(raw) as IncidentInput);
      } catch {
        setIncident(null);
      }
    };

    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      loadLocal();
      return;
    }
    setLoading(true);
    (async () => {
      try {
        let res = await fetch(`/api/incidents/${id}/review`);
        let d = res.ok ? await res.json() : null;
        // 尚未生成 → 触发一次生成
        if (d && !d.report) {
          const g = await fetch(`/api/incidents/${id}/review`, { method: "POST" });
          if (g.ok) {
            res = await fetch(`/api/incidents/${id}/review`);
            d = res.ok ? await res.json() : d;
          }
        }
        if (d?.report) {
          setLlm({ incident: d.incident, report: d.report, createdAt: d.createdAt });
        } else {
          loadLocal();
        }
      } catch {
        loadLocal();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
          <p className="text-sm text-ink-500">正在生成复盘报告…</p>
        </section>
      </PageShell>
    );
  }

  if (llm) {
    return (
      <PageShell>
        <ReviewReportView
          incident={llm.incident}
          report={llm.report}
          createdAt={llm.createdAt}
        />
      </PageShell>
    );
  }

  if (!incident) {
    return (
      <PageShell>
        <section className="container-page py-24">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-xl">
              📄
            </span>
            <h1 className="mt-5 text-xl font-semibold text-ink-900">
              暂无异常数据
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              复盘报告需基于已处理的异常生成。请先提交异常并完成闭环流程。
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

  const analysis = analyzeIncident(incident);
  const tasks = buildTasks(incident);
  const reportDate = formatDate(incident.discoveredAt);
  const reportNo = `QA-${incident.batch || "XXXX"}-${reportDate.replace(/-/g, "")}`;

  const overviewItems = [
    { label: "产品名称", value: incident.productName || "—" },
    { label: "产线 / 工序", value: `${incident.productionLine || "—"} / ${incident.process || "—"}` },
    { label: "批次", value: incident.batch || "—" },
    { label: "异常类型", value: analysis.incidentType },
    { label: "影响数量", value: incident.affectedQuantity || "—" },
    { label: "上报人", value: incident.reporter || "—" },
  ];

  // 案例标签：清洗空格后去重
  const knowledgeTags = Array.from(
    new Set(
      [
        "质量异常闭环",
        analysis.incidentType,
        incident.batch,
        incident.productionLine,
        incident.process,
        incident.productName,
        "来料波动",
      ]
        .filter(Boolean)
        .map((t) => (t as string).replace(/\s+/g, "")),
    ),
  );

  return (
    <PageShell>
      {/* 报告抬头 */}
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
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            质量异常复盘报告
          </h1>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-500">
            <span>报告编号：{reportNo}</span>
            <span>生成日期：{reportDate}</span>
            <span>关联批次：{incident.batch || "—"}</span>
          </div>
        </div>
      </section>

      <div className="container-page space-y-10 py-12 sm:py-16">
        {/* 1. 异常概况 */}
        <ReportSection index="1" title="异常概况">
          <div className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {overviewItems.map((item) => (
              <div key={item.label} className="bg-white p-5">
                <p className="text-xs font-medium text-ink-500">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-ink-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-medium text-ink-500">异常描述</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
              {incident.incidentDescription || "—"}
            </p>
          </div>
        </ReportSection>

        {/* 2. 影响范围 */}
        <ReportSection index="2" title="影响范围">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm leading-relaxed text-ink-700">
              {analysis.scope}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-1.5 text-sm text-rose-600">
              <span className="font-semibold">严重等级</span>
              <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold">
                {analysis.severity.level}
              </span>
            </div>
          </div>
        </ReportSection>

        {/* 3. 可能根因 */}
        <ReportSection index="3" title="可能根因">
          <ol className="space-y-3">
            {analysis.probableCauses.map((cause, i) => (
              <li
                key={cause.cause}
                className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <span className="grid h-6 w-6 flex-none place-items-center rounded-md bg-slate-100 text-xs font-semibold text-ink-500">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink-900">
                      {cause.cause}
                    </p>
                    <span className="flex-none text-xs font-semibold text-ink-500">
                      可能性 {cause.likelihood}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">
                    {cause.basis}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </ReportSection>

        {/* 4. 处理过程 */}
        <ReportSection index="4" title="处理过程">
          <ol className="relative space-y-4 border-l border-slate-200 pl-6">
            {[...tasks]
              .sort(
                (a, b) =>
                  taskColumns.indexOf(a.status) - taskColumns.indexOf(b.status),
              )
              .map((task) => (
                <li key={task.id} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-500"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink-900">
                      {task.title}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        statusStyle[task.status]
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">
                    {task.description}（责任方：{task.department}）
                  </p>
                </li>
              ))}
          </ol>
        </ReportSection>

        {/* 5. 整改措施 */}
        <ReportSection index="5" title="整改措施">
          <PointList points={analysis.containment} />
        </ReportSection>

        {/* 6. 预防建议 */}
        <ReportSection index="6" title="预防建议">
          <PointList points={analysis.prevention} />
        </ReportSection>

        {/* 7. 沉淀到知识库的案例标签 */}
        <ReportSection
          index="7"
          title="沉淀到知识库的案例标签"
          subtitle="本案例已沉淀至质量知识库，便于后续同类异常检索与复用。"
        >
          <div className="flex flex-wrap gap-2">
            {knowledgeTags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        </ReportSection>

        {/* 8. 后续追踪指标 */}
        <ReportSection index="8" title="后续追踪指标">
          <div className="grid gap-4 sm:grid-cols-2">
            {trackingMetrics.map((metric) => (
              <div
                key={metric.name}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <p className="text-sm font-semibold text-ink-900">
                  {metric.name}
                </p>
                <p className="mt-1 text-sm text-brand-600">{metric.target}</p>
              </div>
            ))}
          </div>
        </ReportSection>

        {/* 底部按钮 */}
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
        </div>
      </div>
    </PageShell>
  );
}

/** 要点列表：圆点 + 文本。 */
function PointList({ points }: { points: string[] }) {
  return (
    <ul className="space-y-2 rounded-xl border border-slate-200 bg-white p-5">
      {points.map((point) => (
        <li
          key={point}
          className="flex gap-2.5 text-sm leading-relaxed text-ink-700"
        >
          <span
            aria-hidden
            className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-brand-500"
          />
          {point}
        </li>
      ))}
    </ul>
  );
}

/** 报告区块：序号标记 + 标题 + 可选副标题。 */
function ReportSection({
  index,
  title,
  subtitle,
  children,
}: {
  index: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-ink-900 text-xs font-bold text-white">
          {index}
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink-900">
            {title}
          </h2>
          {subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
