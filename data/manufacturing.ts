/**
 * 制造业质量异常闭环助手（模块三）共享数据。
 */

export interface FlowStep {
  /** 两位序号 */
  index: string;
  id: string;
  title: string;
  description: string;
}

/** 质量异常闭环的业务流程步骤 */
export const flowSteps: FlowStep[] = [
  {
    index: "01",
    id: "report",
    title: "异常上报",
    description: "一线发现质量异常，随手拍照、语音或文字快速上报。",
  },
  {
    index: "02",
    id: "structure",
    title: "AI 异常结构化",
    description: "AI 自动提取关键信息，归类异常类型、严重度与责任环节。",
  },
  {
    index: "03",
    id: "root-cause",
    title: "根因分析建议",
    description: "结合历史案例与知识库，给出可能根因与排查方向。",
  },
  {
    index: "04",
    id: "task-board",
    title: "闭环任务看板",
    description: "自动派发整改任务，跟踪处理状态直至闭环。",
  },
  {
    index: "05",
    id: "review",
    title: "复盘报告生成",
    description: "异常处理完成后，一键生成结构化复盘报告。",
  },
  {
    index: "06",
    id: "knowledge",
    title: "质量知识库沉淀",
    description: "将复盘经验沉淀进知识库，反哺后续异常处理。",
  },
];

/** 质量异常上报表单数据结构 */
export interface IncidentInput {
  productName: string;
  productionLine: string;
  process: string;
  batch: string;
  incidentType: string;
  incidentDescription: string;
  affectedQuantity: string;
  severity: string;
  discoveredAt: string;
  reporter: string;
}

/** 表单默认空值 */
export const emptyIncident: IncidentInput = {
  productName: "",
  productionLine: "",
  process: "",
  batch: "",
  incidentType: "",
  incidentDescription: "",
  affectedQuantity: "",
  severity: "",
  discoveredAt: "",
  reporter: "",
};

/** 异常类型选项 */
export const incidentTypeOptions = [
  "外观缺陷（划痕）",
  "尺寸偏差",
  "功能失效",
  "装配错误",
  "来料不良",
  "其他",
];

/** 严重程度选项 */
export const severityOptions = ["轻微", "一般", "严重", "紧急"];

/**
 * 示例异常：用于「填入示例异常」一键填充。
 * discoveredAt 留空，由页面在填充时写入当前时间。
 */
export const sampleIncident: IncidentInput = {
  productName: "智能音箱",
  productionLine: "A 产线",
  process: "组装",
  batch: "B202406",
  incidentType: "外观缺陷（划痕）",
  incidentDescription:
    "今天 A 产线在组装环节发现 30 件产品外壳划痕，集中在 B202406 批次。昨天刚更换过一批外壳供应商材料，初步怀疑可能与来料或搬运过程有关。",
  affectedQuantity: "30",
  severity: "一般",
  discoveredAt: "2026-06-16T09:20",
  reporter: "王磊",
};

/** localStorage 存储键：上报页写入、分析页读取共用 */
export const INCIDENT_STORAGE_KEY = "manufacturing:incident";
