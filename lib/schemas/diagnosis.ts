import { z } from "zod";

/**
 * 诊断 AI 洞察的结构化输出 schema。
 * LLM 必须返回符合此结构的 JSON，再经 Zod 校验后落库 / 展示。
 */
export const DiagnosisInsightSchema = z.object({
  headline: z.string().describe("一句话概括企业当前数智化状态"),
  summary: z.string().describe("3-4 句的整体诊断解读"),
  keyRisks: z
    .array(
      z.object({
        dimension: z.string().describe("所属维度名称"),
        risk: z.string().describe("具体风险点"),
        impact: z.string().describe("对业务的影响"),
      }),
    )
    .min(2)
    .max(4),
  quickWins: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe("30-60 天可见效的快赢动作"),
  execTalkingPoints: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe("向管理层汇报时的关键论点"),
});

export type DiagnosisInsight = z.infer<typeof DiagnosisInsightSchema>;
