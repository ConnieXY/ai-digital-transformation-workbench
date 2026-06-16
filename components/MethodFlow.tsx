import { Fragment } from "react";
import Link from "next/link";

/** Diagnose → Design → Deliver 三步方法链路，与三大模块一一对应。 */
const steps = [
  {
    index: "01",
    phase: "Diagnose",
    title: "诊断企业现状",
    desc: "评估数智化成熟度，定位核心瓶颈与转型优先级。",
    href: "/diagnosis",
  },
  {
    index: "02",
    phase: "Design",
    title: "生成行业方案",
    desc: "基于行业与痛点，生成解决方案、价值主张与对客材料。",
    href: "/solution-builder",
  },
  {
    index: "03",
    phase: "Deliver",
    title: "落地业务场景",
    desc: "将方案嵌入一线流程，跑通质量异常闭环示范。",
    href: "/manufacturing-demo",
  },
];

/** 首页方法链路：横向流程图，置于三大模块入口上方。 */
export default function MethodFlow() {
  return (
    <section className="container-page pt-16 sm:pt-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          完整方法链路：从诊断到落地
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink-700">
          Diagnose → Design → Deliver，三步把模糊的 AI 转型诉求变成可执行方案。
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        {steps.map((step, i) => (
          <Fragment key={step.phase}>
            <Link
              href={step.href}
              className="group flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-sm font-bold text-brand-600">
                  {step.index}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                  {step.phase}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">
                {step.desc}
              </p>
            </Link>

            {i < steps.length - 1 && (
              <div className="flex items-center justify-center text-xl text-ink-300">
                <span className="rotate-90 sm:rotate-0">→</span>
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
