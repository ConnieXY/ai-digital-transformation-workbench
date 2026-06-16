import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import FlowStepCard from "@/components/manufacturing/FlowStepCard";
import SampleDataButton from "@/components/SampleDataButton";
import {
  INCIDENT_STORAGE_KEY,
  flowSteps,
  sampleIncident,
} from "@/data/manufacturing";

export const metadata: Metadata = {
  title: "制造业质量异常闭环助手 | 企业 AI 数智化转型工作台",
  description:
    "以质量异常管理为例，展示 AI 如何嵌入制造业一线业务流程，完成从异常上报、原因分析、任务分派到复盘沉淀的闭环。",
};

export default function ManufacturingDemoPage() {
  return (
    <PageShell>
      {/* 顶部说明区 */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-80 max-w-4xl rounded-full bg-gradient-to-r from-brand-100 via-brand-50 to-transparent blur-3xl"
        />

        <div className="container-page relative py-16 sm:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <span aria-hidden>←</span> 返回首页
          </Link>

          <div className="mt-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-xs font-medium text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              03 场景落地 Demo
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
              制造业质量异常闭环助手
            </h1>

            <p className="mt-6 text-base leading-relaxed text-ink-700 sm:text-lg">
              以质量异常管理为例，展示 AI 如何嵌入制造业一线业务流程，完成从异常上报、原因分析、任务分派到复盘沉淀的闭环。
            </p>
          </div>
        </div>
      </section>

      {/* 业务流程 */}
      <section className="container-page py-16 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            质量异常闭环全流程
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-700">
            六个环节首尾相连，让一线异常从上报到沉淀形成完整闭环。
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {flowSteps.map((step, i) => (
            <FlowStepCard
              key={step.id}
              step={step}
              isLast={i === flowSteps.length - 1}
            />
          ))}
        </div>

        {/* 底部主行动区 */}
        <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-card">
          <h3 className="text-xl font-semibold text-ink-900">
            从第一步开始体验
          </h3>
          <p className="max-w-xl text-sm leading-relaxed text-ink-700">
            模拟一线场景，提交一条质量异常，看 AI 如何驱动后续闭环。
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/manufacturing-demo/incident-submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              体验异常上报
              <span aria-hidden className="transition-transform">→</span>
            </Link>
            <SampleDataButton
              entries={[{ key: INCIDENT_STORAGE_KEY, value: sampleIncident }]}
              href="/manufacturing-demo/analysis"
              label="查看示例分析"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-ink-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
