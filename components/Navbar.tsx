"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

/** 全站统一的顶部导航入口。 */
const navLinks = [
  { href: "/", label: "首页" },
  { href: "/diagnosis", label: "企业诊断" },
  { href: "/solution-builder", label: "行业方案" },
  { href: "/manufacturing-demo", label: "制造业 Demo" },
  { href: "/about", label: "项目说明" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 顶部导航：品牌标识 + 统一入口 + 主行动按钮，当前页高亮。 */
export default function Navbar() {
  const pathname = usePathname() || "/";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-ink-500 sm:inline">
            Demo
          </span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-slate-100 text-ink-900"
                    : "text-ink-500 hover:bg-slate-100 hover:text-ink-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
