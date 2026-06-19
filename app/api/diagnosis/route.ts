import { NextResponse } from "next/server";
import { z } from "zod";
import { type Answers, type CompanyInfo } from "@/data/diagnosis";
import { scoreDiagnosis } from "@/lib/scoring";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { hasLLM } from "@/lib/env";
import { generateDiagnosisInsight } from "@/lib/diagnosis/insight";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  sessionId: z.string().min(1),
  companyInfo: z.object({
    companyName: z.string(),
    industry: z.string(),
    companySize: z.string(),
    employeeCount: z.string(),
    currentSystems: z.string(),
    mainPainPoint: z.string(),
  }),
  answers: z.record(z.string(), z.number()),
});

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: "invalid body", detail: String(e) },
      { status: 400 },
    );
  }

  const { sessionId, companyInfo, answers } = body;
  const result = scoreDiagnosis(answers as unknown as Answers);

  const supabase = getSupabaseAdmin();

  // 未配置 Supabase → 不持久化，由客户端走 localStorage 兜底
  if (!supabase) {
    return NextResponse.json({ persisted: false, source: "rule", result });
  }

  // 1) 落库 company
  const { data: company, error: cErr } = await supabase
    .from("companies")
    .insert({
      session_id: sessionId,
      name: companyInfo.companyName || null,
      industry: companyInfo.industry || null,
      company_size: companyInfo.companySize || null,
      employee_count: companyInfo.employeeCount || null,
      current_systems: companyInfo.currentSystems || null,
      main_pain_point: companyInfo.mainPainPoint || null,
    })
    .select("id")
    .single();
  if (cErr || !company) {
    return NextResponse.json(
      { error: "db insert company failed", detail: cErr?.message },
      { status: 500 },
    );
  }

  // 2) 落库 assessment（规则评分）
  const { data: assessment, error: aErr } = await supabase
    .from("assessments")
    .insert({
      company_id: company.id,
      session_id: sessionId,
      answers,
      scores: result.dimensionScores,
      overall_score: result.overallScore,
      maturity_level: result.maturity.level,
      weakest_dimensions: result.weakestDimensions,
      source: "rule",
    })
    .select("id")
    .single();
  if (aErr || !assessment) {
    return NextResponse.json(
      { error: "db insert assessment failed", detail: aErr?.message },
      { status: 500 },
    );
  }

  // 3) 可选：LLM 结构化洞察（失败不影响主流程，降级为 rule）
  let source: "llm" | "rule" = "rule";
  if (hasLLM) {
    try {
      const insight = await generateDiagnosisInsight({
        companyInfo: companyInfo as CompanyInfo,
        result,
        sessionId,
        entityId: assessment.id,
      });
      await supabase
        .from("assessments")
        .update({ llm_insight: insight, source: "llm" })
        .eq("id", assessment.id);
      source = "llm";
    } catch (e) {
      console.error("[diagnosis] LLM insight failed, fallback to rule:", e);
    }
  }

  return NextResponse.json({
    persisted: true,
    id: assessment.id,
    source,
    result,
  });
}
