import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  sessionId: z.string().min(1),
  incident: z.object({
    productName: z.string(),
    productionLine: z.string(),
    process: z.string(),
    batch: z.string(),
    incidentType: z.string(),
    incidentDescription: z.string(),
    affectedQuantity: z.string(),
    severity: z.string(),
    discoveredAt: z.string(),
    reporter: z.string(),
  }),
});

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "invalid body", detail: String(e) }, { status: 400 });
  }
  const { sessionId, incident } = body;

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ persisted: false });

  const { data, error } = await supabase
    .from("incidents")
    .insert({
      session_id: sessionId,
      product_name: incident.productName || null,
      production_line: incident.productionLine || null,
      process: incident.process || null,
      batch: incident.batch || null,
      incident_type: incident.incidentType || null,
      description: incident.incidentDescription || null,
      affected_quantity: incident.affectedQuantity || null,
      severity: incident.severity || null,
      discovered_at: incident.discoveredAt || null,
      reporter: incident.reporter || null,
      status: "reported",
    })
    .select("id")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "db insert failed", detail: error?.message }, { status: 500 });
  }

  await supabase.from("workflow_events").insert({
    incident_id: data.id,
    from_state: null,
    to_state: "reported",
    actor: "human",
    note: "一线上报质量异常",
  });

  return NextResponse.json({ persisted: true, id: data.id });
}
