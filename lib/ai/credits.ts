import "server-only";
import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { creditCostForStep } from "@/lib/ai/creditsCore";

export interface CreditResult {
  ok: boolean;
  cost: number;
  limit: number;
  used: number;
  remaining: number;
  reason?: "missing_identity" | "quota_unavailable" | "quota_exceeded";
}

interface RpcCreditResult {
  ok: boolean;
  used_credits: number;
  remaining_credits: number;
}

/**
 * Atomically consumes today's public demo credits for one anonymous identity.
 * If the backing quota store is unavailable, the safe choice is to deny
 * real AI and let callers fall back to the deterministic rule path.
 */
export async function consumePublicAICredits(
  identityKey: string | null | undefined,
  step: string,
): Promise<CreditResult> {
  const cost = creditCostForStep(step);
  const limit = env.publicAIDailyCredits;

  if (!identityKey) {
    return { ok: false, cost, limit, used: 0, remaining: 0, reason: "missing_identity" };
  }
  if (!limit || limit <= 0) {
    return { ok: false, cost, limit, used: 0, remaining: 0, reason: "quota_exceeded" };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { ok: false, cost, limit, used: 0, remaining: 0, reason: "quota_unavailable" };
  }

  const { data, error } = await supabase.rpc("consume_public_ai_credits", {
    p_identity_key: identityKey,
    p_credits: cost,
    p_daily_limit: limit,
  });

  if (error || !data) {
    console.error("[credits] consume failed:", error?.message ?? "empty response");
    return { ok: false, cost, limit, used: 0, remaining: 0, reason: "quota_unavailable" };
  }

  const row = Array.isArray(data)
    ? (data[0] as RpcCreditResult | undefined)
    : (data as RpcCreditResult);
  if (!row?.ok) {
    return {
      ok: false,
      cost,
      limit,
      used: Number(row?.used_credits ?? limit),
      remaining: Number(row?.remaining_credits ?? 0),
      reason: "quota_exceeded",
    };
  }

  return {
    ok: true,
    cost,
    limit,
    used: Number(row.used_credits),
    remaining: Number(row.remaining_credits),
  };
}

