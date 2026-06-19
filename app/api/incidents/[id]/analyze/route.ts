import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { hasLLM } from "@/lib/env";
import { analyzeIncidentWithAI } from "@/lib/incident/analyze";
import { transition } from "@/lib/workflow/incident";

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

  try {
    const { analysis, sources } = await analyzeIncidentWithAI(incident, {
      sessionId: incident.session_id,
      entityId: incident.id,
    });

    await supabase.from("incident_analyses").insert({
      incident_id: incident.id,
      analysis,
      citations: sources,
      source: "llm",
    });
    await transition(supabase, incident.id, "analyzed", {
      actor: "ai",
      note: "AI 完成根因分析",
    });

    return NextResponse.json({ analysis, sources, source: "llm" });
  } catch (e) {
    console.error("[analyze] failed:", e);
    return NextResponse.json({ error: "analyze failed", detail: String(e) }, { status: 500 });
  }
}
