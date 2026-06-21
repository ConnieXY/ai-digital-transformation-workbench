/** 质量异常闭环状态机（纯定义与校验，无副作用，便于单测）。 */
export const INCIDENT_STATES = [
  "reported", // 已上报
  "analyzed", // AI 已分析
  "tasks_generated", // 已生成闭环任务
  "in_progress", // 处理中
  "reviewed", // 已复盘
  "closed", // 已关闭
] as const;

export type IncidentState = (typeof INCIDENT_STATES)[number];

export const STATE_LABEL: Record<IncidentState, string> = {
  reported: "已上报",
  analyzed: "已分析",
  tasks_generated: "已生成任务",
  in_progress: "处理中",
  reviewed: "已复盘",
  closed: "已关闭",
};

/** 允许的状态流转（同态视为幂等放行） */
const ALLOWED: Record<IncidentState, IncidentState[]> = {
  reported: ["analyzed"],
  analyzed: ["tasks_generated"],
  tasks_generated: ["in_progress", "reviewed"],
  in_progress: ["reviewed"],
  reviewed: ["closed"],
  closed: [],
};

export function canTransition(from: IncidentState, to: IncidentState): boolean {
  if (from === to) return true;
  return ALLOWED[from]?.includes(to) ?? false;
}
