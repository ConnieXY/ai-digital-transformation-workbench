"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DIAGNOSIS_STORAGE_KEY, SOLUTION_CONTEXT_KEY } from "@/data/diagnosis";
import { SOLUTION_INPUT_KEY } from "@/data/solution";

interface DetectedContext {
  companyInfo?: { companyName?: string };
  result?: { maturity?: { label?: string } };
}

/**
 * 检测模块一传递过来的诊断结果（solution:diagnosis-context）。
 * 命中时在页面顶部提示可基于诊断结果继续生成行业方案。
 */
export default function DiagnosisDetectedBanner() {
  const router = useRouter();
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

  function restartDiagnosis() {
    localStorage.removeItem(DIAGNOSIS_STORAGE_KEY);
    localStorage.removeItem(SOLUTION_CONTEXT_KEY);
    localStorage.removeItem(SOLUTION_INPUT_KEY);
    router.push("/diagnosis/questionnaire");
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-brand-100 bg-brand-50 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
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
      <div className="flex flex-wrap gap-2 sm:flex-none">
        <button
          type="button"
          onClick={restartDiagnosis}
          className="inline-flex items-center justify-center rounded-md border border-brand-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-white"
        >
          重新诊断
        </button>
      </div>
    </div>
  );
}
