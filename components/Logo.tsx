import Link from "next/link";

/** 品牌标识：抽象方块图标 + 文字，用于导航栏与 Footer。 */
export default function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-sm transition-transform group-hover:scale-105"
      >
        AI
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-ink-900">
        企业数智化转型工作台
      </span>
    </Link>
  );
}
