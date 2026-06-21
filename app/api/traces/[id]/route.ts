import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { featuredTraceById } from "@/data/featured";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 可观测元数据（不含原始 request/response —— 那里嵌着用户业务数据）。
const SAFE_COLUMNS =
  "id, session_id, step, provider, model, operation, status, input_tokens, output_tokens, cost_usd, latency_ms, entity_type, entity_id, citations, created_at";

/**
 * 单条 trace 详情。
 * featured（经审定的展示快照）返回全量，含 request/response。
 * 实时 trace 的原始 request/response 嵌有用户填写的企业/异常信息，公网不放行
 * —— 仅返回可观测元数据（成本/延迟/状态/检索引用），request/response 置空并标记 redacted。
 * （彻底按 owner 隔离 trace 需给 llm_traces 加 owner 并贯通写入链路，属后续项。）
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const featured = featuredTraceById(params.id);
  if (featured) return NextResponse.json(featured);

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "db not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("llm_traces")
    .select(SAFE_COLUMNS)
    .eq("id", params.id)
    .single();
  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({
    trace: { ...data, request: null, response: null, redacted: true },
  });
}
