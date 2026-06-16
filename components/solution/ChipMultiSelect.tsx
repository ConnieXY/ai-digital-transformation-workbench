"use client";

interface ChipMultiSelectProps {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}

/** 多选标签组：点击切换选中状态。 */
export default function ChipMultiSelect({
  options,
  selected,
  onToggle,
}: ChipMultiSelectProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm transition-colors ${
              active
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-ink-700 hover:border-brand-200 hover:bg-slate-50"
            }`}
          >
            <span
              aria-hidden
              className={`grid h-4 w-4 place-items-center rounded-[5px] border text-[10px] ${
                active
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-slate-300 text-transparent"
              }`}
            >
              ✓
            </span>
            {option}
          </button>
        );
      })}
    </div>
  );
}
