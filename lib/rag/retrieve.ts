import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { embedOneWithUsage, hasEmbedding } from "@/lib/rag/embed";
import { estimateCost } from "@/lib/llm/cost";
import { writeTrace } from "@/lib/trace";
import { env } from "@/lib/env";
import type { TraceEntityType } from "@/lib/llm/types";

export interface RetrievedChunk {
  id: string;
  documentId: string;
  content: string;
  similarity: number;
  title: string;
  docType: string;
}

interface RetrieveOptions {
  k?: number;
  docType?: string;
  sessionId?: string;
  entityType?: TraceEntityType;
  entityId?: string | null;
}

/**
 * 向量检索：query → embedding → pgvector 余弦匹配 → top-k 片段。
 * embedding 调用写入 llm_traces（operation=embed）。未配置则返回空（调用方降级）。
 */
export async function retrieve(
  query: string,
  opts: RetrieveOptions = {},
): Promise<RetrievedChunk[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !hasEmbedding()) return [];

  const { k = 5, docType, sessionId, entityType, entityId } = opts;
  const started = Date.now();

  let vector: number[];
  let embedModel = env.embeddingModel;
  let embedTokens = 0;
  try {
    const embedded = await embedOneWithUsage(query);
    vector = embedded.vector;
    embedModel = embedded.model;
    embedTokens = embedded.tokens;
  } catch (e) {
    await writeTrace({
      sessionId,
      entityType: entityType ?? "rag",
      entityId,
      step: "rag.embed",
      operation: "embed",
      model: embedModel,
      status: "error",
      error: e instanceof Error ? e.message : String(e),
      latencyMs: Date.now() - started,
    });
    return [];
  }

  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: `[${vector.join(",")}]`,
    match_count: k,
    doc_type_filter: docType ?? null,
  });

  await writeTrace({
    sessionId,
    entityType: entityType ?? "rag",
    entityId,
    step: "rag.retrieve",
    operation: "embed",
    model: embedModel,
    status: error ? "error" : "ok",
    error: error?.message,
    request: { query, k, docType },
    response: { matched: data?.length ?? 0 },
    inputTokens: embedTokens,
    costUsd: estimateCost(embedModel, embedTokens, 0),
    latencyMs: Date.now() - started,
  });

  if (error || !data) return [];

  // 相关性门控：丢弃相似度过低的片段，避免弱语料时 LLM 强行"凑引用"。
  const minSim = Number(process.env.RAG_MIN_SIMILARITY ?? "0.48");

  return (data as Array<Record<string, unknown>>)
    .filter((r) => (r.similarity as number) >= minSim)
    .map((r) => ({
    id: r.id as string,
    documentId: r.document_id as string,
    content: r.content as string,
    similarity: r.similarity as number,
    title: ((r.metadata as Record<string, unknown>)?.title as string) ?? "",
    docType: ((r.metadata as Record<string, unknown>)?.doc_type as string) ?? "",
  }));
}
