export type ModuleId = "diagnosis" | "solution-builder" | "manufacturing-demo";

export interface WorkbenchModule {
  /** 用于排序与展示的两位序号，例如 "01" */
  index: string;
  id: ModuleId;
  title: string;
  description: string;
  /** 卡片按钮的跳转路径 */
  href: string;
  /** 按钮文案 */
  cta: string;
  /** 卡片左上角的简短标签 */
  tag: string;
}

export const modules: WorkbenchModule[] = [
  {
    index: "01",
    id: "diagnosis",
    title: "企业效能诊断",
    description:
      "帮助企业判断当前成熟度、核心瓶颈和转型优先级。",
    href: "/diagnosis",
    cta: "开始诊断",
    tag: "现状评估",
  },
  {
    index: "02",
    id: "solution-builder",
    title: "行业解决方案生成",
    description:
      "基于行业、客户画像和痛点，生成解决方案、一页纸和 Demo 脚本。",
    href: "/solution-builder",
    cta: "生成方案",
    tag: "方案设计",
  },
  {
    index: "03",
    id: "manufacturing-demo",
    title: "场景落地 Demo",
    description:
      "以制造业质量异常闭环为例，展示 AI 如何嵌入具体业务流程。",
    href: "/manufacturing-demo",
    cta: "查看 Demo",
    tag: "落地示范",
  },
];
