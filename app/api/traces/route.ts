import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { featuredTraces } from "@/data/featured";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Trace 列表 + 聚合指标（Trace Viewer 数据源）。 */
export async function GET(req: Request) {
  const supabase = getSupabaseAdmin();
  // 公网无 DB → 展示固化的真实 trace 快照
  if (!supabase) return NextResponse.json(featuredTraces);

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "100"), 500);

  const { data, error } = await supabase
    .from("llm_traces")
    .select(
      "id, step, provider, model, operation, status, input_tokens, output_tokens, cost_usd, latency_ms, entity_type, entity_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const latencies = rows
    .map((r) => r.latency_ms)
    .filter((n): n is number => typeof n === "number")
    .sort((a, b) => a - b);
  const pct = (p: number) =>
    latencies.length
      ? latencies[Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length))]
      : 0;

  const metrics = {
    total: rows.length,
    errors: rows.filter((r) => r.status === "error").length,
    totalCostUsd: Number(
      rows.reduce((s, r) => s + (Number(r.cost_usd) || 0), 0).toFixed(6),
    ),
    totalTokens: rows.reduce(
      (s, r) => s + (r.input_tokens || 0) + (r.output_tokens || 0),
      0,
    ),
    p50: pct(50),
    p95: pct(95),
  };

  return NextResponse.json({ metrics, traces: rows });
}
