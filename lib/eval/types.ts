/** 单项检查结果 */
export interface Check {
  name: string;
  passed: boolean;
  /** 可选量化分（0-1），用于忠实度/召回等 */
  score?: number;
  detail?: string;
}

/** 单个用例的评测结果 */
export interface CaseResult {
  id: string;
  type: "diagnosis" | "solution" | "incident" | "retrieval";
  checks: Check[];
  passed: boolean;
  error?: string;
}

/** 一次评测的汇总报告 */
export interface EvalReport {
  startedAt: string;
  baseUrl: string;
  cases: CaseResult[];
  summary: {
    totalCases: number;
    passedCases: number;
    totalChecks: number;
    passedChecks: number;
    /** 按检查名聚合的通过率 */
    byMetric: Record<string, { passed: number; total: number }>;
  };
}
