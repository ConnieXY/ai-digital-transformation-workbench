import type { DimensionScore } from "@/lib/scoring";

/** 按分数返回进度条颜色：低分预警、中分品牌色、高分通过色。 */
function barColor(average: number): string {
  if (average < 2) return "bg-rose-500";
  if (average < 3) return "bg-amber-500";
  if (average < 4) return "bg-brand-500";
  return "bg-emerald-500";
}

/** 单维度得分条：维度名 + 平均分 + 进度条（满分 5）。 */
export default function ScoreBar({ score }: { score: DimensionScore }) {
  const percent = (score.average / 5) * 100;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-brand-500">
            {score.dimension.index}
          </span>
          <h4 className="text-sm font-semibold text-ink-900">
            {score.dimension.title}
          </h4>
        </div>
        <p className="text-sm font-semibold text-ink-900">
          {score.average.toFixed(1)}
          <span className="text-xs font-normal text-ink-300"> / 5.0</span>
        </p>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor(
            score.average,
          )}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
