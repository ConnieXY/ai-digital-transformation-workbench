import { NextResponse } from "next/server";
import { getUserClient } from "@/lib/supabase/userClient";
import { enforceRateLimit, identityFromRequest } from "@/lib/ratelimit";
import { runAITask } from "@/lib/ai/task";
import { incidentAnalysisTask } from "@/lib/ai/tasks/incidentAnalysis";
import { transition } from "@/lib/workflow/incident";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const rl = enforceRateLimit(req);
  if (rl)
    return NextResponse.json(
      { error: "rate_limited", detail: "请求过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );

  const supabase = getUserClient(req);
  if (!supabase) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

  const { data: incident, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !incident) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const { output: analysis, sources, source } = await runAITask(
      incidentAnalysisTask,
      incident,
      {
        sessionId: incident.session_id,
        entityId: incident.id,
        quotaKey: identityFromRequest(req),
      },
    );

    await supabase.from("incident_analyses").insert({
      incident_id: incident.id,
      analysis,
      citations: sources,
      source,
    });
    await transition(supabase, incident.id, "analyzed", {
      actor: "ai",
      note: "AI 完成根因分析",
    });

    return NextResponse.json({ analysis, sources, source });
  } catch (e) {
    console.error("[analyze] failed:", e);
    return NextResponse.json({ error: "analyze failed", detail: String(e) }, { status: 500 });
  }
}
