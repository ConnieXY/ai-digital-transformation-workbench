/**
 * 「真实 AI 示例」固化快照。
 * 这些是真实 LLM + RAG 跑出来的产物（含引用、HITL 闭环、trace），
 * 固化为静态数据，使公网无需配置 LLM key、零成本、确定性地展示真实 AI 路径。
 */
import diagnosis from "./featured/diagnosis.json";
import solution from "./featured/solution.json";
import incident from "./featured/incident.json";
import incidentReview from "./featured/incident-review.json";
import traces from "./featured/traces.json";
import traceDetails from "./featured/trace-details.json";

export const FEATURED = {
  diagnosisId: (diagnosis as { id: string }).id,
  solutionId: (solution as { id: string }).id,
  incidentId: (incident as { incident: { id: string } }).incident.id,
};

export const featuredDiagnosis = diagnosis;
export const featuredSolution = solution;
export const featuredIncident = incident;
export const featuredIncidentReview = incidentReview;
export const featuredTraces = traces;

export function featuredTraceById(id: string): unknown | null {
  return (traceDetails as Record<string, unknown>)[id] ?? null;
}
