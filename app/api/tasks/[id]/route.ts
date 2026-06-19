import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { transition } from "@/lib/workflow/incident";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TASK_STATES = ["待确认", "待分派", "处理中", "待验证", "已关闭"] as const;

const BodySchema = z.object({
  status: z.enum(TASK_STATES).optional(),
  department: z.string().optional(),
});

/** human-in-the-loop：更新任务状态/责任部门，记录为 workflow_event。 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "db not configured" }, { status: 503 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "invalid body", detail: String(e) }, { status: 400 });
  }

  const { data: task } = await supabase
    .from("tasks")
    .select("id, incident_id, title, status, department")
    .eq("id", params.id)
    .single();
  if (!task) return NextResponse.json({ error: "task not found" }, { status: 404 });

  const update: Record<string, string> = {};
  if (body.status) update.status = body.status;
  if (body.department) update.department = body.department;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const { error } = await supabase.from("tasks").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: "update failed", detail: error.message }, { status: 500 });

  // 记录人工操作为工作流事件
  const note =
    body.status && body.status !== task.status
      ? `任务「${task.title}」状态：${task.status} → ${body.status}`
      : `任务「${task.title}」改派：${task.department || "—"} → ${body.department}`;
  const { data: incidentRow } = await supabase
    .from("incidents")
    .select("status")
    .eq("id", task.incident_id)
    .single();
  await supabase.from("workflow_events").insert({
    incident_id: task.incident_id,
    from_state: incidentRow?.status ?? null,
    to_state: incidentRow?.status ?? "in_progress",
    actor: "human",
    note,
  });

  // 任务开始推进 → 异常进入 in_progress
  if (
    incidentRow?.status === "tasks_generated" &&
    body.status &&
    body.status !== "待确认"
  ) {
    await transition(supabase, task.incident_id, "in_progress", {
      actor: "human",
      note: "任务开始处理",
    });
  }

  return NextResponse.json({ ok: true });
}
