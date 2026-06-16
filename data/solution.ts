/**
 * AI 行业解决方案生成器（模块二）共享数据。
 */

/** 行业选项 */
export const industryOptions = ["制造业", "零售", "物流", "教育", "企业服务"];

/** 企业规模选项（与诊断模块保持一致） */
export const solutionCompanySizeOptions = [
  "初创（50 人以下）",
  "小型（50-200 人）",
  "中型（200-1000 人）",
  "大型（1000-5000 人）",
  "超大型（5000 人以上）",
];

/** 目标沟通对象选项 */
export const targetRoleOptions = [
  "老板 / CEO",
  "CIO / 数字化负责人",
  "业务负责人",
  "一线主管",
];

/** 业务目标选项（多选） */
export const businessGoalOptions = [
  "降本",
  "增效",
  "增长",
  "质量提升",
  "管理透明",
  "知识沉淀",
  "客户体验提升",
];

/** 各行业默认业务痛点选项（多选） */
export const painPointsByIndustry: Record<string, string[]> = {
  制造业: [
    "质量异常处理慢",
    "生产日报手工汇总",
    "设备巡检不透明",
    "工艺知识难沉淀",
    "跨部门协同低效",
    "管理层数据不可视",
  ],
  零售: [
    "库存周转慢",
    "门店销售数据滞后",
    "会员运营粗放",
    "补货决策靠经验",
    "促销效果难评估",
    "跨渠道数据割裂",
  ],
  物流: [
    "运单状态不透明",
    "调度依赖人工",
    "异常件处理慢",
    "车辆与仓库利用率低",
    "客户查询响应慢",
    "成本核算不精细",
  ],
  教育: [
    "招生转化率低",
    "教务排课繁琐",
    "学情数据分散",
    "教研知识难沉淀",
    "家校沟通低效",
    "续费预警缺失",
  ],
  企业服务: [
    "商机跟进不及时",
    "项目交付不透明",
    "知识与方案难复用",
    "客户需求理解偏差",
    "跨部门协同低效",
    "服务质量难量化",
  ],
};

/** 模块二输入表单数据结构 */
export interface SolutionInput {
  industry: string;
  companySize: string;
  targetRole: string;
  businessGoals: string[];
  painPoints: string[];
  currentSystems: string;
  additionalContext: string;
}

/** 输入表单默认值（行业默认制造业） */
export const emptySolutionInput: SolutionInput = {
  industry: "制造业",
  companySize: "",
  targetRole: "",
  businessGoals: [],
  painPoints: [],
  currentSystems: "",
  additionalContext: "",
};

/** 示例输入：用于「填入示例」与「查看示例方案」一键演示。 */
export const sampleSolutionInput: SolutionInput = {
  industry: "制造业",
  companySize: "中型（200-1000 人）",
  targetRole: "CIO / 数字化负责人",
  businessGoals: ["增效", "质量提升", "管理透明"],
  painPoints: ["质量异常处理慢", "跨部门协同低效", "管理层数据不可视"],
  currentSystems: "ERP、MES",
  additionalContext:
    "希望优先在质量与协同场景见效，并沉淀可复用的数据与平台能力。",
};

/** localStorage 存储键：输入页写入、结果页读取共用 */
export const SOLUTION_INPUT_KEY = "solution:input";

export interface SolutionCapability {
  /** 两位序号 */
  index: string;
  id: string;
  title: string;
  description: string;
}

/** 该模块可生成的内容 */
export const capabilities: SolutionCapability[] = [
  {
    index: "01",
    id: "pain-map",
    title: "行业痛点地图",
    description: "梳理目标行业的典型痛点与优先级，形成结构化痛点地图。",
  },
  {
    index: "02",
    id: "solution-combo",
    title: "解决方案组合",
    description: "针对核心痛点匹配能力模块，组合出可落地的解决方案。",
  },
  {
    index: "03",
    id: "value-prop",
    title: "角色化价值主张",
    description: "面向不同决策角色，提炼差异化、可感知的价值主张。",
  },
  {
    index: "04",
    id: "roadmap",
    title: "30/60/90 落地路径",
    description: "给出分阶段的落地节奏、关键里程碑与责任分工。",
  },
  {
    index: "05",
    id: "one-pager",
    title: "一页纸方案",
    description: "凝练为可直接对客沟通的一页纸方案概要。",
  },
  {
    index: "06",
    id: "demo-script",
    title: "Demo 脚本",
    description: "生成面向客户演示的场景化、可照着讲的 Demo 脚本。",
  },
];
