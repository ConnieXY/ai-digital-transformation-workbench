import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type IncidentState,
  canTransition,
} from "@/lib/workflow/incidentStates";

// 纯状态定义/校验拆到非 server-only 模块（便于单测）；此处转出以保持既有 import 路径不变。
export {
  INCIDENT_STATES,
  STATE_LABEL,
  canTransition,
  type IncidentState,
} from "@/lib/workflow/incidentStates";

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
