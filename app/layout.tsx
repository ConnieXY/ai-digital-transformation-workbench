import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const siteName = "企业 AI 数智化转型工作台";
const siteDescription =
  "从企业效能诊断、行业方案生成，到具体业务场景落地，帮助企业将模糊的 AI 转型诉求转化为可执行方案。";

export const metadata: Metadata = {
  metadataBase: new URL("https://aiworkbench.wowonderwhy.com"),
  title: siteName,
  description: siteDescription,
  openGraph: {
    title: siteName,
    description: siteDescription,
    siteName,
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
