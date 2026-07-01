import "server-only";
import type { z } from "zod";
import { retrieve } from "@/lib/rag/retrieve";
import { runStructured } from "@/lib/llm/run";
import { canUsePublicAI, env } from "@/lib/env";
import { isOverDailyBudget } from "@/lib/llm/budget";
import { consumePublicAICredits } from "@/lib/ai/credits";
import type { SolutionSource } from "@/lib/schemas/solution";
import type { TraceEntityType } from "@/lib/llm/types";

export class LLMUnavailableError extends Error {}

export interface AITaskContext {
  sessionId?: string;
  entityId?: string | null;
  quotaKey?: string | null;
}

/** RAG 检索配置（可选；无此项的任务不检索） */
export interface RetrieveSpec<I> {
  buildQuery: (input: I) => string;
  k?: number;
  docType?: string;
}

/**
 * 统一的 AI 任务定义：诊断/方案/根因/复盘都是它的声明式实例。
 * 把"检索 → 组装提示 → 结构化生成 → 后处理 → 降级 → trace"收敛为一条管线。
 */
export interface AITask<I, O> {
  /** trace.step，如 "solution.generate" */
  step: string;
  entityType: TraceEntityType;
  schema: z.ZodType<O>;
  /** 可选 RAG 检索 */
  retrieve?: RetrieveSpec<I>;
  /** 组装系统/用户提示；sources 为检索片段（带编号），chunkContents 为对应全文 */
  buildPrompt: (
    input: I,
    sources: SolutionSource[],
    chunkContents: string[],
  ) => { system: string; user: string };
  /** 生成后处理（如过滤越界引用）。默认不处理 */
  postProcess?: (output: O, sources: SolutionSource[]) => O;
  /** 确定性降级：无 LLM 或 LLM 失败时产出同 schema 结果。无此项则无 LLM 时抛错 */
  fallback?: (input: I, sources: SolutionSource[]) => O;
}

export interface AITaskResult<O> {
  output: O;
  sources: SolutionSource[];
  source: "llm" | "rule";
}

/**
 * 运行一个 AI 任务。统一处理：RAG 检索、LLM 结构化生成、后处理、确定性降级。
 * trace 由 retrieve（embed）与 runStructured（chat）各自写入。
 */
export async function runAITask<I, O>(
  task: AITask<I, O>,
  input: I,
  ctx: AITaskContext = {},
): Promise<AITaskResult<O>> {
  const fallback = (sources: SolutionSource[] = []): AITaskResult<O> => {
    if (task.fallback) {
      return { output: task.fallback(input, sources), sources, source: "rule" };
    }
    throw new LLMUnavailableError(`任务 ${task.step} 需要 LLM 且无降级`);
  };

  // 0) 公网真实 AI 总开关 + 全站成本上限 + 匿名 credits。
  // 未通过任一闸门时，不做 RAG/LLM 付费调用，直接走确定性降级。
  if (!canUsePublicAI) {
    return fallback();
  }

  if (await isOverDailyBudget()) {
    console.warn(
      `[ai:${task.step}] 已达当日 LLM 成本上限（$${env.llmDailyCostCapUsd}），降级为规则路径`,
    );
    return fallback();
  }

  const credit = await consumePublicAICredits(ctx.quotaKey, task.step);
  if (!credit.ok) {
    console.warn(
      `[ai:${task.step}] public AI credits 不足或不可用（reason=${credit.reason}），降级为规则路径`,
    );
    return fallback();
  }

  // 1) RAG 检索（可选）
  let sources: SolutionSource[] = [];
  let chunkContents: string[] = [];
  if (task.retrieve) {
    const chunks = await retrieve(task.retrieve.buildQuery(input), {
      k: task.retrieve.k ?? 5,
      docType: task.retrieve.docType,
      sessionId: ctx.sessionId,
      entityType: task.entityType,
      entityId: ctx.entityId,
    });
    sources = chunks.map((c, i) => ({
      index: i + 1,
      title: c.title,
      docType: c.docType,
      snippet: c.content.slice(0, 500),
      similarity: Number(c.similarity.toFixed(3)),
    }));
    chunkContents = chunks.map((c) => c.content);
  }

  // 2) LLM 路径。RAG embedding 写入成本后再检查一次，避免接近上限时继续 chat。
  if (await isOverDailyBudget()) {
    console.warn(
      `[ai:${task.step}] 已达当日 LLM 成本上限（$${env.llmDailyCostCapUsd}），降级为规则路径`,
    );
    return fallback(sources);
  }

  try {
    const { system, user } = task.buildPrompt(input, sources, chunkContents);
    const generated = (await runStructured({
      schema: task.schema,
      system,
      user,
      step: task.step,
      entityType: task.entityType,
      entityId: ctx.entityId,
      sessionId: ctx.sessionId,
    })) as O;
    const output = task.postProcess
      ? task.postProcess(generated, sources)
      : generated;
    return { output, sources, source: "llm" };
  } catch (e) {
    if (!task.fallback) throw e;
    console.error(`[ai:${task.step}] LLM 失败，回落确定性降级：`, e);
  }

  // 3) 确定性降级
  return fallback(sources);
}

// 纯引用助手拆到非 server-only 模块，便于单测；此处转出以保持既有 import 路径不变。
export { buildKnowledgeBlock, filterCitations } from "@/lib/ai/citations";
