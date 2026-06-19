import { NextResponse } from "next/server";
import { type Answers } from "@/data/diagnosis";
import { scoreDiagnosis } from "@/lib/scoring";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "db not configured" }, { status: 503 });
  }

  const { data: a, error } = await supabase
    .from("assessments")
    .select("id, answers, llm_insight, source, created_at, company_id")
    .eq("id", params.id)
    .single();
  if (error || !a) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { data: company } = await supabase
    .from("companies")
    .select(
      "name, industry, company_size, employee_count, current_systems, main_pain_point",
    )
    .eq("id", a.company_id)
    .single();

  // 结果由 answers 经规则引擎确定性重建（单一事实来源）
  const result = scoreDiagnosis(a.answers as Answers);

  return NextResponse.json({
    id: a.id,
    submittedAt: a.created_at,
    source: a.source,
    companyInfo: {
      companyName: company?.name ?? "",
      industry: company?.industry ?? "",
      companySize: company?.company_size ?? "",
      employeeCount: company?.employee_count ?? "",
      currentSystems: company?.current_systems ?? "",
      mainPainPoint: company?.main_pain_point ?? "",
    },
    answers: a.answers,
    result,
    insight: a.llm_insight ?? null,
  });
}
