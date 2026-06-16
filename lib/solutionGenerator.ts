/**
 * 行业解决方案生成器（mock 规则，不接真实 AI）。
 * 以制造业为核心，根据输入生成痛点地图、解决方案组合、角色化价值主张与优先落地场景。
 */

import type { SolutionInput } from "@/data/solution";

export interface PainMapRow {
  /** 业务环节 */
  stage: string;
  /** 常见痛点 */
  pains: string;
  /** 数智化机会 */
  opportunity: string;
  /** 是否命中用户所选痛点（用于高亮） */
  highlighted: boolean;
}

export interface SolutionRow {
  /** 推荐场景 */
  scenario: string;
  /** 解决方案 */
  solution: string;
  /** 可用工具组合 */
  tools: string;
  /** 预期价值 */
  value: string;
  highlighted: boolean;
}

export interface RoleValue {
  /** 卡片标题，如「给老板看的价值」 */
  title: string;
  /** 价值主张正文 */
  value: string;
  /** 是否为用户所选目标沟通对象 */
  emphasized: boolean;
}

export interface PriorityScenario {
  title: string;
  summary: string;
  reasons: string[];
}

export interface SolutionResult {
  input: SolutionInput;
  painMap: PainMapRow[];
  solutions: SolutionRow[];
  roleValues: RoleValue[];
  priorityScenario: PriorityScenario;
}

/** 制造业痛点地图基础数据，painKey 对应输入页的痛点选项。 */
const painMapBase: Array<Omit<PainMapRow, "highlighted"> & { painKey: string }> =
  [
    {
      stage: "质量管理",
      painKey: "质量异常处理慢",
      pains: "质量异常处理慢、缺陷追溯困难",
      opportunity: "质量异常闭环、AI 缺陷识别与根因分析",
    },
    {
      stage: "生产运营",
      painKey: "生产日报手工汇总",
      pains: "生产日报手工汇总、进度不透明",
      opportunity: "自动生产日报、实时生产看板",
    },
    {
      stage: "设备管理",
      painKey: "设备巡检不透明",
      pains: "设备巡检不透明、故障被动响应",
      opportunity: "数字巡检、设备预测性维护预警",
    },
    {
      stage: "工艺与知识",
      painKey: "工艺知识难沉淀",
      pains: "工艺知识难沉淀、过度依赖老师傅",
      opportunity: "AI 工艺知识库、SOP 助手",
    },
    {
      stage: "协同管理",
      painKey: "跨部门协同低效",
      pains: "跨部门协同低效、信息割裂",
      opportunity: "协同看板、异常事项闭环管理",
    },
    {
      stage: "经营决策",
      painKey: "管理层数据不可视",
      pains: "管理层数据不可视、决策滞后",
      opportunity: "经营数据看板、关键指标预警",
    },
  ];

/** 制造业解决方案组合基础数据。 */
const solutionsBase: Array<Omit<SolutionRow, "highlighted"> & { painKey: string }> =
  [
    {
      scenario: "质量异常闭环助手",
      painKey: "质量异常处理慢",
      solution: "从异常上报、AI 根因分析到整改、复盘的全流程闭环",
      tools: "AI 视觉质检 + 异常工单 + 根因分析助手",
      value: "缩短异常处理周期，降低不良率与客诉",
    },
    {
      scenario: "生产日报自动化",
      painKey: "生产日报手工汇总",
      solution: "自动采集产线数据并汇总生成日报与摘要",
      tools: "数据采集 + 报表引擎 + AI 摘要",
      value: "节省人工汇总，日报实时化、口径统一",
    },
    {
      scenario: "设备数字巡检",
      painKey: "设备巡检不透明",
      solution: "移动巡检与异常预警，结合预测性维护",
      tools: "巡检 App + IoT 数据 + 预测性维护模型",
      value: "提升设备稼动率，减少非计划停机",
    },
    {
      scenario: "工艺知识沉淀",
      painKey: "工艺知识难沉淀",
      solution: "工艺文档结构化沉淀与智能问答",
      tools: "AI 知识库 + SOP 助手",
      value: "加速新人上手，降低关键知识流失",
    },
    {
      scenario: "跨部门协同看板",
      painKey: "跨部门协同低效",
      solution: "事项协同看板与闭环管理",
      tools: "协同看板 + 流程引擎",
      value: "提升协同效率与事项闭环率",
    },
    {
      scenario: "经营数据看板",
      painKey: "管理层数据不可视",
      solution: "统一经营指标可视与预警",
      tools: "数据中台 + BI + 指标预警",
      value: "决策更快，问题更早被发现",
    },
  ];

/** 各角色价值主张文案，role 用于与目标沟通对象匹配。 */
const roleValueBase: Array<RoleValue & { roleKeys: string[] }> = [
  {
    title: "给老板看的价值",
    roleKeys: ["老板 / CEO"],
    value:
      "以更少投入换取质量与效率的确定性提升，转型有可量化的 ROI 与清晰里程碑。",
    emphasized: false,
  },
  {
    title: "给数字化负责人的价值",
    roleKeys: ["CIO / 数字化负责人"],
    value:
      "以质量异常闭环为切口，低风险试点、快速见效，并沉淀可复用的数据与平台能力。",
    emphasized: false,
  },
  {
    title: "给业务负责人的价值",
    roleKeys: ["业务负责人"],
    value:
      "异常处理更快、生产更透明，团队从被动救火转向主动预防，KPI 可视可管。",
    emphasized: false,
  },
  {
    title: "给一线员工的价值",
    roleKeys: ["一线主管"],
    value:
      "异常一键上报、AI 辅助判断与整改建议，少填表、少跑腿，更专注于把事做好。",
    emphasized: false,
  },
];

export function generateSolution(input: SolutionInput): SolutionResult {
  const selected = new Set(input.painPoints);

  const painMap: PainMapRow[] = painMapBase.map(({ painKey, ...rest }) => ({
    ...rest,
    highlighted: selected.has(painKey),
  }));

  const solutions: SolutionRow[] = solutionsBase.map(
    ({ painKey, ...rest }) => ({
      ...rest,
      highlighted: selected.has(painKey),
    }),
  );

  const roleValues: RoleValue[] = roleValueBase.map(
    ({ roleKeys, ...rest }) => ({
      ...rest,
      emphasized: roleKeys.includes(input.targetRole),
    }),
  );

  const priorityScenario: PriorityScenario = {
    title: "制造业质量异常闭环助手",
    summary:
      "从异常发现到闭环复盘的高频场景，最适合作为首个试点，快速验证价值。",
    reasons: [
      "痛点高频且影响面大，质量异常直接关系成本与客诉",
      "流程清晰、边界明确，适合在 30-60 天内快速试点",
      "价值可量化（处理时长、不良率），且易于现场演示",
    ],
  };

  return { input, painMap, solutions, roleValues, priorityScenario };
}
