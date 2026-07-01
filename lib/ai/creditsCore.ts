export const DEFAULT_PUBLIC_AI_DAILY_CREDITS = 15;

const CREDIT_COST_BY_STEP: Record<string, number> = {
  "diagnosis.insight": 1,
  "solution.generate": 3,
  "incident.analyze": 3,
  "incident.review": 2,
  "rag.search": 1,
};

/** Public demo quota cost. Unknown AI tasks default to the conservative minimum. */
export function creditCostForStep(step: string): number {
  return CREDIT_COST_BY_STEP[step] ?? 1;
}
