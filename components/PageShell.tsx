import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

/** 整体页面骨架：顶部导航 + 主内容区 + Footer，所有页面复用。 */
export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
