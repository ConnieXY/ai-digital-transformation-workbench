import "server-only";
import { retrieve } from "@/lib/rag/retrieve";
import { runStructured } from "@/lib/llm/run";
import {
  type IncidentAnalysis,
  IncidentAnalysisSchema,
} from "@/lib/schemas/incident";
import type { SolutionSource } from "@/lib/schemas/solution";

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

export interface GeneratedAnalysis {
  analysis: IncidentAnalysis;
  sources: SolutionSource[];
}

/**
 * RAG grounded 根因分析：检索质量管理/案例库片段 → LLM 结构化分析并引用来源。
 */
export async function analyzeIncidentWithAI(
  incident: IncidentRow,
  ctx: { sessionId?: string; entityId?: string | null } = {},
): Promise<GeneratedAnalysis> {
  const query = [
    incident.incident_type,
    incident.process ? `${incident.process}工序` : "",
    incident.description,
  ]
    .filter(Boolean)
    .join(" ");

  const chunks = await retrieve(query, {
    k: 5,
    sessionId: ctx.sessionId,
    entityType: "incident",
    entityId: ctx.entityId,
  });

  const sources: SolutionSource[] = chunks.map((c, i) => ({
    index: i + 1,
    title: c.title,
    docType: c.docType,
    snippet: c.content.slice(0, 500),
    similarity: Number(c.similarity.toFixed(3)),
  }));

  const knowledge = sources
    .map((s) => `[${s.index}] (${s.docType}) ${s.title}\n${chunks[s.index - 1].content}`)
    .join("\n\n");

  const system =
    "你是一名资深制造业质量工程师（QE）。基于上报的质量异常与【知识库片段】，给出结构化根因分析。grounding 规则：\n" +
    "1. 仅当某条可能原因确实能从某个知识片段中找到直接依据时，才在 citations 标注对应来源序号；逐条核对片段原文，只标注真正包含该依据的那条来源，宁可少标也不要错标或多标。\n" +
    "2. 找不到知识库依据、但据上报信息可合理推断的原因，可保留但 citations 留空（[]），不要标注不相关来源。\n" +
    "3. 区分发生（why it happened）与流出（why it escaped）两条原因链。只依据提供的信息，不编造。\n" +
    "语言中文，专业克制。";

  const user = [
    "【异常上报】",
    `产品：${incident.product_name || "—"}｜产线：${incident.production_line || "—"}｜工序：${incident.process || "—"}｜批次：${incident.batch || "—"}`,
    `类型：${incident.incident_type || "—"}｜严重度：${incident.severity || "—"}｜影响数量：${incident.affected_quantity || "—"}`,
    `描述：${incident.description || "—"}`,
    "",
    "【知识库片段】（分析依据，引用其序号）",
    knowledge || "（无检索结果，请基于通用质量管理原则给出，并说明缺乏具体依据）",
  ].join("\n");

  const analysis = await runStructured({
    schema: IncidentAnalysisSchema,
    system,
    user,
    step: "incident.analyze",
    entityType: "incident",
    entityId: ctx.entityId,
    sessionId: ctx.sessionId,
  });

  // 过滤越界引用
  const valid = new Set(sources.map((s) => s.index));
  analysis.probableCauses = analysis.probableCauses.map((c) => ({
    ...c,
    citations: c.citations.filter((n) => valid.has(n)),
  }));

  return { analysis, sources };
}
