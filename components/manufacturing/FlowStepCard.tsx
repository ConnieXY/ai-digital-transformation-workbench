import type { FlowStep } from "@/data/manufacturing";

/** 流程步骤卡片：序号徽标 + 标题 + 说明；非末位显示流向箭头。 */
export default function FlowStepCard({
  step,
  isLast,
}: {
  step: FlowStep;
  isLast: boolean;
}) {
  return (
    <article className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-base font-bold text-brand-600">
          {step.index}
        </span>
        {!isLast && (
          <span aria-hidden className="text-xl text-ink-300">
            →
          </span>
        )}
      </div>

      <h3 className="mt-4 text-lg font-semibold text-ink-900">{step.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-700">
        {step.description}
      </p>
    </article>
  );
}
