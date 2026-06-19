import "server-only";
import type { SolutionInput } from "@/data/solution";
import { retrieve } from "@/lib/rag/retrieve";
import { runStructured } from "@/lib/llm/run";
import {
  type GroundedSolution,
  type SolutionSource,
  GroundedSolutionSchema,
} from "@/lib/schemas/solution";

export interface GeneratedSolution {
  grounded: GroundedSolution;
  sources: SolutionSource[];
}

/**
 * RAG grounded 方案生成：检索知识片段 → 作为依据让 LLM 产出结构化方案并标注引用。
 * 仅在已配置 LLM 时调用（route 层负责降级）。
 */
export async function generateGroundedSolution(
  input: SolutionInput,
  ctx: { sessionId?: string; entityId?: string | null } = {},
): Promise<GeneratedSolution> {
  // 1) 用行业 + 痛点 + 目标构造检索 query
  const query = [
    `行业：${input.industry}`,
    input.painPoints.length ? `痛点：${input.painPoints.join("、")}` : "",
    input.businessGoals.length ? `目标：${input.businessGoals.join("、")}` : "",
  ]
    .filter(Boolean)
    .join("；");

  const chunks = await retrieve(query, {
    k: 5,
    sessionId: ctx.sessionId,
    entityType: "solution",
    entityId: ctx.entityId,
  });

  const sources: SolutionSource[] = chunks.map((c, i) => ({
    index: i + 1,
    title: c.title,
    docType: c.docType,
    snippet: c.content.slice(0, 160),
    similarity: Number(c.similarity.toFixed(3)),
  }));

  // 2) 把来源编号后作为 grounding 提供给 LLM
  const knowledge = sources
    .map((s) => `[${s.index}] (${s.docType}) ${s.title}\n${chunks[s.index - 1].content}`)
    .join("\n\n");

  const system =
    "你是一名资深企业数智化转型解决方案顾问。" +
    "必须严格基于【知识库片段】生成方案，不得编造片段之外的事实；" +
    "每条建议都要在 citations 里标注其依据的来源序号（来自知识库片段编号）。" +
    "语言中文，面向 B2B 决策者，克制专业。";

  const user = [
    `【客户输入】`,
    `行业：${input.industry}｜规模：${input.companySize || "未提供"}`,
    `目标沟通对象：${input.targetRole || "未提供"}`,
    `业务目标：${input.businessGoals.join("、") || "未提供"}`,
    `业务痛点：${input.painPoints.join("、") || "未提供"}`,
    `当前系统：${input.currentSystems || "未提供"}`,
    input.additionalContext ? `补充：${input.additionalContext}` : "",
    "",
    `【知识库片段】（生成方案的唯一依据，引用其序号）`,
    knowledge || "（无检索结果，请说明缺乏依据，不要编造）",
  ]
    .filter(Boolean)
    .join("\n");

  const grounded = await runStructured({
    schema: GroundedSolutionSchema,
    system,
    user,
    step: "solution.generate",
    entityType: "solution",
    entityId: ctx.entityId,
    sessionId: ctx.sessionId,
  });

  // 3) 过滤越界引用，保证引用真实有效
  const valid = new Set(sources.map((s) => s.index));
  grounded.recommendations = grounded.recommendations.map((r) => ({
    ...r,
    citations: r.citations.filter((n) => valid.has(n)),
  }));

  return { grounded, sources };
}
