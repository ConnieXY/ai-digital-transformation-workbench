/**
 * 企业效能诊断（6D 模型）共享数据。
 * /diagnosis 概览页与 /diagnosis/questionnaire 问卷页共用同一份维度定义，
 * 保证两处文案与顺序一致。
 */

export type DimensionId =
  | "org-collaboration"
  | "process-efficiency"
  | "data-management"
  | "knowledge"
  | "business-operation"
  | "ai-maturity";

export interface Dimension {
  /** 两位序号，例如 "01" */
  index: string;
  id: DimensionId;
  title: string;
  /** 概览卡片上的简短说明 */
  description: string;
}

export interface Question {
  dimension: DimensionId;
  question: string;
  /** 评分提示，帮助用户理解该题在问什么 */
  description: string;
}

/** 6D 诊断维度定义 */
export const dimensions: Dimension[] = [
  {
    index: "01",
    id: "org-collaboration",
    title: "组织协同",
    description: "跨部门协作、信息流转与决策机制是否顺畅高效。",
  },
  {
    index: "02",
    id: "process-efficiency",
    title: "流程效率",
    description: "核心业务流程的标准化、自动化与整体执行效率。",
  },
  {
    index: "03",
    id: "data-management",
    title: "数据管理",
    description: "数据的采集、质量、打通与对业务的可用性。",
  },
  {
    index: "04",
    id: "knowledge",
    title: "知识沉淀",
    description: "经验与知识的记录、检索、复用与传承能力。",
  },
  {
    index: "05",
    id: "business-operation",
    title: "客户/业务经营",
    description: "客户洞察、经营指标与数据驱动决策的成熟度。",
  },
  {
    index: "06",
    id: "ai-maturity",
    title: "AI 应用成熟度",
    description: "AI 工具在业务中的认知、渗透与价值创造水平。",
  },
];

/** 6D × 4 题问卷，每题采用 1-5 分单选评分 */
export const questions: Question[] = [
  // 01 组织协同
  {
    dimension: "org-collaboration",
    question: "跨部门协作是否顺畅？",
    description: "部门之间的协作配合是否高效，信息能否顺畅流转。",
  },
  {
    dimension: "org-collaboration",
    question: "关键决策的响应速度如何？",
    description: "重要事项能否快速达成共识并推动落地执行。",
  },
  {
    dimension: "org-collaboration",
    question: "团队目标与公司战略是否对齐？",
    description: "各团队的目标是否清晰，并与公司整体战略保持一致。",
  },
  {
    dimension: "org-collaboration",
    question: "是否有统一的协同工具支撑日常工作？",
    description: "日常沟通、任务与文档协作是否依托统一的在线工具。",
  },

  // 02 流程效率
  {
    dimension: "process-efficiency",
    question: "核心业务流程是否已标准化？",
    description: "关键流程是否经过梳理并形成可执行的标准化规范。",
  },
  {
    dimension: "process-efficiency",
    question: "重复性工作是否已实现自动化？",
    description: "高频、规则明确的工作是否已通过系统自动处理。",
  },
  {
    dimension: "process-efficiency",
    question: "流程中的瓶颈是否可被及时发现？",
    description: "能否及时识别并定位流程中的卡点与等待环节。",
  },
  {
    dimension: "process-efficiency",
    question: "跨环节流转是否需要大量人工搬运？",
    description: "不同系统或环节之间是否依赖大量人工复制、录入。",
  },

  // 03 数据管理
  {
    dimension: "data-management",
    question: "关键业务数据是否被完整记录？",
    description: "核心经营与业务数据是否被及时、完整地采集留存。",
  },
  {
    dimension: "data-management",
    question: "数据质量是否可信赖？",
    description: "数据是否准确、口径统一，能够直接用于分析决策。",
  },
  {
    dimension: "data-management",
    question: "各系统的数据是否已打通？",
    description: "不同系统的数据是否可关联、可贯通分析。",
  },
  {
    dimension: "data-management",
    question: "业务人员能否便捷获取所需数据？",
    description: "一线人员是否能自助、及时地拿到所需的数据。",
  },

  // 04 知识沉淀
  {
    dimension: "knowledge",
    question: "业务经验是否已文档化？",
    description: "关键经验与流程是否被记录成可复用的文档。",
  },
  {
    dimension: "knowledge",
    question: "员工能否快速检索到所需知识？",
    description: "需要的资料与知识能否被便捷地搜索和获取。",
  },
  {
    dimension: "knowledge",
    question: "核心员工离职是否会造成知识断层？",
    description: "关键岗位的知识是否过度依赖个人、缺乏沉淀。",
  },
  {
    dimension: "knowledge",
    question: "优秀实践能否被快速复制？",
    description: "成功经验是否能高效复制推广到其他团队。",
  },

  // 05 客户/业务经营
  {
    dimension: "business-operation",
    question: "是否对客户有清晰的数据洞察？",
    description: "对客户需求与行为是否有基于数据的清晰理解。",
  },
  {
    dimension: "business-operation",
    question: "核心经营指标是否实时可见？",
    description: "关键经营指标是否可实时监控、及时预警。",
  },
  {
    dimension: "business-operation",
    question: "经营决策是否主要依据数据？",
    description: "重要经营决策是依据数据，还是主要依赖经验判断。",
  },
  {
    dimension: "business-operation",
    question: "能否基于数据识别增长机会？",
    description: "是否能从数据中发现明确、可执行的增长抓手。",
  },

  // 06 AI 应用成熟度
  {
    dimension: "ai-maturity",
    question: "团队对 AI 的能力与边界是否有清晰认知？",
    description: "团队是否理解 AI 能做什么、不能做什么。",
  },
  {
    dimension: "ai-maturity",
    question: "日常工作中是否已实际使用 AI 工具？",
    description: "员工是否已将 AI 工具用于真实的日常工作。",
  },
  {
    dimension: "ai-maturity",
    question: "是否有 AI 在核心业务中产生价值的案例？",
    description: "AI 是否已在关键业务场景中带来可衡量的价值。",
  },
  {
    dimension: "ai-maturity",
    question: "公司是否有明确的 AI 应用规划？",
    description: "公司层面是否有清晰的 AI 应用方向与资源投入。",
  },
];

