"use client";

import { scoreScale } from "@/data/diagnosis";

interface ScoreSelectorProps {
  value: number | null;
  onChange: (value: number) => void;
  /** 无障碍标签，通常传入对应的问题文案 */
  label: string;
}

/** 单题 1-5 分评分选择器，按钮式单选。 */
export default function ScoreSelector({
  value,
  onChange,
  label,
}: ScoreSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid grid-cols-5 gap-2 sm:flex sm:flex-wrap"
    >
      {scoreScale.map((score) => {
        const active = value === score.value;
        return (
          <button
            key={score.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(score.value)}
            className={`flex flex-col items-center gap-0.5 rounded-lg border px-3 py-2 transition-colors sm:min-w-[68px] ${
              active
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-ink-500 hover:border-brand-200 hover:bg-slate-50"
            }`}
          >
            <span className="text-base font-semibold">{score.value}</span>
            <span className="text-xs">{score.label}</span>
          </button>
        );
      })}
    </div>
  );
}
