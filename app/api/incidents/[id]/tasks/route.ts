import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { transition } from "@/lib/workflow/incident";
import type { IncidentAnalysis } from "@/lib/schemas/incident";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 根据 AI 分析的 nextTasks 物化为闭环任务（初始全部「待确认」，由人推进）。 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "db not configured" }, { status: 503 });

  const { data: analysisRow } = await supabase
    .from("incident_analyses")
    .select("analysis")
    .eq("incident_id", params.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!analysisRow?.analysis) {
    return NextResponse.json({ error: "no analysis yet" }, { status: 409 });
  }
  const analysis = analysisRow.analysis as IncidentAnalysis;

  // 幂等：先清空该异常已有任务
  await supabase.from("tasks").delete().eq("incident_id", params.id);

  const rows = analysis.nextTasks.map((t, i) => ({
    incident_id: params.id,
    title: t.title,
    department: t.owner,
    priority: t.priority,
    due: t.due,
    status: "待确认",
    description: null,
    position: i,
  }));
  const { data: inserted, error } = await supabase
    .from("tasks")
    .insert(rows)
    .select("id, title, department, priority, due, status, position");
  if (error) {
    return NextResponse.json({ error: "insert tasks failed", detail: error.message }, { status: 500 });
  }

  await transition(supabase, params.id, "tasks_generated", {
    actor: "ai",
    note: `生成 ${rows.length} 项闭环任务`,
  });

  return NextResponse.json({ tasks: inserted ?? [] });
}
