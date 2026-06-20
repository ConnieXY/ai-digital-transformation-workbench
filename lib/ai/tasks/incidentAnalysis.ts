import type { IncidentInput } from "@/data/manufacturing";
import {
  type IncidentAnalysis,
  IncidentAnalysisSchema,
} from "@/lib/schemas/incident";
import { analyzeIncident } from "@/lib/incidentAnalyzer";
import {
  type AITask,
  buildKnowledgeBlock,
  filterCitations,
} from "@/lib/ai/task";

/** 异常上报的数据库行（snake_case） */
export interface IncidentRow {
  product_name?: string | null;
  production_line?: string | null;
  process?: string | null;
  batch?: string | null;
  incident_type?: string | null;
  description?: string | null;
  affected_quantity?: string | null;
  severity?: string | null;
}

function toIncidentInput(row: IncidentRow): IncidentInput {
  return {
    productName: row.product_name ?? "",
    productionLine: row.production_line ?? "",
    process: row.process ?? "",
    batch: row.batch ?? "",
    incidentType: row.incident_type ?? "",
    incidentDescription: row.description ?? "",
    affectedQuantity: row.affected_quantity ?? "",
    severity: row.severity ?? "",
    discoveredAt: "",
    reporter: "",
  };
}

/** 规则降级：规则根因分析适配为同 schema（citations 留空，补 priority）。 */
function ruleFallback(row: IncidentRow): IncidentAnalysis {
  const a = analyzeIncident(toIncidentInput(row));
  return {
    ...a,
    probableCauses: a.probableCauses.map((c) => ({ ...c, citations: [] })),
    nextTasks: a.nextTasks.map((t, i) => ({
      ...t,
      priority: i < 2 ? ("高" as const) : ("中" as const),
    })),
  };
}

/** 异常根因任务：RAG 检索案例库/SOP → LLM grounded 根因（带引用）；无 LLM 时规则降级。 */
export const incidentAnalysisTask: AITask<IncidentRow, IncidentAnalysis> = {
  step: "incident.analyze",
  entityType: "incident",
  schema: IncidentAnalysisSchema,
  retrieve: {
    k: 5,
    buildQuery: (incident) =>
      [
        incident.incident_type,
        incident.process ? `${incident.process}工序` : "",
        incident.description,
      ]
        .filter(Boolean)
        .join(" "),
  },
  buildPrompt: (incident, sources, chunkContents) => ({
    system:
      "你是一名资深制造业质量工程师（QE）。基于上报的质量异常与【知识库片段】，给出结构化根因分析。grounding 规则：\n" +
      "1. 仅当某条可能原因确实能从某个知识片段中找到直接依据时，才在 citations 标注对应来源序号；逐条核对片段原文，只标注真正包含该依据的那条来源，宁可少标也不要错标或多标。\n" +
      "2. 找不到知识库依据、但据上报信息可合理推断的原因，可保留但 citations 留空（[]），不要标注不相关来源。\n" +
      "3. 区分发生（why it happened）与流出（why it escaped）两条原因链。只依据提供的信息，不编造。\n" +
      "语言中文，专业克制。",
    user: [
      "【异常上报】",
      `产品：${incident.product_name || "—"}｜产线：${incident.production_line || "—"}｜工序：${incident.process || "—"}｜批次：${incident.batch || "—"}`,
      `类型：${incident.incident_type || "—"}｜严重度：${incident.severity || "—"}｜影响数量：${incident.affected_quantity || "—"}`,
      `描述：${incident.description || "—"}`,
      "",
      "【知识库片段】（分析依据，引用其序号）",
      buildKnowledgeBlock(sources, chunkContents) ||
        "（无检索结果，请基于通用质量管理原则给出，并说明缺乏具体依据）",
    ].join("\n"),
  }),
  postProcess: (analysis, sources) => ({
    ...analysis,
    probableCauses: analysis.probableCauses.map((c) => ({
      ...c,
      citations: filterCitations(c.citations, sources),
    })),
  }),
  fallback: ruleFallback,
};
