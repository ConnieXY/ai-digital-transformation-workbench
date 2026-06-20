import {
  type ReviewReport,
  ReviewReportSchema,
  type IncidentAnalysis,
} from "@/lib/schemas/incident";
import type { AITask } from "@/lib/ai/task";
import type { IncidentRow } from "@/lib/ai/tasks/incidentAnalysis";

export interface ReviewTaskRow {
  title: string;
  department: string | null;
  status: string;
}

export interface ReviewInput {
  incident: IncidentRow;
  analysis: IncidentAnalysis | null;
  tasks: ReviewTaskRow[];
}

const DEFAULT_METRICS = [
  { name: "该批次不良率", target: "目标 ≤ 0.5%" },
  { name: "异常处理闭环时长", target: "目标 ≤ 72 小时" },
  { name: "同类异常季度复发次数", target: "目标 0 次" },
];

/** 规则降级：从异常 + 分析 + 任务确定性地拼出复盘报告。 */
function ruleFallback({ incident, analysis, tasks }: ReviewInput): ReviewReport {
  const tags = Array.from(
    new Set(
      [
        "质量异常闭环",
        incident.incident_type,
        incident.batch,
        incident.production_line,
        incident.process,
      ]
        .filter(Boolean)
        .map((t) => (t as string).replace(/\s+/g, "")),
    ),
  );
  return {
    overview:
      incident.description ||
      `${incident.product_name || "产品"} ${incident.batch || ""} 批次发现 ${incident.incident_type || "质量异常"}。`,
    impact: analysis?.scope ?? `涉及 ${incident.batch || "相关"} 批次。`,
    rootCauses: (analysis?.probableCauses.map((c) => c.cause) ?? [
      "待进一步排查确认",
    ]).slice(0, 4),
    actionsTaken: (tasks.length
      ? tasks.map((t) => `${t.title}（${t.status}）`)
      : ["已按流程上报并隔离涉事批次"]
    ).slice(0, 6),
    corrections: (analysis?.containment ?? ["隔离并全检相关批次"]).slice(0, 4),
    prevention: (analysis?.prevention ?? ["完善来料检验与工序防错"]).slice(0, 4),
    knowledgeTags: tags.length >= 2 ? tags.slice(0, 6) : [...tags, "质量管理"],
    trackingMetrics: DEFAULT_METRICS,
  };
}

/** 复盘报告任务：基于异常 + 分析 + 任务进展生成结构化复盘；无 LLM 时确定性降级。 */
export const incidentReviewTask: AITask<ReviewInput, ReviewReport> = {
  step: "incident.review",
  entityType: "review",
  schema: ReviewReportSchema,
  buildPrompt: ({ incident, analysis, tasks }) => ({
    system:
      "你是一名资深制造业质量工程师。基于异常信息、根因分析与任务处理进展，输出结构化质量异常复盘报告。" +
      "actionsTaken 要反映真实任务进展；knowledgeTags 用于沉淀到知识库便于检索。语言中文、专业。",
    user: [
      "【异常】",
      `产品：${incident.product_name || "—"}｜批次：${incident.batch || "—"}｜类型：${incident.incident_type || "—"}`,
      `描述：${incident.description || "—"}`,
      "",
      "【AI 根因分析摘要】",
      analysis
        ? `类型：${analysis.incidentType}；严重度：${analysis.severity.level}；` +
          `主要可能原因：${analysis.probableCauses.map((c) => c.cause).join("；")}`
        : "（无）",
      "",
      "【任务处理进展】",
      tasks.map((t) => `- ${t.title}（${t.department || "—"}）：${t.status}`).join("\n") ||
        "（无任务）",
    ].join("\n"),
  }),
  fallback: ruleFallback,
};
