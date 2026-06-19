import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { hasLLM } from "@/lib/env";
import { generateReviewReport } from "@/lib/incident/review";
import { transition } from "@/lib/workflow/incident";
import type { IncidentAnalysis } from "@/lib/schemas/incident";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "db not configured" }, { status: 503 });
  if (!hasLLM) return NextResponse.json({ error: "llm not configured" }, { status: 503 });

  const { data: incident, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !incident) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [{ data: analysisRow }, { data: tasks }] = await Promise.all([
    supabase
      .from("incident_analyses")
      .select("analysis")
      .eq("incident_id", params.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("title, department, status")
      .eq("incident_id", params.id)
      .order("position", { ascending: true }),
  ]);

  try {
    const report = await generateReviewReport(
      incident,
      (analysisRow?.analysis as IncidentAnalysis) ?? null,
      tasks ?? [],
      { sessionId: incident.session_id, entityId: incident.id },
    );

    await supabase.from("review_reports").insert({
      incident_id: incident.id,
      report,
      source: "llm",
    });
    await transition(supabase, incident.id, "reviewed", {
      actor: "ai",
      note: "生成复盘报告",
    });

    return NextResponse.json({ report, source: "llm" });
  } catch (e) {
    console.error("[review] failed:", e);
    return NextResponse.json({ error: "review failed", detail: String(e) }, { status: 500 });
  }
}
