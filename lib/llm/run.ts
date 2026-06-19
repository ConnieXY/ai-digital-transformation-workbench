import "server-only";
import { z } from "zod";
import { getLLMProvider } from "./provider";
import { estimateCost } from "./cost";
import { writeTrace } from "@/lib/trace";
import type { ChatMessage, TraceEntityType } from "./types";

export class LLMUnavailableError extends Error {}

interface RunArgs<T> {
  schema: z.ZodType<T>;
  system: string;
  user: string;
  /** trace.step，例如 "diagnosis.insight" */
  step: string;
  sessionId?: string;
  entityType?: TraceEntityType;
  entityId?: string | null;
}

/**
 * 统一的结构化 LLM 调用：
 * provider → JSON 解析 → Zod 校验 → 失败有界 repair 重试 → 写 llm_traces。
 * 返回类型安全的结果；未配置 LLM 时抛 LLMUnavailableError（调用方降级）。
 */
export async function runStructured<T>(args: RunArgs<T>): Promise<T> {
  const provider = getLLMProvider();
  if (!provider) throw new LLMUnavailableError("LLM not configured");

  const jsonSchema = z.toJSONSchema(args.schema);
  const system = `${args.system}\n\n只返回一个 JSON 对象，必须严格符合以下 JSON Schema：\n${JSON.stringify(
    jsonSchema,
  )}`;
  const base: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: args.user },
  ];

  const started = Date.now();
  let raw = "";
  let lastErr = "";
  let inTok = 0;
  let outTok = 0;
  let model = provider.model;

  const traceBase = {
    sessionId: args.sessionId,
    entityType: args.entityType,
    entityId: args.entityId,
    step: args.step,
    provider: provider.name,
    operation: "chat" as const,
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    const messages: ChatMessage[] =
      attempt === 0
        ? base
        : [
            ...base,
            { role: "assistant", content: raw },
            {
              role: "user",
              content: `上次输出无法通过校验：${lastErr}。请仅返回修正后的合法 JSON。`,
            },
          ];
    try {
      const res = await provider.chatJSON(messages);
      raw = res.content;
      inTok += res.inputTokens;
      outTok += res.outputTokens;
      model = res.model;
      const validated = args.schema.parse(JSON.parse(res.content));
      await writeTrace({
        ...traceBase,
        model,
        status: "ok",
        request: { system, user: args.user, attempt },
        response: validated,
        inputTokens: inTok,
        outputTokens: outTok,
        costUsd: estimateCost(model, inTok, outTok),
        latencyMs: Date.now() - started,
      });
      return validated;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }

  await writeTrace({
    ...traceBase,
    model,
    status: "error",
    error: lastErr,
    request: { system, user: args.user },
    response: { raw },
    inputTokens: inTok,
    outputTokens: outTok,
    costUsd: estimateCost(model, inTok, outTok),
    latencyMs: Date.now() - started,
  });
  throw new Error(`runStructured(${args.step}) failed: ${lastErr}`);
}
