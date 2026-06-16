export interface RoadmapPhase {
  /** 阶段天数，如 "30" */
  day: string;
  title: string;
  subtitle: string;
  /** 配色：决定阶段徽标与强调色 */
  accent: "brand" | "violet" | "emerald";
  tasks: string[];
  roles: string[];
  deliverables: string[];
  metrics: string[];
}

const accentStyles: Record<
  RoadmapPhase["accent"],
  { badge: string; rail: string }
> = {
  brand: { badge: "bg-brand-600", rail: "bg-brand-500" },
  violet: { badge: "bg-violet-600", rail: "bg-violet-500" },
  emerald: { badge: "bg-emerald-600", rail: "bg-emerald-500" },
};

/** 单个字段块：关键任务 / 参与角色 / 交付物 / 衡量指标。 */
function FieldBlock({ label, points }: { label: string; points: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
        {label}
      </p>
      <ul className="mt-2 space-y-1.5">
        {points.map((point) => (
          <li
            key={point}
            className="flex gap-2 text-sm leading-relaxed text-ink-700"
          >
            <span aria-hidden className="mt-1.5 h-1 w-1 flex-none rounded-full bg-ink-300" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 路线图阶段卡片：天数徽标 + 标题 + 四类内容。 */
export default function RoadmapPhaseCard({ phase }: { phase: RoadmapPhase }) {
  const accent = accentStyles[phase.accent];

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className={`h-1 w-full ${accent.rail}`} />
      <div className="flex flex-col gap-5 p-6 sm:p-7">
        <header className="flex items-start gap-4">
          <div
            className={`grid h-14 w-14 flex-none place-items-center rounded-xl text-white ${accent.badge}`}
          >
            <span className="text-xl font-bold leading-none">{phase.day}</span>
            <span className="text-[10px] leading-none">天</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-ink-900">{phase.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              {phase.subtitle}
            </p>
          </div>
        </header>

        <div className="space-y-5 border-t border-slate-100 pt-5">
          <FieldBlock label="关键任务" points={phase.tasks} />
          <FieldBlock label="参与角色" points={phase.roles} />
          <FieldBlock label="交付物" points={phase.deliverables} />
          <FieldBlock label="衡量指标" points={phase.metrics} />
        </div>
      </div>
    </article>
  );
}
