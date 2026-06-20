import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { runAITask } from "@/lib/ai/task";
import { solutionTask } from "@/lib/ai/tasks/solution";

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

  // 统一管线：检索 → LLM grounded（强制引用）→ 后处理；无 LLM 时确定性降级
  const { output: grounded, sources, source } = await runAITask(
    solutionTask,
    input,
    { sessionId, entityId: id },
  );

  if (supabase && id) {
    await supabase
      .from("solutions")
      .update({ result: grounded, citations: sources, source })
      .eq("id", id);
  }

  return NextResponse.json({
    persisted: Boolean(id),
    id,
    source,
    grounded,
    sources,
  });
}
