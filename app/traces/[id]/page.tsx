"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/PageShell";

interface Trace {
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
  entity_id: string | null;
  request: unknown;
  response: unknown;
  citations: unknown;
  error: string | null;
  created_at: string;
  redacted?: boolean;
}

function Json({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-ink-700">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function TraceDetailPage() {
  const [mounted, setMounted] = useState(false);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = window.location.pathname.split("/").pop();
    fetch(`/api/traces/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("nf"))))
      .then((d) => setTrace(d.trace))
      .catch(() => setNotFound(true));
  }, []);

  if (!mounted) {
    return (
      <PageShell>
        <div className="container-page py-24" />
      </PageShell>
    );
  }

  if (notFound || !trace) {
    return (
      <PageShell>
        <section className="container-page py-24 text-center">
          <p className="text-sm text-ink-500">
            {notFound ? "未找到该 trace。" : "加载中…"}
          </p>
          <Link
            href="/traces"
            className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
          >
            ← 返回 Trace 列表
          </Link>
        </section>
      </PageShell>
    );
  }

  const meta = [
    { label: "Provider", value: trace.provider ?? "—" },
    { label: "模型", value: trace.model ?? "—" },
    { label: "操作", value: trace.operation },
    { label: "状态", value: trace.status },
    {
      label: "tokens",
      value: `${trace.input_tokens ?? 0} in / ${trace.output_tokens ?? 0} out`,
    },
    { label: "成本", value: trace.cost_usd ? `$${trace.cost_usd}` : "—" },
    { label: "延迟", value: trace.latency_ms ? `${trace.latency_ms} ms` : "—" },
    {
      label: "关联实体",
      value: trace.entity_type
        ? `${trace.entity_type}${trace.entity_id ? ` · ${trace.entity_id.slice(0, 8)}` : ""}`
        : "—",
    },
  ];

  return (
    <PageShell>
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-10 sm:py-12">
          <Link
            href="/traces"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <span aria-hidden>←</span> 返回 Trace 列表
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">
              {trace.step}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                trace.status === "ok"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-600"
              }`}
            >
              {trace.status}
            </span>
          </div>
        </div>
      </section>

      <div className="container-page space-y-8 py-10 sm:py-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {meta.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-card"
            >
              <p className="text-xs font-medium text-ink-500">{m.label}</p>
              <p className="mt-1 text-sm font-semibold text-ink-900">{m.value}</p>
            </div>
          ))}
        </div>

        {trace.error && (
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-rose-600">
              错误
            </h2>
            <pre className="overflow-x-auto rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
              {trace.error}
            </pre>
          </section>
        )}

        {trace.citations != null && (
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-ink-500">
              RAG 检索 / 引用
            </h2>
            <Json value={trace.citations} />
          </section>
        )}

        {trace.redacted ? (
          <section>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">请求 / 响应内容已隐藏</p>
              <p className="mt-1 leading-relaxed text-amber-700">
                实时 trace 的原始 request/response 含用户填写的业务信息，出于数据隔离不在此公开展示；
                上方为可观测元数据（成本 / 延迟 / 状态 / 检索引用）。完整请求与结构化输出请见经审定的{" "}
                <Link href="/traces" className="font-medium underline">
                  示例 trace
                </Link>
                。
              </p>
            </div>
          </section>
        ) : (
          <>
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-ink-500">
                请求 Request
              </h2>
              <Json value={trace.request} />
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-ink-500">
                结构化输出 Response
              </h2>
              <Json value={trace.response} />
            </section>
          </>
        )}
      </div>
    </PageShell>
  );
}
