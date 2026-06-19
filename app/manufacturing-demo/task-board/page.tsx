"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import TaskCard from "@/components/manufacturing/TaskCard";
import {
  type IncidentInput,
  INCIDENT_STORAGE_KEY,
} from "@/data/manufacturing";
import { buildTasks, taskColumns } from "@/lib/taskBuilder";

interface DbTask {
  id: string;
  title: string;
  department: string | null;
  priority: "高" | "中" | "低";
  due: string | null;
  status: string;
  description: string | null;
}

const priorityStyle: Record<string, string> = {
  高: "bg-rose-100 text-rose-600",
  中: "bg-amber-100 text-amber-700",
  低: "bg-slate-100 text-ink-500",
};

export default function TaskBoardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [dbTasks, setDbTasks] = useState<DbTask[] | null>(null);
  const [ruleIncident, setRuleIncident] = useState<IncidentInput | null>(null);
  const [reviewing, setReviewing] = useState(false);

  async function loadFromApi(id: string) {
    const res = await fetch(`/api/incidents/${id}`);
    if (!res.ok) throw new Error("not found");
    const d = await res.json();
    setDbTasks(d.tasks as DbTask[]);
  }

  useEffect(() => {
    setMounted(true);
    const loadLocal = () => {
      try {
        const raw = localStorage.getItem(INCIDENT_STORAGE_KEY);
        if (raw) setRuleIncident(JSON.parse(raw) as IncidentInput);
      } catch {
        setRuleIncident(null);
      }
    };
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      loadLocal();
      return;
    }
    setIncidentId(id);
    setLoading(true);
    loadFromApi(id)
      .catch(loadLocal)
      .finally(() => setLoading(false));
  }, []);

  async function moveTask(taskId: string, status: string) {
    if (!incidentId) return;
    // 乐观更新
    setDbTasks((prev) =>
      prev ? prev.map((t) => (t.id === taskId ? { ...t, status } : t)) : prev,
    );
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadFromApi(incidentId);
    } catch {
      // 失败则回拉
      await loadFromApi(incidentId).catch(() => {});
    }
  }

  async function handleReview() {
    if (!incidentId) {
      router.push("/manufacturing-demo/review-report");
      return;
    }
    setReviewing(true);
    try {
      await fetch(`/api/incidents/${incidentId}/review`, { method: "POST" });
    } catch {
      // 忽略，仍跳转
    }
    router.push(`/manufacturing-demo/review-report?id=${incidentId}`);
  }

  if (!mounted) {
    return (
      <PageShell>
        <div className="container-page py-24" />
      </PageShell>
    );
  }

  if (loading) {
    return (
      <PageShell>
        <section className="container-page py-24 text-center">
          <p className="text-sm text-ink-500">加载任务看板…</p>
        </section>
      </PageShell>
    );
  }

  // 规则兜底任务（无 id）
  const ruleTasks = ruleIncident ? buildTasks(ruleIncident) : null;
  const hasData = dbTasks !== null || ruleTasks !== null;

  if (!hasData) {
    return (
      <PageShell>
        <section className="container-page py-24">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-xl">
              🗂️
            </span>
            <h1 className="mt-5 text-xl font-semibold text-ink-900">
              暂无任务数据
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              请先提交异常、完成 AI 分析并生成闭环任务。
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

  const total = dbTasks ? dbTasks.length : ruleTasks!.length;
  const editable = dbTasks !== null;

  return (
    <PageShell>
      {/* 抬头 */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-12 sm:py-14">
          <Link
            href={incidentId ? `/manufacturing-demo/analysis?id=${incidentId}` : "/manufacturing-demo/analysis"}
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
            共 {total} 项闭环任务，按处理状态分布。
            {editable && "可直接在卡片上调整状态，操作会记录到工作流事件（human-in-the-loop）。"}
          </p>
        </div>
      </section>

      {/* 看板 */}
      <section className="container-page py-10 sm:py-12">
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[1000px] grid-cols-5 gap-4">
            {taskColumns.map((column) => {
              const columnTasks = editable
                ? dbTasks!.filter((t) => t.status === column)
                : ruleTasks!.filter((t) => t.status === column);
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
                    {columnTasks.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-ink-300">
                        暂无任务
                      </div>
                    ) : editable ? (
                      (columnTasks as DbTask[]).map((task) => (
                        <article
                          key={task.id}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold leading-snug text-ink-900">
                              {task.title}
                            </h4>
                            <span
                              className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                priorityStyle[task.priority] ?? priorityStyle["低"]
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
                            <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] text-ink-700">
                              {task.department}
                            </span>
                            {task.due && (
                              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                                {task.due}
                              </span>
                            )}
                          </div>
                          <label className="mt-3 block">
                            <span className="sr-only">调整状态</span>
                            <select
                              value={task.status}
                              onChange={(e) => moveTask(task.id, e.target.value)}
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-ink-700 focus:border-brand-400 focus:outline-none"
                            >
                              {taskColumns.map((c) => (
                                <option key={c} value={c}>
                                  移动到：{c}
                                </option>
                              ))}
                            </select>
                          </label>
                        </article>
                      ))
                    ) : (
                      (columnTasks as ReturnType<typeof buildTasks>).map(
                        (task) => <TaskCard key={task.id} task={task} />,
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={handleReview}
            disabled={reviewing}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reviewing ? "生成中…" : "生成复盘报告"}
            {!reviewing && <span aria-hidden>→</span>}
          </button>
        </div>
      </section>
    </PageShell>
  );
}
