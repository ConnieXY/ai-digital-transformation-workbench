import Link from "next/link";

/** 首页 Hero 区：主标题、副标题与主要行动按钮。 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white">
      {/* 背景装饰渐变 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-80 max-w-4xl rounded-full bg-gradient-to-r from-brand-100 via-brand-50 to-transparent blur-3xl"
      />

      <div className="container-page relative py-20 text-center sm:py-28">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
          企业 AI 数智化转型工作台
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-700 sm:text-lg">
          从企业效能诊断、行业方案生成，到具体业务场景落地，帮助企业将模糊的 AI
          转型诉求转化为可执行方案。
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/diagnosis"
            className="inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 sm:w-auto"
          >
            从企业效能诊断开始
          </Link>
          <Link
            href="#modules"
            className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-ink-700 transition-colors hover:border-slate-400 hover:bg-slate-50 sm:w-auto"
          >
            了解三大模块
          </Link>
        </div>
      </div>
    </section>
  );
}
