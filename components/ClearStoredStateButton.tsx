"use client";

import { useRouter } from "next/navigation";

interface ClearStoredStateButtonProps {
  label: string;
  storageKeys: string[];
  href: string;
  className: string;
}

/** 定向清理业务草稿/上下文，不触碰匿名身份、额度或统计设置。 */
export default function ClearStoredStateButton({
  label,
  storageKeys,
  href,
  className,
}: ClearStoredStateButtonProps) {
  const router = useRouter();

  function handleClick() {
    for (const key of storageKeys) localStorage.removeItem(key);
    router.push(href);
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {label}
    </button>
  );
}
