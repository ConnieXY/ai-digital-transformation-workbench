import Link from "next/link";

interface ModulePlaceholderProps {
  index: string;
  title: string;
  description: string;
}

/**
 * 模块内页占位：第一版暂不实现复杂功能，
 * 统一展示标题、说明与「建设中」状态，并提供返回首页入口。
 */
export default function ModulePlaceholder({
  index,
  title,
  description,
}: ModulePlaceholderProps) {
  return (
    <section className="container-page py-20 sm:py-28">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
        >
          <span aria-hidden>←</span> 返回首页
        </Link>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-card sm:p-10">
          <span className="text-4xl font-bold tracking-tight text-brand-500">
            {index}
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-900">
            {title}
          </h1>

          <p className="mt-4 text-base leading-relaxed text-ink-700">
            {description}
          </p>

          <div className="mt-8 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-ink-500">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            模块功能建设中，第一版仅提供入口与说明。
          </div>
        </div>
      </div>
    </section>
  );
}
