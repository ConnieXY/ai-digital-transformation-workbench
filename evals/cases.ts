/**
 * 评测黄金集（golden set）。刻意覆盖：结构化合法性、引用有效性、忠实度、检索召回，
 * 并包含一个"语料覆盖较弱"的零售用例，用于暴露 grounding 边界。
 */

export type EvalCase =
  | {
      id: string;
      type: "diagnosis";
      companyInfo: Record<string, string>;
      answers: Record<string, number>;
      expectKeywords: string[];
    }
  | {
      id: string;
      type: "solution";
      input: {
        industry: string;
        companySize: string;
        targetRole: string;
        businessGoals: string[];
        painPoints: string[];
        currentSystems: string;
        additionalContext: string;
      };
      expectKeywords: string[];
      /** 强语料场景要求的最低 grounding 覆盖率；弱语料省略（允许诚实弃权） */
      expectGroundingCoverage?: number;
    }
  | {
      id: string;
      type: "incident";
      incident: Record<string, string>;
      expectTopCauseKeywords: string[];
      expectKeywords: string[];
      expectGroundingCoverage?: number;
    }
  | {
      id: string;
      type: "retrieval";
      query: string;
      expectedTitle: string;
    };

const mfgAnswers: Record<string, number> = {
  0: 3, 1: 3, 2: 3, 3: 3, 4: 2, 5: 2, 6: 2, 7: 3,
  8: 3, 9: 2, 10: 3, 11: 3, 12: 3, 13: 2, 14: 3, 15: 2,
  16: 3, 17: 4, 18: 3, 19: 4, 20: 2, 21: 1, 22: 2, 23: 1,
};

export const cases: EvalCase[] = [
  {
    id: "diagnosis-mfg-low-ai",
    type: "diagnosis",
    companyInfo: {
      companyName: "评测制造甲",
      industry: "制造业",
      companySize: "中型（200-1000 人）",
      employeeCount: "500",
      currentSystems: "ERP、MES",
      mainPainPoint: "质量异常处理慢、数据不互通",
    },
    answers: mfgAnswers,
    expectKeywords: ["流程", "数据", "AI"],
  },
  {
    id: "solution-mfg-quality",
    type: "solution",
    input: {
      industry: "制造业",
      companySize: "中型（200-1000 人）",
      targetRole: "CIO / 数字化负责人",
      businessGoals: ["质量提升", "管理透明"],
      painPoints: ["质量异常处理慢", "跨部门协同低效", "管理层数据不可视"],
      currentSystems: "ERP、MES",
      additionalContext: "产线质量异常频发",
    },
    expectKeywords: ["质量", "数据"],
    expectGroundingCoverage: 0.5,
  },
  {
    id: "solution-retail-weak-corpus",
    type: "solution",
    input: {
      industry: "零售",
      companySize: "中型（200-1000 人）",
      targetRole: "业务负责人",
      businessGoals: ["增长", "客户体验提升"],
      painPoints: ["库存周转慢", "会员运营粗放"],
      currentSystems: "POS、CRM",
      additionalContext: "希望提升复购",
    },
    expectKeywords: ["数据"],
  },
  {
    id: "incident-scratch-supplier",
    type: "incident",
    incident: {
      productName: "智能音箱",
      productionLine: "A 产线",
      process: "组装",
      batch: "B202406",
      incidentType: "外观缺陷（划痕）",
      incidentDescription:
        "组装环节发现 30 件产品外壳划痕，集中在 B202406 批次，昨天刚更换过外壳供应商材料。",
      affectedQuantity: "30",
      severity: "一般",
      discoveredAt: "2026-06-19T09:20",
      reporter: "评测员",
    },
    expectTopCauseKeywords: ["来料", "供应商", "材料"],
    expectKeywords: ["隔离", "检验"],
    expectGroundingCoverage: 0.5,
  },
  {
    id: "retrieval-scratch-case",
    type: "retrieval",
    query: "组装工序外壳划痕，最近更换供应商材料，如何排查",
    expectedTitle: "案例：外壳划痕与供应商换料",
  },
  {
    id: "retrieval-iqc",
    type: "retrieval",
    query: "来料检验抽样标准 AQL 换料加严",
    expectedTitle: "来料检验 IQC 规范",
  },
];
