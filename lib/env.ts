/**
 * 集中读取并校验服务端环境变量。
 * 仅在服务端（route handlers / 脚本）引用；不要在客户端组件导入。
 */

import { DEFAULT_PUBLIC_AI_DAILY_CREDITS } from "@/lib/ai/creditsCore";

function read(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function readBoolean(name: string, defaultValue = false): boolean {
  const value = read(name).toLowerCase();
  if (!value) return defaultValue;
  return ["1", "true", "yes", "on"].includes(value);
}

export const env = {
  supabaseUrl: read("SUPABASE_URL") || read("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseAnonKey:
    read("SUPABASE_ANON_KEY") || read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),

  llmProvider: read("LLM_PROVIDER") || "openai-compatible",
  llmBaseUrl: read("LLM_BASE_URL") || "https://api.openai.com/v1",
  llmModel: read("LLM_MODEL") || "gpt-4o-mini",
  llmApiKey: read("LLM_API_KEY"),

  embeddingBaseUrl: read("EMBEDDING_BASE_URL") || "https://api.openai.com/v1",
  embeddingModel: read("EMBEDDING_MODEL") || "text-embedding-3-small",
  embeddingApiKey: read("EMBEDDING_API_KEY"),
  embeddingDimensions: Number(read("EMBEDDING_DIMENSIONS") || "1536"),

  // 滥用 / 成本防护
  publicAIEnabled: readBoolean("PUBLIC_AI_ENABLED", false),
  publicAIDailyCredits: Number(
    read("PUBLIC_AI_DAILY_CREDITS") || String(DEFAULT_PUBLIC_AI_DAILY_CREDITS),
  ),
  llmDailyCostCapUsd: Number(read("LLM_DAILY_COST_CAP_USD") || "1"),
  ratePerMin: Number(read("RATE_LIMIT_PER_MIN") || "60"),
};

/** 是否已配置 Supabase（决定数据是否真实持久化） */
export const hasSupabase = Boolean(
  env.supabaseUrl && env.supabaseServiceRoleKey,
);

/** 是否已配置 LLM（决定走真实 LLM 还是规则降级） */
export const hasLLM = Boolean(env.llmApiKey);

/** 公网真实 AI 是否可用：必须显式打开开关且已配置 LLM key。 */
export const canUsePublicAI = Boolean(env.publicAIEnabled && hasLLM);

/** 是否已配置 Embedding（决定 RAG 是否可用） */
export const hasEmbedding = Boolean(env.embeddingApiKey);
