import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import DimensionCard from "@/components/diagnosis/DimensionCard";
import { dimensions } from "@/data/diagnosis";
import { FEATURED } from "@/data/featured";

export const metadata: Metadata = {
  title: "企业 AI 数智化转型诊断助手 | 企业 AI 数智化转型工作台",
  description:
    "通过结构化问卷和 AI 诊断模型，识别组织协同、流程效率、数据管理、知识沉淀、业务经营和 AI 应用成熟度问题。",
};

export default function DiagnosisPage() {
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
              01 企业效能诊断
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
              企业 AI 数智化转型诊断助手
            </h1>

            <p className="mt-6 text-base leading-relaxed text-ink-700 sm:text-lg">
              通过结构化问卷和 AI 诊断模型，帮助企业识别组织协同、流程效率、数据管理、知识沉淀、业务经营和
              AI 应用成熟度问题。
            </p>
          </div>
        </div>
      </section>

      {/* 6D 诊断模型 */}
      <section className="container-page py-16 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            6D 数智化成熟度诊断模型
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-700">
            从六个核心维度全面评估企业的数智化成熟度，定位瓶颈与转型优先级。
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dimensions.map((dimension) => (
            <DimensionCard key={dimension.id} dimension={dimension} />
          ))}
        </div>

        {/* 底部主行动区 */}
        <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-card">
          <h3 className="text-xl font-semibold text-ink-900">
            准备好评估你的企业了吗？
          </h3>
          <p className="max-w-xl text-sm leading-relaxed text-ink-700">
            完成一份结构化问卷，约 5 分钟，即可获得专属的数智化成熟度诊断。
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/diagnosis/questionnaire"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              开始诊断
              <span aria-hidden className="transition-transform">→</span>
            </Link>
            <Link
              href={`/diagnosis/report?id=${FEATURED.diagnosisId}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-ink-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
            >
              查看真实 AI 示例
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
