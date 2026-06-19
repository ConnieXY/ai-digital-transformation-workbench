import { z } from "zod";

/**
 * RAG grounded 行业解决方案的结构化输出。
 * 每条建议必须用 citations 引用知识库来源序号（对应检索到的片段）。
 */
export const GroundedSolutionSchema = z.object({
  summary: z.string().describe("基于知识库与客户输入的总体方案概述（3-4 句）"),
  recommendations: z
    .array(
      z.object({
        scenario: z.string().describe("推荐场景"),
        solution: z.string().describe("解决方案做法"),
        tools: z.string().describe("可用工具/能力组合"),
        expectedValue: z.string().describe("预期业务价值"),
        citations: z
          .array(z.number().int())
          .describe("引用的来源序号（从 1 开始，对应提供的知识片段）"),
      }),
    )
    .min(2)
    .max(5),
  roleValue: z
    .object({
      role: z.string().describe("目标沟通对象"),
      value: z.string().describe("面向该角色的价值主张"),
    })
    .describe("针对目标沟通对象的价值主张"),
  risks: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe("落地风险或前提条件"),
});

export type GroundedSolution = z.infer<typeof GroundedSolutionSchema>;

/** 返回给前端的来源条目 */
export interface SolutionSource {
  index: number;
  title: string;
  docType: string;
  snippet: string;
  similarity: number;
}
