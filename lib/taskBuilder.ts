/**
 * 闭环任务生成器（基于 AI 异常分析结果，规则驱动）。
 * 任务看板页与复盘报告页复用，保证任务数据单一来源。
 */

import type { IncidentInput } from "@/data/manufacturing";
import { analyzeIncident } from "@/lib/incidentAnalyzer";

export type TaskStatus =
  | "待确认"
  | "待分派"
  | "处理中"
  | "待验证"
  | "已关闭";

export interface ClosedLoopTask {
  id: string;
  title: string;
  department: string;
  priority: "高" | "中" | "低";
  due: string;
  status: TaskStatus;
  description: string;
}

/** 看板列顺序 */
export const taskColumns: TaskStatus[] = [
  "待确认",
  "待分派",
  "处理中",
  "待验证",
  "已关闭",
];

/** 根据异常分析生成 4-6 张闭环任务卡片，分布在各看板列。 */
export function buildTasks(incident: IncidentInput): ClosedLoopTask[] {
  const analysis = analyzeIncident(incident);
  const batch = incident.batch || "相关";
  const [isolate, supplier, transport] = analysis.nextTasks;

  return [
    {
      id: "confirm",
      title: `确认异常现象与影响范围（${batch} 批次）`,
      department: "质量管理（QC/QE）",
      priority: "高",
      due: "4 小时内",
      status: "待确认",
      description: "复核上报信息，确认不良现象、数量与波及批次。",
    },
    {
      id: "supplier",
      title: supplier?.title ?? "约谈新供应商并核查来料质量",
      department: supplier?.owner ?? "采购与供应商质量（SQE）",
      priority: "高",
      due: supplier?.due ?? "3 天内",
      status: "待分派",
      description: "联系新供应商核查来料批次与材质，并安排留样送检。",
    },
    {
      id: "isolate",
      title: isolate?.title ?? `隔离并全检 ${batch} 批次产品`,
      department: isolate?.owner ?? "质量管理（QC）",
      priority: "高",
      due: isolate?.due ?? "24 小时内",
      status: "处理中",
      description: `隔离 ${batch} 批次在制品与库存，执行 100% 全检拦截不良。`,
    },
    {
      id: "transport",
      title: transport?.title ?? "排查搬运与周转环节防护问题",
      department: transport?.owner ?? "仓储与物流",
      priority: "中",
      due: transport?.due ?? "3 天内",
      status: "处理中",
      description: "检查搬运路径、周转容器与堆放防护，定位磕碰风险点。",
    },
    {
      id: "sop",
      title: "复核组装工序 SOP 与治具状态",
      department: "生产制造部",
      priority: "中",
      due: "5 天内",
      status: "待验证",
      description: "复核作业规范与治具磨损情况，验证整改有效性。",
    },
    {
      id: "alert",
      title: "下发质量预警通知",
      department: "质量管理（QC/QE）",
      priority: "低",
      due: "已完成",
      status: "已关闭",
      description: "向相关产线与班组下发异常预警，要求加强自检。",
    },
  ];
}
