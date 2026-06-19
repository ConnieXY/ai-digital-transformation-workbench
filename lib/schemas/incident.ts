import { z } from "zod";

/**
 * 质量异常 RAG grounded 根因分析的结构化输出。
 * probableCauses 须用 citations 引用知识库来源序号。
 */
export const IncidentAnalysisSchema = z.object({
  incidentType: z.string().describe("异常类型识别"),
  scope: z.string().describe("影响范围（产线/工序/批次/数量）"),
  severity: z.object({
    level: z.string().describe("严重等级，如 轻微/一般/严重/紧急"),
    rationale: z.string().describe("判级依据"),
  }),
  probableCauses: z
    .array(
      z.object({
        cause: z.string(),
        likelihood: z.enum(["高", "中", "低"]),
        basis: z.string().describe("判断依据"),
        citations: z
          .array(z.number().int())
          .describe("引用的知识库来源序号（从 1 开始）"),
      }),
    )
    .min(2)
    .max(4),
  responsibleDepartments: z.array(z.string()).min(1).max(4),
  containment: z.array(z.string()).min(1).max(4).describe("临时遏制措施"),
  rootCauseInvestigation: z.array(z.string()).min(1).max(4).describe("根因排查建议"),
  prevention: z.array(z.string()).min(1).max(4).describe("长期预防措施"),
  nextTasks: z
    .array(
      z.object({
        title: z.string(),
        owner: z.string().describe("责任部门"),
        due: z.string().describe("时限，如 24 小时内 / 3 天内"),
        priority: z.enum(["高", "中", "低"]),
      }),
    )
    .min(3)
    .max(6)
    .describe("建议的闭环任务"),
});

export type IncidentAnalysis = z.infer<typeof IncidentAnalysisSchema>;

/** 复盘报告结构化输出 */
export const ReviewReportSchema = z.object({
  overview: z.string().describe("异常概况"),
  impact: z.string().describe("影响范围"),
  rootCauses: z.array(z.string()).min(1).max(4).describe("可能根因"),
  actionsTaken: z.array(z.string()).min(1).max(6).describe("处理过程"),
  corrections: z.array(z.string()).min(1).max(4).describe("整改措施"),
  prevention: z.array(z.string()).min(1).max(4).describe("预防建议"),
  knowledgeTags: z.array(z.string()).min(2).max(6).describe("沉淀到知识库的案例标签"),
  trackingMetrics: z
    .array(z.object({ name: z.string(), target: z.string() }))
    .min(2)
    .max(5)
    .describe("后续追踪指标"),
});

export type ReviewReport = z.infer<typeof ReviewReportSchema>;
