import type { SolutionCapability } from "@/data/solution";

/** 模块二可生成内容卡片：序号徽标 + 名称 + 说明。 */
export default function CapabilityCard({
  capability,
}: {
  capability: SolutionCapability;
}) {
  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-base font-bold text-brand-600 transition-colors group-hover:bg-brand-100">
        {capability.index}
      </span>

      <h3 className="mt-4 text-lg font-semibold text-ink-900">
        {capability.title}
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-ink-700">
        {capability.description}
      </p>
    </article>
  );
}
