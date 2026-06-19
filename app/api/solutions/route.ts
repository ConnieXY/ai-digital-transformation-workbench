import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { hasLLM } from "@/lib/env";
import { generateGroundedSolution } from "@/lib/solution/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  sessionId: z.string().min(1),
  input: z.object({
    industry: z.string(),
    companySize: z.string(),
    targetRole: z.string(),
    businessGoals: z.array(z.string()),
    painPoints: z.array(z.string()),
    currentSystems: z.string(),
    additionalContext: z.string(),
  }),
});

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "invalid body", detail: String(e) }, { status: 400 });
  }
  const { sessionId, input } = body;

  if (!hasLLM) {
    // 未配置 LLM：让前端走规则降级
    return NextResponse.json({ persisted: false, source: "rule" });
  }

  const supabase = getSupabaseAdmin();

  // 先建记录拿 id（便于 trace 关联）；无 DB 时用占位
  let id: string | null = null;
  if (supabase) {
    const { data, error } = await supabase
      .from("solutions")
      .insert({ session_id: sessionId, input, result: {}, source: "rule" })
      .select("id")
      .single();
    if (error || !data) {
      return NextResponse.json(
        { error: "db insert solution failed", detail: error?.message },
        { status: 500 },
      );
    }
    id = data.id;
  }

  try {
    const { grounded, sources } = await generateGroundedSolution(input, {
      sessionId,
      entityId: id,
    });

    if (supabase && id) {
      await supabase
        .from("solutions")
        .update({ result: grounded, citations: sources, source: "llm" })
        .eq("id", id);
    }

    return NextResponse.json({
      persisted: Boolean(id),
      id,
      source: "llm",
      grounded,
      sources,
    });
  } catch (e) {
    console.error("[solutions] generate failed:", e);
    return NextResponse.json({ persisted: false, source: "rule" });
  }
}
