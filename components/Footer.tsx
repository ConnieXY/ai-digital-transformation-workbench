/** 简洁 Footer：版权信息 + 一句话定位。 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-page flex flex-col items-center justify-between gap-3 py-8 text-sm text-ink-500 sm:flex-row">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>© {year} 企业 AI 数智化转型工作台</span>
          <span aria-hidden className="text-ink-300">
            ·
          </span>
          <span>
            By <span className="font-medium text-ink-700">Connie Wang</span>
          </span>
        </p>
        <p className="text-ink-300">
          让模糊的 AI 转型诉求，变成可执行的方案
        </p>
      </div>
    </footer>
  );
}
