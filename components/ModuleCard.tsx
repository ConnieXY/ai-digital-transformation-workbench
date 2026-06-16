import Link from "next/link";
import type { WorkbenchModule } from "@/data/modules";

/** 单个模块卡片：序号、标题、描述与跳转按钮。 */
export default function ModuleCard({ module }: { module: WorkbenchModule }) {
  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <span className="text-3xl font-bold tracking-tight text-brand-500">
          {module.index}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-ink-500">
          {module.tag}
        </span>
      </div>

      <h3 className="mt-5 text-xl font-semibold text-ink-900">
        {module.title}
      </h3>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-700">
        {module.description}
      </p>

      <Link
        href={module.href}
        className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition-colors group-hover:border-brand-200 group-hover:bg-brand-50 group-hover:text-brand-700"
      >
        {module.cta}
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </Link>
    </article>
  );
}
