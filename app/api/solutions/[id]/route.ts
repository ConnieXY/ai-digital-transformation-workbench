import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { FEATURED, featuredSolution } from "@/data/featured";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (params.id === FEATURED.solutionId) {
    return NextResponse.json(featuredSolution);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "db not configured" }, { status: 503 });
  }
  const { data, error } = await supabase
    .from("solutions")
    .select("id, input, result, citations, source, created_at")
    .eq("id", params.id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: data.id,
    input: data.input,
    grounded: data.result,
    sources: data.citations ?? [],
    source: data.source,
    createdAt: data.created_at,
  });
}
