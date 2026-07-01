import { NextResponse } from "next/server";
import { z } from "zod";
import { retrieve } from "@/lib/rag/retrieve";
import { canUsePublicAI } from "@/lib/env";
import { isOverDailyBudget } from "@/lib/llm/budget";
import { consumePublicAICredits } from "@/lib/ai/credits";
import { enforceRateLimit, identityFromRequest } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  query: z.string().min(1),
  k: z.number().int().min(1).max(20).optional(),
  docType: z.string().optional(),
});

/** RAG 检索调试端点（也供 Trace Viewer / 演示用）。 */
export async function POST(req: Request) {
  const rl = enforceRateLimit(req);
  if (rl)
    return NextResponse.json(
      { error: "rate_limited", detail: "请求过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "invalid body", detail: String(e) }, { status: 400 });
  }

  if (!canUsePublicAI || (await isOverDailyBudget())) {
    return NextResponse.json({ query: body.query, count: 0, chunks: [] });
  }

  const credit = await consumePublicAICredits(identityFromRequest(req), "rag.search");
  if (!credit.ok) {
    return NextResponse.json({ query: body.query, count: 0, chunks: [] });
  }

  const chunks = await retrieve(body.query, {
    k: body.k ?? 5,
    docType: body.docType,
  });

  return NextResponse.json({
    query: body.query,
    count: chunks.length,
    chunks: chunks.map((c) => ({
      title: c.title,
      docType: c.docType,
      similarity: Number(c.similarity.toFixed(3)),
      preview: c.content.slice(0, 80),
    })),
  });
}