/** 评分量表说明，问卷页单选项复用 */
export const scoreScale = [
  { value: 1, label: "很差" },
  { value: 2, label: "较弱" },
  { value: 3, label: "一般" },
  { value: 4, label: "较好" },
  { value: 5, label: "优秀" },
] as const;

/** 企业基本信息字段 */
export interface CompanyInfo {
  companyName: string;
  industry: string;
  companySize: string;
  employeeCount: string;
  currentSystems: string;
  mainPainPoint: string;
}

/** 所有字段的合理默认空值 */
export const emptyCompanyInfo: CompanyInfo = {
  companyName: "",
  industry: "",
  companySize: "",
  employeeCount: "",
  currentSystems: "",
  mainPainPoint: "",
};

/**
 * 问卷答案：键为 questions 数组的下标，值为 1-5 的评分。
 */
export type Answers = Record<number, number>;

/** 提交后写入 localStorage 的数据结构 */
export interface DiagnosisSubmission {
  companyInfo: CompanyInfo;
  answers: Answers;
  submittedAt: string;
}

/** localStorage 存储键，问卷页写入、报告页读取共用 */
export const DIAGNOSIS_STORAGE_KEY = "diagnosis:submission";

/**
 * localStorage 存储键：报告页将诊断上下文传递给「行业解决方案生成」模块。
 * 第二模块未来可读取该数据，作为方案生成的输入。
 */
export const SOLUTION_CONTEXT_KEY = "solution:diagnosis-context";

/** 下拉选项：行业 */
export const industryOptions = [
  "制造业",
  "零售/消费",
  "金融/保险",
  "医疗/健康",
  "教育/培训",
  "互联网/科技",
  "物流/供应链",
  "能源/化工",
  "专业服务",
  "其他",
];

/** 下拉选项：企业规模 */
export const companySizeOptions = [
  "初创（50 人以下）",
  "小型（50-200 人）",
  "中型（200-1000 人）",
  "大型（1000-5000 人）",
  "超大型（5000 人以上）",
];

/**
 * 示例诊断数据：用于「填入示例」与「查看示例报告」一键演示。
 * 答案经设计使综合分落在 L2，短板集中在「AI 应用成熟度」与「流程效率」。
 */
export const sampleDiagnosisSubmission: DiagnosisSubmission = {
  companyInfo: {
    companyName: "示例制造科技有限公司",
    industry: "制造业",
    companySize: "中型（200-1000 人）",
    employeeCount: "560",
    currentSystems: "ERP、MES、企业微信",
    mainPainPoint:
      "质量异常处理慢、跨部门数据不互通，管理层缺乏实时经营视图。",
  },
  answers: {
    0: 3, 1: 3, 2: 3, 3: 3, // 组织协同
    4: 2, 5: 2, 6: 2, 7: 3, // 流程效率
    8: 3, 9: 2, 10: 3, 11: 3, // 数据管理
    12: 3, 13: 2, 14: 3, 15: 2, // 知识沉淀
    16: 3, 17: 4, 18: 3, 19: 4, // 客户/业务经营
    20: 2, 21: 1, 22: 2, 23: 1, // AI 应用成熟度
  },
  submittedAt: "2026-06-16T09:30:00.000Z",
};
