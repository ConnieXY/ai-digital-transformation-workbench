/**
 * 企业效能诊断评分逻辑。
 * 输入问卷答案，输出 6 维平均分、综合分、成熟度等级、核心短板与推荐改进场景，
 * 供 /diagnosis/report 报告页直接渲染。
 */

import {
  type Answers,
  type Dimension,
  type DimensionId,
  dimensions,
  questions,
} from "@/data/diagnosis";

/** 单个维度的得分结果 */
export interface DimensionScore {
  dimension: Dimension;
  /** 维度平均分，保留一位小数；该维度无作答时为 0 */
  average: number;
  /** 已作答题数（用于判断该维度是否完整） */
  answeredCount: number;
  /** 该维度的总题数 */
  totalCount: number;
}

/** 成熟度等级 */
export interface MaturityLevel {
  /** 等级代号，如 "L1" */
  level: string;
  /** 等级名称，如 "起步阶段" */
  name: string;
  /** 完整标签，如 "L1 起步阶段" */
  label: string;
  /** 等级解读 */
  description: string;
  /** 该等级的综合分区间 [下限, 上限] */
  range: [number, number];
}

/** 针对低分维度的改进场景推荐 */
export interface RecommendedScenario {
  dimensionId: DimensionId;
  dimensionTitle: string;
  /** 推荐落地的具体场景 */
  scenarios: string[];
}

/** 诊断完整结果 */
export interface DiagnosisResult {
  /** 6 个维度的得分，按维度定义顺序排列 */
  dimensionScores: DimensionScore[];
  /** 综合得分，保留一位小数 */
  overallScore: number;
  /** 成熟度等级 */
  maturity: MaturityLevel;
  /** 最低的两个维度，作为核心短板（按分数升序） */
  weakestDimensions: DimensionScore[];
  /** 基于核心短板的改进场景推荐 */
  recommendations: RecommendedScenario[];
}

/** 各成熟度等级定义，按综合分从低到高排列 */
const maturityLevels: MaturityLevel[] = [
  {
    level: "L1",
    name: "起步阶段",
    label: "L1 起步阶段",
    description:
      "数智化能力刚刚起步，业务高度依赖人工与经验，建议优先打基础、上工具。",
    range: [1.0, 1.9],
  },
  {
    level: "L2",
    name: "在线化阶段",
    label: "L2 在线化阶段",
    description:
      "核心业务已逐步在线化，但系统与数据较为割裂，需推进打通与标准化。",
    range: [2.0, 2.9],
  },
  {
    level: "L3",
    name: "结构化阶段",
    label: "L3 结构化阶段",
    description:
      "流程与数据已较为结构化，可在此基础上引入数据驱动与初步 AI 应用。",
    range: [3.0, 3.9],
  },
  {
    level: "L4",
    name: "智能化阶段",
    label: "L4 智能化阶段",
    description:
      "已具备良好的数据与流程基础，AI 开始在关键场景产生价值，重在规模化落地。",
    range: [4.0, 4.5],
  },
  {
    level: "L5",
    name: "自优化阶段",
    label: "L5 自优化阶段",
    description:
      "数智化与 AI 已深度融入业务，具备数据驱动的自优化能力，处于行业领先水平。",
    range: [4.6, 5.0],
  },
];

/** 低分维度对应的改进场景推荐 */
const scenarioMap: Record<DimensionId, string[]> = {
  "org-collaboration": ["跨部门项目协同看板", "事项闭环管理"],
  "process-efficiency": ["审批/工单/异常闭环流程"],
  "data-management": ["经营数据看板", "统一业务台账"],
  knowledge: ["AI 知识库", "SOP 助手"],
  "business-operation": ["客户/商机/项目经营看板"],
  "ai-maturity": ["AI 文档处理", "智能问答", "流程助手"],
};

/** 保留一位小数 */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** 根据综合分匹配成熟度等级（对区间外的值做就近兜底）。 */
function resolveMaturity(overallScore: number): MaturityLevel {
  const matched = maturityLevels.find(
    (level) => overallScore >= level.range[0] && overallScore <= level.range[1],
  );
  if (matched) return matched;
  // 综合分低于 1.0 归入 L1，高于 5.0 归入 L5。
  return overallScore < maturityLevels[0].range[0]
    ? maturityLevels[0]
    : maturityLevels[maturityLevels.length - 1];
}

/** 计算单个维度的平均分。 */
function scoreDimension(dimension: Dimension, answers: Answers): DimensionScore {
  // 该维度对应的题目在 questions 中的全局下标
  const indices = questions
    .map((question, index) => ({ question, index }))
    .filter(({ question }) => question.dimension === dimension.id)
    .map(({ index }) => index);

  const scores = indices
    .map((index) => answers[index])
    .filter((score): score is number => typeof score === "number");

  const average =
    scores.length > 0
      ? round1(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

  return {
    dimension,
    average,
    answeredCount: scores.length,
    totalCount: indices.length,
  };
}

/**
 * 主入口：根据问卷答案计算完整诊断结果。
 */
export function scoreDiagnosis(answers: Answers): DiagnosisResult {
  const dimensionScores = dimensions.map((dimension) =>
    scoreDimension(dimension, answers),
  );

  // 综合分 = 各维度平均分的均值
  const overallScore = round1(
    dimensionScores.reduce((sum, item) => sum + item.average, 0) /
      dimensionScores.length,
  );

  const maturity = resolveMaturity(overallScore);

  // 核心短板：分数最低的两个维度（升序）
  const weakestDimensions = [...dimensionScores]
    .sort((a, b) => a.average - b.average)
    .slice(0, 2);

  const recommendations: RecommendedScenario[] = weakestDimensions.map(
    ({ dimension }) => ({
      dimensionId: dimension.id,
      dimensionTitle: dimension.title,
      scenarios: scenarioMap[dimension.id],
    }),
  );

  return {
    dimensionScores,
    overallScore,
    maturity,
    weakestDimensions,
    recommendations,
  };
}
