import "server-only";
import { runStructured } from "@/lib/llm/run";
import { type ReviewReport, ReviewReportSchema } from "@/lib/schemas/incident";
import type { IncidentAnalysis } from "@/lib/schemas/incident";
import type { IncidentRow } from "@/lib/incident/analyze";

interface TaskRow {
  title: string;
  department: string | null;
  status: string;
}

/**
 * 复盘报告生成：基于异常、AI 分析与任务进展，输出结构化复盘报告。
 */
export async function generateReviewReport(
  incident: IncidentRow,
  analysis: IncidentAnalysis | null,
  tasks: TaskRow[],
  ctx: { sessionId?: string; entityId?: string | null } = {},
): Promise<ReviewReport> {
  const taskLines = tasks
    .map((t) => `- ${t.title}（${t.department || "—"}）：${t.status}`)
    .join("\n");

  const system =
    "你是一名资深制造业质量工程师。基于异常信息、根因分析与任务处理进展，输出结构化质量异常复盘报告。" +
    "actionsTaken 要反映真实任务进展；knowledgeTags 用于沉淀到知识库便于检索。语言中文、专业。";

  const user = [
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
    taskLines || "（无任务）",
  ].join("\n");

  return runStructured({
    schema: ReviewReportSchema,
    system,
    user,
    step: "incident.review",
    entityType: "review",
    entityId: ctx.entityId,
    sessionId: ctx.sessionId,
  });
}
