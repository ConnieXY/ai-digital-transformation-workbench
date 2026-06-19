import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** 质量异常闭环状态机 */
export const INCIDENT_STATES = [
  "reported", // 已上报
  "analyzed", // AI 已分析
  "tasks_generated", // 已生成闭环任务
  "in_progress", // 处理中
  "reviewed", // 已复盘
  "closed", // 已关闭
] as const;

export type IncidentState = (typeof INCIDENT_STATES)[number];

export const STATE_LABEL: Record<IncidentState, string> = {
  reported: "已上报",
  analyzed: "已分析",
  tasks_generated: "已生成任务",
  in_progress: "处理中",
  reviewed: "已复盘",
  closed: "已关闭",
};

/** 允许的状态流转（同态视为幂等放行） */
const ALLOWED: Record<IncidentState, IncidentState[]> = {
  reported: ["analyzed"],
  analyzed: ["tasks_generated"],
  tasks_generated: ["in_progress", "reviewed"],
  in_progress: ["reviewed"],
  reviewed: ["closed"],
  closed: [],
};

export function canTransition(from: IncidentState, to: IncidentState): boolean {
  if (from === to) return true;
  return ALLOWED[from]?.includes(to) ?? false;
}

/**
 * 执行状态流转：校验合法性 → 更新 incidents.status → 写 workflow_events（审计）。
 * actor 区分 ai / human，支撑 human-in-the-loop 追溯。
 */
export async function transition(
  supabase: SupabaseClient,
  incidentId: string,
  to: IncidentState,
  opts: { actor?: "ai" | "human"; note?: string } = {},
): Promise<void> {
  const { data: cur } = await supabase
    .from("incidents")
    .select("status")
    .eq("id", incidentId)
    .single();
  const from = (cur?.status ?? "reported") as IncidentState;

  if (!canTransition(from, to)) {
    throw new Error(`非法状态流转：${from} → ${to}`);
  }

  if (from !== to) {
    await supabase.from("incidents").update({ status: to }).eq("id", incidentId);
  }
  await supabase.from("workflow_events").insert({
    incident_id: incidentId,
    from_state: from,
    to_state: to,
    actor: opts.actor ?? "ai",
    note: opts.note ?? null,
  });
}
