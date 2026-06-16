import type { Dimension } from "@/data/diagnosis";

/** 6D 诊断维度卡片：序号徽标 + 维度名称 + 简短说明。 */
export default function DimensionCard({ dimension }: { dimension: Dimension }) {
  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-base font-bold text-brand-600 transition-colors group-hover:bg-brand-100">
        {dimension.index}
      </span>

      <h3 className="mt-4 text-lg font-semibold text-ink-900">
        {dimension.title}
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-ink-700">
        {dimension.description}
      </p>
    </article>
  );
}
