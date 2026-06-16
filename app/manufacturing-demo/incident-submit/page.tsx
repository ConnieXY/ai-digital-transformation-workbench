"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import {
  type IncidentInput,
  INCIDENT_STORAGE_KEY,
  emptyIncident,
  incidentTypeOptions,
  sampleIncident,
  severityOptions,
} from "@/data/manufacturing";

const fieldLabel = "mb-1.5 block text-sm font-medium text-ink-700";
const fieldBase =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

/** 生成 datetime-local 可用的当前时间字符串（YYYY-MM-DDTHH:mm）。 */
function nowLocal(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export default function IncidentSubmitPage() {
  const router = useRouter();
  const [incident, setIncident] = useState<IncidentInput>(emptyIncident);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof IncidentInput>(
    field: K,
    value: IncidentInput[K],
  ) {
    setIncident((prev) => ({ ...prev, [field]: value }));
  }

  function fillSample() {
    setIncident({ ...sampleIncident, discoveredAt: nowLocal() });
    setError(null);
  }

  function handleSubmit() {
    if (!incident.incidentDescription.trim()) {
      setError("请填写异常描述，AI 将据此进行分析。");
      return;
    }
    localStorage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(incident));
    router.push("/manufacturing-demo/analysis");
  }

  return (
    <PageShell>
      {/* 抬头 */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-12 sm:py-14">
          <Link
            href="/manufacturing-demo"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <span aria-hidden>←</span> 返回流程总览
          </Link>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                步骤 01 · 异常上报
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                提交质量异常
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-700">
                填写一线发现的质量异常信息，提交后由 AI 自动结构化并分析。
              </p>
            </div>
            <button
              type="button"
              onClick={fillSample}
              className="inline-flex flex-none items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
            >
              <span aria-hidden>✨</span> 填入示例异常
            </button>
          </div>
        </div>
      </section>

      <div className="container-page py-10 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="productName" className={fieldLabel}>
                  产品名称
                </label>
                <input
                  id="productName"
                  type="text"
                  className={fieldBase}
                  placeholder="例如 智能音箱"
                  value={incident.productName}
                  onChange={(e) => setField("productName", e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="productionLine" className={fieldLabel}>
                  产线
                </label>
                <input
                  id="productionLine"
                  type="text"
                  className={fieldBase}
                  placeholder="例如 A 产线"
                  value={incident.productionLine}
                  onChange={(e) => setField("productionLine", e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="process" className={fieldLabel}>
                  工序
                </label>
                <input
                  id="process"
                  type="text"
                  className={fieldBase}
                  placeholder="例如 组装"
                  value={incident.process}
                  onChange={(e) => setField("process", e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="batch" className={fieldLabel}>
                  批次
                </label>
                <input
                  id="batch"
                  type="text"
                  className={fieldBase}
                  placeholder="例如 B202406"
                  value={incident.batch}
                  onChange={(e) => setField("batch", e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="incidentType" className={fieldLabel}>
                  异常类型
                </label>
                <select
                  id="incidentType"
                  className={fieldBase}
                  value={incident.incidentType}
                  onChange={(e) => setField("incidentType", e.target.value)}
                >
                  <option value="">请选择异常类型</option>
                  {incidentTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="severity" className={fieldLabel}>
                  严重程度
                </label>
                <select
                  id="severity"
                  className={fieldBase}
                  value={incident.severity}
                  onChange={(e) => setField("severity", e.target.value)}
                >
                  <option value="">请选择严重程度</option>
                  {severityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="affectedQuantity" className={fieldLabel}>
                  影响数量
                </label>
                <input
                  id="affectedQuantity"
                  type="number"
                  min={0}
                  className={fieldBase}
                  placeholder="例如 30"
                  value={incident.affectedQuantity}
                  onChange={(e) => setField("affectedQuantity", e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="discoveredAt" className={fieldLabel}>
                  发现时间
                </label>
                <input
                  id="discoveredAt"
                  type="datetime-local"
                  className={fieldBase}
                  value={incident.discoveredAt}
                  onChange={(e) => setField("discoveredAt", e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="reporter" className={fieldLabel}>
                  上报人
                </label>
                <input
                  id="reporter"
                  type="text"
                  className={fieldBase}
                  placeholder="例如 王磊"
                  value={incident.reporter}
                  onChange={(e) => setField("reporter", e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="incidentDescription" className={fieldLabel}>
                  异常描述
                </label>
                <textarea
                  id="incidentDescription"
                  rows={4}
                  className={`${fieldBase} resize-none`}
                  placeholder="描述异常现象、发生位置、可能的相关变化等…"
                  value={incident.incidentDescription}
                  onChange={(e) =>
                    setField("incidentDescription", e.target.value)
                  }
                />
              </div>
            </div>

            {error && (
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <span className="h-2 w-2 flex-none rounded-full bg-amber-400" />
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
              >
                AI 分析异常
                <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
