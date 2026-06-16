import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import CapabilityCard from "@/components/solution/CapabilityCard";
import DiagnosisDetectedBanner from "@/components/solution/DiagnosisDetectedBanner";
import SampleDataButton from "@/components/SampleDataButton";
import {
  SOLUTION_INPUT_KEY,
  capabilities,
  sampleSolutionInput,
} from "@/data/solution";

export const metadata: Metadata = {
  title: "行业解决方案生成 | 企业 AI 数智化转型工作台",
  description:
    "基于行业、客户画像和业务痛点，快速生成行业痛点地图、解决方案组合、价值主张和客户沟通材料。",
};

export default function SolutionBuilderPage() {
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

          {/* 模块一诊断结果检测提示 */}
          <div className="mt-6">
            <DiagnosisDetectedBanner />
          </div>

          <div className="mt-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-xs font-medium text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              02 行业解决方案生成
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
              行业解决方案生成
            </h1>

            <p className="mt-6 text-base leading-relaxed text-ink-700 sm:text-lg">
              基于行业、客户画像和业务痛点，快速生成行业痛点地图、解决方案组合、价值主张和客户沟通材料。
            </p>
          </div>
        </div>
      </section>

      {/* 可生成内容 */}
      <section className="container-page py-16 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            一次输入，生成完整方案套件
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-700">
            从痛点洞察到对客材料，覆盖售前方案准备的关键产出。
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability) => (
            <CapabilityCard key={capability.id} capability={capability} />
          ))}
        </div>

        {/* 底部主行动区 */}
        <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-card">
          <h3 className="text-xl font-semibold text-ink-900">
            输入行业与客户信息，立即生成方案
          </h3>
          <p className="max-w-xl text-sm leading-relaxed text-ink-700">
            填写行业、客户画像与核心痛点，几分钟内得到一套可对客的解决方案材料。
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/solution-builder/input"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              开始生成方案
              <span aria-hidden className="transition-transform">→</span>
            </Link>
            <SampleDataButton
              entries={[
                { key: SOLUTION_INPUT_KEY, value: sampleSolutionInput },
              ]}
              href="/solution-builder/result"
              label="查看示例方案"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-ink-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
