"use client";

import { useRouter } from "next/navigation";

interface SeedEntry {
  key: string;
  value: unknown;
}

interface SampleDataButtonProps {
  /** 点击时写入 localStorage 的键值对 */
  entries: SeedEntry[];
  /** 写入后跳转的目标地址 */
  href: string;
  label: string;
  className?: string;
}

/**
 * 示例数据按钮：一键写入演示数据到 localStorage 并跳转到结果页，
 * 让访问者无需填表即可看到完整产出。
 */
export default function SampleDataButton({
  entries,
  href,
  label,
  className,
}: SampleDataButtonProps) {
  const router = useRouter();

  function handleClick() {
    try {
      entries.forEach((entry) =>
        localStorage.setItem(entry.key, JSON.stringify(entry.value)),
      );
    } catch {
      // 忽略写入异常，仍尝试跳转
    }
    router.push(href);
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {label}
    </button>
  );
}
