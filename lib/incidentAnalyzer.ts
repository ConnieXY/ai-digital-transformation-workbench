/**
 * 质量异常 mock AI 分析器（规则驱动，不接真实 AI）。
 * 读取异常上报数据，结合关键词识别，生成结构化分析结果。
 */

import type { IncidentInput } from "@/data/manufacturing";

export interface ProbableCause {
  cause: string;
  likelihood: "高" | "中" | "低";
  basis: string;
}

export interface NextTask {
  title: string;
  owner: string;
  due: string;
}

export interface IncidentAnalysis {
  /** 1. 异常类型识别 */
  incidentType: string;
  /** 2. 影响范围 */
  scope: string;
  /** 3. 严重等级判断 */
  severity: { level: string; rationale: string };
  /** 4. 可能原因排序（按可能性从高到低） */
  probableCauses: ProbableCause[];
  /** 5. 建议责任部门 */
  responsibleDepartments: string[];
  /** 6. 临时遏制措施 */
  containment: string[];
  /** 7. 根因排查建议 */
  rootCauseInvestigation: string[];
  /** 8. 长期预防措施 */
  prevention: string[];
  /** 9. 建议下一步任务 */
  nextTasks: NextTask[];
}

const likelihoodWeight: Record<ProbableCause["likelihood"], number> = {
  高: 3,
  中: 2,
  低: 1,
};

/** 根据影响数量推断严重等级（上报未选时的兜底）。 */
function inferSeverity(quantity: number): string {
  if (quantity >= 100) return "严重";
  if (quantity >= 30) return "一般";
  return "轻微";
}

export function analyzeIncident(incident: IncidentInput): IncidentAnalysis {
  const text = `${incident.incidentDescription} ${incident.incidentType}`;
  const has = (...keywords: string[]) => keywords.some((k) => text.includes(k));

  const quantity = Number(incident.affectedQuantity) || 0;
  const batch = incident.batch || "相关";
  const line = incident.productionLine || "相关产线";
  const process = incident.process || "相关工序";

  // 1. 异常类型识别
  const incidentType =
    incident.incidentType ||
    (has("划痕", "外观", "脏污", "色差") ? "外观缺陷" : "质量异常");

  // 2. 影响范围
  const scope = `${line}${process}环节，${batch} 批次，初步影响 ${
    quantity || "若干"
  } 件${incident.productName ? `（${incident.productName}）` : ""}。`;

  // 3. 严重等级判断
  const level = incident.severity || inferSeverity(quantity);
  const severity = {
    level,
    rationale: `影响数量约 ${quantity || "若干"} 件且集中于 ${batch} 批次，结合异常性质综合判定为「${level}」。`,
  };

  // 4. 可能原因排序（关键词识别）
  const causes: ProbableCause[] = [];
  if (has("供应商", "来料", "材料")) {
    causes.push({
      cause: "来料/原材料异常（疑似新供应商材料波动）",
      likelihood: "高",
      basis: "描述提及近期更换供应商材料，时间与异常出现高度吻合。",
    });
  } else {
    causes.push({
      cause: "来料/原材料异常",
      likelihood: "中",
      basis: "外观类缺陷常与来料质量波动相关。",
    });
  }
  if (has("搬运", "磕碰", "运输", "转运")) {
    causes.push({
      cause: "搬运/转运过程磕碰",
      likelihood: "高",
      basis: "描述提及搬运环节，外壳划痕易在转运中产生。",
    });
  } else {
    causes.push({
      cause: "搬运/转运过程磕碰",
      likelihood: "中",
      basis: "外观划痕可能在物料周转中产生。",
    });
  }
  causes.push({
    cause: "治具/工装接触不良或磨损",
    likelihood: "中",
    basis: `${process}环节治具与产品接触面可能造成划伤。`,
  });
  causes.push({
    cause: "作业操作不规范",
    likelihood: "低",
    basis: "人为操作偏差可能加剧外观不良，但通常非主因。",
  });
  causes.sort(
    (a, b) => likelihoodWeight[b.likelihood] - likelihoodWeight[a.likelihood],
  );

  // 5. 建议责任部门
  const responsibleDepartments: string[] = [];
  if (has("供应商", "来料", "材料"))
    responsibleDepartments.push("采购与供应商质量（SQE）");
  if (has("搬运", "磕碰", "运输", "转运"))
    responsibleDepartments.push("仓储与物流");
  responsibleDepartments.push("生产制造部", "质量管理（QC/QE）");

  // 6. 临时遏制措施
  const containment = [
    `立即隔离 ${batch} 批次的在制品与库存，防止不良流出`,
    "对该批次产品执行 100% 全检，拦截不良品",
    "暂停疑似问题来料/供应商材料的投产，待确认后放行",
  ];

  // 7. 根因排查建议
  const rootCauseInvestigation = [
    "比对新旧供应商来料的外观与材质差异，留样送检",
    "核查搬运与周转环节的防护方式与堆放规范",
    `复核${process}工序作业 SOP 与治具状态`,
  ];

  // 8. 长期预防措施
  const prevention = [
    "完善来料检验（IQC）标准，增加外观抽检项与供应商考核",
    "制定搬运防护规范与周转容器标准，减少磕碰",
    "在关键工序引入在线/AI 外观检测，实现早发现早拦截",
  ];

  // 9. 建议下一步任务
  const nextTasks: NextTask[] = [
    {
      title: `隔离并全检 ${batch} 批次产品`,
      owner: "质量管理（QC）",
      due: "24 小时内",
    },
    {
      title: "约谈新供应商并核查来料质量",
      owner: "采购与供应商质量（SQE）",
      due: "3 天内",
    },
    {
      title: "排查搬运与周转环节防护问题",
      owner: "仓储与物流",
      due: "3 天内",
    },
    {
      title: "输出根因分析与整改报告",
      owner: "生产制造部",
      due: "7 天内",
    },
  ];

  return {
    incidentType,
    scope,
    severity,
    probableCauses: causes,
    responsibleDepartments,
    containment,
    rootCauseInvestigation,
    prevention,
    nextTasks,
  };
}
