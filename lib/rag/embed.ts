import OpenAI from "openai";

/**
 * Embedding 封装（OpenAI 兼容：百炼 text-embedding-v4 / OpenAI 等）。
 * 懒读 process.env，可同时被 route handler 与独立脚本（scripts/ingest.ts）使用。
 */
function cfg() {
  return {
    baseURL:
      process.env.EMBEDDING_BASE_URL?.trim() || "https://api.openai.com/v1",
    apiKey: process.env.EMBEDDING_API_KEY?.trim() || "",
    model: process.env.EMBEDDING_MODEL?.trim() || "text-embedding-3-small",
    dimensions: Number(process.env.EMBEDDING_DIMENSIONS?.trim() || "1536"),
  };
}

export function hasEmbedding(): boolean {
  return Boolean(process.env.EMBEDDING_API_KEY?.trim());
}

export interface EmbedResult {
  vectors: number[][];
  model: string;
  tokens: number;
}

/** 批量生成 embedding（按 10 条分批，兼容百炼 batch 限制）。 */
export async function embedTexts(texts: string[]): Promise<EmbedResult> {
  const c = cfg();
  if (!c.apiKey) throw new Error("EMBEDDING_API_KEY not configured");
  const client = new OpenAI({ apiKey: c.apiKey, baseURL: c.baseURL });

  const vectors: number[][] = [];
  let tokens = 0;
  let model = c.model;

  for (let i = 0; i < texts.length; i += 10) {
    const batch = texts.slice(i, i + 10);
    const res = await client.embeddings.create({
      model: c.model,
      input: batch,
      dimensions: c.dimensions,
      encoding_format: "float",
    });
    for (const item of res.data) vectors.push(item.embedding as number[]);
    tokens += res.usage?.total_tokens ?? 0;
    model = res.model || c.model;
  }

  return { vectors, model, tokens };
}

/** 单条文本 embedding。 */
export async function embedOne(text: string): Promise<number[]> {
  const { vectors } = await embedTexts([text]);
  return vectors[0];
}
