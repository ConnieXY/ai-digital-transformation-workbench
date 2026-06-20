import type { SolutionInput } from "@/data/solution";
import {
  type GroundedSolution,
  GroundedSolutionSchema,
} from "@/lib/schemas/solution";
import { solutionFallback } from "@/lib/solution/fallback";
import {
  type AITask,
  buildKnowledgeBlock,
  filterCitations,
} from "@/lib/ai/task";

/** 行业方案任务：RAG 检索 → LLM grounded 生成（强制引用）；无 LLM 时规则降级。 */
export const solutionTask: AITask<SolutionInput, GroundedSolution> = {
  step: "solution.generate",
  entityType: "solution",
  schema: GroundedSolutionSchema,
  retrieve: {
    k: 5,
    buildQuery: (input) =>
      [
        `行业：${input.industry}`,
        input.painPoints.length ? `痛点：${input.painPoints.join("、")}` : "",
        input.businessGoals.length ? `目标：${input.businessGoals.join("、")}` : "",
      ]
        .filter(Boolean)
        .join("；"),
  },
  buildPrompt: (input, sources, chunkContents) => ({
    system:
      "你是一名资深企业数智化转型解决方案顾问。生成方案时严格遵守 grounding 规则：\n" +
      "1. 仅当某条建议确实能从某个【知识库片段】中找到直接依据时，才在 citations 标注对应来源序号；逐条核对片段原文，只标注真正包含该依据的那条来源，宁可少标也不要错标或多标。\n" +
      "2. 找不到依据的内容：要么不写，要么写成措辞谨慎的通用建议，并把 citations 留空（[]）。绝不为了凑引用而标注不相关来源。\n" +
      "3. 若【知识库片段】整体与该客户场景关联很弱，请在 summary 中如实说明「知识库缺乏针对性依据」，宁可少写也不要输出看似有据实则无据的结论。\n" +
      "语言中文，面向 B2B 决策者，克制专业。",
    user: [
      `【客户输入】`,
      `行业：${input.industry}｜规模：${input.companySize || "未提供"}`,
      `目标沟通对象：${input.targetRole || "未提供"}`,
      `业务目标：${input.businessGoals.join("、") || "未提供"}`,
      `业务痛点：${input.painPoints.join("、") || "未提供"}`,
      `当前系统：${input.currentSystems || "未提供"}`,
      input.additionalContext ? `补充：${input.additionalContext}` : "",
      "",
      `【知识库片段】（生成方案的唯一依据，引用其序号）`,
      buildKnowledgeBlock(sources, chunkContents) ||
        "（无检索结果，请说明缺乏依据，不要编造）",
    ]
      .filter(Boolean)
      .join("\n"),
  }),
  postProcess: (output, sources) => ({
    ...output,
    recommendations: output.recommendations.map((r) => ({
      ...r,
      citations: filterCitations(r.citations, sources),
    })),
  }),
  fallback: solutionFallback,
};
