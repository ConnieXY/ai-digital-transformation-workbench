import { NextResponse } from "next/server";
import { getUserClient } from "@/lib/supabase/userClient";
import { enforceRateLimit, identityFromRequest } from "@/lib/ratelimit";
import { runAITask } from "@/lib/ai/task";
import { incidentReviewTask } from "@/lib/ai/tasks/incidentReview";
import { transition } from "@/lib/workflow/incident";
import { computeLoopOutcome } from "@/lib/manufacturing/outcome";
import type { IncidentAnalysis } from "@/lib/schemas/incident";
import { FEATURED, featuredIncidentReview } from "@/data/featured";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 读取最新复盘报告（含异常上下文，供报告页渲染）。 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (params.id === FEATURED.incidentId) {
    return NextResponse.json(featuredIncidentReview);
  }

  const supabase = getUserClient(req);
  if (!supabase) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

  const { data: incident } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!incident) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [{ data: row }, { data: tasks }, { data: events }] = await Promise.all([
    supabase
      .from("review_reports")
      .select("report, source, created_at")
      .eq("incident_id", params.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("tasks").select("status").eq("incident_id", params.id),
    supabase
      .from("workflow_events")
      .select("actor, to_state")
      .eq("incident_id", params.id),
  ]);

  return NextResponse.json({
    incident,
    report: row?.report ?? null,
    source: row?.source ?? null,
    createdAt: row?.created_at ?? null,
    outcome: computeLoopOutcome(tasks ?? [], events ?? []),
  });
}

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
    const { output: report, source } = await runAITask(
      incidentReviewTask,
      {
        incident,
        analysis: (analysisRow?.analysis as IncidentAnalysis) ?? null,
        tasks: tasks ?? [],
      },
      {
        sessionId: incident.session_id,
        entityId: incident.id,
        quotaKey: identityFromRequest(req),
      },
    );

    await supabase.from("review_reports").insert({
      incident_id: incident.id,
      report,
      source,
    });
    await transition(supabase, incident.id, "reviewed", {
      actor: "ai",
      note: "生成复盘报告",
    });

    return NextResponse.json({ report, source });
  } catch (e) {
    console.error("[review] failed:", e);
    return NextResponse.json({ error: "review failed", detail: String(e) }, { status: 500 });
  }
}
