"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/PageShell";

interface TraceRow {
  id: string;
  step: string;
  provider: string | null;
  model: string | null;
  operation: string;
  status: string;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  latency_ms: number | null;
  entity_type: string | null;
  created_at: string;
}

interface Metrics {
  total: number;
  errors: number;
  totalCostUsd: number;
  totalTokens: number;
  p50: number;
  p95: number;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export default function TracesPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [traces, setTraces] = useState<TraceRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/traces?limit=200")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("unavailable"))))
      .then((d) => {
        setMetrics(d.metrics);
        setTraces(d.traces);
      })
      .catch(() => setError("Trace 数据不可用（需配置后端）。"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-12 sm:py-14">
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <span aria-hidden>←</span> 项目说明
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-brand-500">
            Observability · Trace Viewer
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            AI 调用追踪
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-700">
            记录每一次 LLM / Embedding 调用的输入、结构化输出、RAG 检索、状态、成本与延迟，用于排障、评估与成本治理。
          </p>
        </div>
      </section>

      <div className="container-page py-10 sm:py-12">
        {mounted && metrics && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Metric label="调用次数" value={String(metrics.total)} />
            <Metric
              label="错误率"
              value={
                metrics.total
                  ? `${Math.round((metrics.errors / metrics.total) * 100)}%`
                  : "0%"
              }
              alert={metrics.errors > 0}
            />
            <Metric label="总成本" value={`$${metrics.totalCostUsd}`} />
            <Metric label="总 tokens" value={metrics.totalTokens.toLocaleString()} />
            <Metric label="P50 延迟" value={`${metrics.p50} ms`} />
            <Metric label="P95 延迟" value={`${metrics.p95} ms`} />
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-ink-500">
                  <th className="px-4 py-3 font-medium">时间</th>
                  <th className="px-4 py-3 font-medium">步骤 step</th>
                  <th className="px-4 py-3 font-medium">模型</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">tokens</th>
                  <th className="px-4 py-3 font-medium">成本</th>
                  <th className="px-4 py-3 font-medium">延迟</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-ink-500">
                      加载中…
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-ink-500">
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && traces.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-ink-500">
                      暂无调用记录。去诊断 / 方案 / 制造业 Demo 触发一次真实 AI 调用后再来查看。
                    </td>
                  </tr>
                )}
                {traces.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3 text-ink-500">{fmtTime(t.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/traces/${t.id}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {t.step}
                      </Link>
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-ink-500">
                        {t.operation}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{t.model ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          t.status === "ok"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-600"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      {(t.input_tokens ?? 0) + (t.output_tokens ?? 0) || "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      {t.cost_usd ? `$${t.cost_usd}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      {t.latency_ms ? `${t.latency_ms} ms` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Metric({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p
        className={`mt-1 text-xl font-bold tracking-tight ${
          alert ? "text-rose-600" : "text-ink-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
