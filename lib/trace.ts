import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { TraceEntityType } from "@/lib/llm/types";

export interface TraceInput {
  sessionId?: string;
  entityType?: TraceEntityType;
  entityId?: string | null;
  step: string;
  provider?: string;
  model?: string;
  operation?: "chat" | "embed";
  request?: unknown;
  response?: unknown;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  latencyMs?: number;
  status: "ok" | "error";
  error?: string;
  citations?: unknown;
}

/**
 * 写入一条 LLM 调用记录到 llm_traces（Trace Viewer 数据源）。
 * 未配置 Supabase 时静默跳过；写入失败不影响主流程。
 */
export async function writeTrace(input: TraceInput): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  try {
    await supabase.from("llm_traces").insert({
      session_id: input.sessionId ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      step: input.step,
      provider: input.provider ?? null,
      model: input.model ?? null,
      operation: input.operation ?? "chat",
      request: input.request ?? null,
      response: input.response ?? null,
      input_tokens: input.inputTokens ?? null,
      output_tokens: input.outputTokens ?? null,
      cost_usd: input.costUsd ?? null,
      latency_ms: input.latencyMs ?? null,
      status: input.status,
      error: input.error ?? null,
      citations: input.citations ?? null,
    });
  } catch (e) {
    console.error("[trace] write failed:", e);
  }
}
