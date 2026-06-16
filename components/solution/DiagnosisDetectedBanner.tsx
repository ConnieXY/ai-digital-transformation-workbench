"use client";

import { useEffect, useState } from "react";
import { SOLUTION_CONTEXT_KEY } from "@/data/diagnosis";

interface DetectedContext {
  companyInfo?: { companyName?: string };
  result?: { maturity?: { label?: string } };
}

/**
 * 检测模块一传递过来的诊断结果（solution:diagnosis-context）。
 * 命中时在页面顶部提示可基于诊断结果继续生成行业方案。
 */
export default function DiagnosisDetectedBanner() {
  const [context, setContext] = useState<DetectedContext | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SOLUTION_CONTEXT_KEY);
      if (raw) setContext(JSON.parse(raw) as DetectedContext);
    } catch {
      setContext(null);
    }
  }, []);

  if (!context) return null;

  const companyName = context.companyInfo?.companyName;
  const maturityLabel = context.result?.maturity?.label;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 px-5 py-4">
      <span
        aria-hidden
        className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full bg-brand-600 text-xs font-bold text-white"
      >
        ✓
      </span>
      <div className="text-sm leading-relaxed text-brand-700">
        <p className="font-semibold">
          已检测到企业诊断结果，可基于诊断结果继续生成行业方案。
        </p>
        {(companyName || maturityLabel) && (
          <p className="mt-0.5 text-brand-600">
            {companyName ? `${companyName}` : "目标企业"}
            {maturityLabel ? ` · 当前成熟度 ${maturityLabel}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
