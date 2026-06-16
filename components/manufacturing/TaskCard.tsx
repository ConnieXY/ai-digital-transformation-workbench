import type { ClosedLoopTask } from "@/lib/taskBuilder";

const priorityStyle: Record<ClosedLoopTask["priority"], string> = {
  高: "bg-rose-100 text-rose-600",
  中: "bg-amber-100 text-amber-700",
  低: "bg-slate-100 text-ink-500",
};

/** 看板任务卡片：任务名称 + 责任部门 + 优先级 + 截止时间 + 状态 + 说明。 */
export default function TaskCard({ task }: { task: ClosedLoopTask }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-card">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug text-ink-900">
          {task.title}
        </h4>
        <span
          className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            priorityStyle[task.priority]
          }`}
        >
          {task.priority}
        </span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-ink-500">
        {task.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
        <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] text-ink-700">
          {task.department}
        </span>
        <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
          {task.due}
        </span>
      </div>
    </article>
  );
}
