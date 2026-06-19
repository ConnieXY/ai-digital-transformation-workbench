import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 聚合返回：异常 + 最新分析 + 任务 + 状态流转事件。 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "db not configured" }, { status: 503 });

  const { data: incident, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !incident) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const [{ data: analysisRow }, { data: tasks }, { data: events }] =
    await Promise.all([
      supabase
        .from("incident_analyses")
        .select("analysis, citations, source, created_at")
        .eq("incident_id", params.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("tasks")
        .select("id, title, department, priority, due, status, description, position")
        .eq("incident_id", params.id)
        .order("position", { ascending: true }),
      supabase
        .from("workflow_events")
        .select("from_state, to_state, actor, note, created_at")
        .eq("incident_id", params.id)
        .order("created_at", { ascending: true }),
    ]);

  return NextResponse.json({
    incident,
    analysis: analysisRow?.analysis ?? null,
    analysisSources: analysisRow?.citations ?? [],
    analysisSource: analysisRow?.source ?? null,
    tasks: tasks ?? [],
    events: events ?? [],
  });
}
