"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import TaskCard from "@/components/manufacturing/TaskCard";
import {
  type IncidentInput,
  INCIDENT_STORAGE_KEY,
} from "@/data/manufacturing";
import { buildTasks, taskColumns } from "@/lib/taskBuilder";

export default function TaskBoardPage() {
  const [mounted, setMounted] = useState(false);
  const [incident, setIncident] = useState<IncidentInput | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(INCIDENT_STORAGE_KEY);
      if (raw) setIncident(JSON.parse(raw) as IncidentInput);
    } catch {
      setIncident(null);
    }
  }, []);

  if (!mounted) {
    return (
      <PageShell>
        <div className="container-page py-24" />
      </PageShell>
    );
  }

  if (!incident) {
    return (
      <PageShell>
        <section className="container-page py-24">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-xl">
              🗂️
            </span>
            <h1 className="mt-5 text-xl font-semibold text-ink-900">
              暂无异常数据
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              尚未检测到异常分析结果。请先提交异常并完成 AI 分析。
            </p>
            <Link
              href="/manufacturing-demo/incident-submit"
              className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              返回上报异常
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </PageShell>
    );
  }

  const tasks = buildTasks(incident);

  return (
    <PageShell>
      {/* 抬头 */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-12 sm:py-14">
          <Link
            href="/manufacturing-demo/analysis"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <span aria-hidden>←</span> 返回 AI 分析
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-brand-500">
            步骤 04 · 闭环任务看板
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            质量异常闭环任务看板
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-700">
            AI 已根据分析结果生成 {tasks.length} 项闭环任务，按处理状态分布在看板各列。
          </p>
        </div>
      </section>

      {/* 看板 */}
      <section className="container-page py-10 sm:py-12">
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[1000px] grid-cols-5 gap-4">
            {taskColumns.map((column) => {
              const columnTasks = tasks.filter((t) => t.status === column);
              return (
                <div key={column} className="flex flex-col">
                  <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2">
                    <span className="text-sm font-semibold text-ink-900">
                      {column}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-ink-500">
                      {columnTasks.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {columnTasks.length > 0 ? (
                      columnTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-ink-300">
                        暂无任务
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/manufacturing-demo/review-report"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            生成复盘报告
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
