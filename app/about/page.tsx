import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "项目说明 | 企业 AI 数智化转型工作台",
  description:
    "企业 AI 数智化转型工作台的产品定位、方法链路与能力模型说明。",
};

const methodSteps = [
  {
    phase: "Diagnose",
    title: "诊断企业现状",
    desc: "通过 6D 成熟度问卷评估现状，定位核心瓶颈与转型优先级。",
  },
  {
    phase: "Design",
    title: "生成行业方案",
    desc: "基于行业、客户画像与痛点，生成解决方案、价值主张与对客材料。",
  },
  {
    phase: "Deliver",
    title: "落地业务场景",
    desc: "以制造业质量异常闭环为例，展示 AI 如何嵌入一线业务流程。",
  },
];

export default function AboutPage() {
  return (
    <PageShell>
      {/* 抬头 */}
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
              项目说明
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
              关于本工作台
            </h1>
            <p className="mt-6 text-base leading-relaxed text-ink-700 sm:text-lg">
              企业 AI 数智化转型工作台，帮助企业将模糊的 AI 转型诉求，转化为从诊断、方案到落地的可执行路径。
            </p>
          </div>
        </div>
      </section>

      <div className="container-page space-y-12 py-16 sm:py-20">
        {/* 产品定位 */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight text-ink-900">
            可以解决的问题
          </h2>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            <p className="text-base leading-relaxed text-ink-700">
              许多企业对 AI
              转型有诉求，却卡在「不知从何下手」：现状不清、方案空泛、难以落地。本工作台围绕
              <span className="font-semibold text-ink-900">
                {" "}
                诊断 → 方案 → 落地{" "}
              </span>
              的方法链路，把抽象目标拆解为结构化、可执行的步骤，让每一步都有清晰产出。
            </p>
          </div>
        </section>

        {/* 方法链路 */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight text-ink-900">
            方法链路
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {methodSteps.map((step) => (
              <div
                key={step.phase}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                  {step.phase}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-ink-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 使用的能力模型 */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight text-ink-900">
            使用的能力模型
          </h2>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
              {[
                "业务理解",
                "问题结构化",
                "AI 工具应用",
                "产品化表达",
                "推进落地",
              ].map((cap, i, arr) => (
                <Fragment key={cap}>
                  <span className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                    {cap}
                  </span>
                  {i < arr.length - 1 && (
                    <span aria-hidden className="text-ink-300">
                      ×
                    </span>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* 技术实现 */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight text-ink-900">
            技术实现
          </h2>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            <div className="flex flex-wrap gap-2">
              {[
                "Next.js",
                "TypeScript",
                "Supabase / pgvector",
                "OpenAI 兼容 LLM（DeepSeek）",
                "RAG · 向量检索",
                "Claude Code",
              ].map((tech) => (
                <span
                  key={tech}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-ink-700"
                >
                  {tech}
                </span>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="https://github.com/ConnieXY/ai-digital-transformation-workbench"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ink-700"
              >
                源码 GitHub
                <span aria-hidden>↗</span>
              </a>
              <a
                href="https://github.com/ConnieXY/ai-digital-transformation-workbench/blob/main/docs/ARCHITECTURE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
              >
                架构与决策（ADR）
                <span aria-hidden>↗</span>
              </a>
              <Link
                href="/traces"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
              >
                Trace Viewer
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 后续迭代方向 */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight text-ink-900">
            后续迭代方向
          </h2>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            <ul className="space-y-2.5">
              {[
                "组织级多租户与团队协作：多人共享同一份数据、角色与权限。",
                "支持导入企业自有知识库，让方案更「懂你的业务」。",
                "流式输出与后台任务：更快的交互、长流程不阻塞。",
                "与企业内部系统（ERP / MES 等）集成。",
                "扩展更多行业的深度场景（零售、物流、服务闭环）。",
                "方案与复盘报告一键导出（PDF / PPT）。",
              ].map((point) => (
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
          </div>
        </section>

        {/* 行动区 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/diagnosis"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            从企业诊断开始
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
          >
            返回首页
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
