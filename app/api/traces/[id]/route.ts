import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 单条 trace 详情（含完整请求/响应/引用）。 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "db not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("llm_traces")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ trace: data });
}
