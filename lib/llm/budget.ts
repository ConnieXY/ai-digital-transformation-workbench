import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { env } from "@/lib/env";

// 缓存当日花费，避免每次 LLM 调用都查库（上限是安全网，30s 误差可接受）。
let cache: { at: number; spent: number } | null = null;
const TTL_MS = 30_000;

/** 当日（本地零点起）已花费的 LLM 成本（美元），数据源即可观测面 llm_traces.cost_usd。 */
export async function dailyLlmSpendUsd(): Promise<number> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.spent;
  const sb = getSupabaseAdmin();
  if (!sb) return 0;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { data } = await sb
    .from("llm_traces")
    .select("cost_usd")
    .gte("created_at", start.toISOString());
  const spent = (data ?? []).reduce(
    (s, r) => s + (Number((r as { cost_usd: unknown }).cost_usd) || 0),
    0,
  );
  cache = { at: Date.now(), spent };
  return spent;
}

/** 是否已超当日成本上限。cap ≤ 0 视为不设限。 */
export async function isOverDailyBudget(): Promise<boolean> {
  const cap = env.llmDailyCostCapUsd;
  if (!cap || cap <= 0) return false;
  return (await dailyLlmSpendUsd()) >= cap;
}

/** 测试 / 调用后失效缓存（写入新 trace 后下次重新统计）。 */
export function _invalidateBudgetCache(): void {
  cache = null;
}
