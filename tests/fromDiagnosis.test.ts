import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  solutionInputFromDiagnosis,
  type DiagnosisContext,
} from "@/lib/journey/fromDiagnosis";
import { scoreDiagnosis } from "@/lib/scoring";
import { sampleDiagnosisSubmission, type CompanyInfo } from "@/data/diagnosis";
import { businessGoalOptions } from "@/data/solution";

/** 用真实评分引擎 + 示例提交构造一个真实诊断上下文。 */
function sampleContext(overrides: Partial<CompanyInfo> = {}): DiagnosisContext {
  return {
    companyInfo: { ...sampleDiagnosisSubmission.companyInfo, ...overrides },
    result: scoreDiagnosis(sampleDiagnosisSubmission.answers),
    submittedAt: sampleDiagnosisSubmission.submittedAt,
  };
}

describe("solutionInputFromDiagnosis", () => {
  it("行业归一：制造业 → 制造业", () => {
    assert.equal(sampleContext().companyInfo.industry, "制造业");
    assert.equal(solutionInputFromDiagnosis(sampleContext()).industry, "制造业");
  });

  it("行业归一：零售/消费、未知值的映射", () => {
    assert.equal(
      solutionInputFromDiagnosis(sampleContext({ industry: "零售/消费" }))
        .industry,
      "零售",
    );
    assert.equal(
      solutionInputFromDiagnosis(sampleContext({ industry: "金融/保险" }))
        .industry,
      "企业服务",
    );
  });

  it("业务目标由最弱维度推导，去重且只含合法选项", () => {
    const out = solutionInputFromDiagnosis(sampleContext());
    // 示例最弱维度为 AI 应用成熟度 + 流程效率 → 都映射到「增效」→ 去重为 ["增效"]
    assert.deepEqual(out.businessGoals, ["增效"]);
    for (const g of out.businessGoals) {
      assert.ok(businessGoalOptions.includes(g), `${g} 应在合法选项内`);
    }
  });

  it("痛点：从主痛点文本关键词命中制造业选项", () => {
    const out = solutionInputFromDiagnosis(sampleContext());
    // mainPainPoint：质量异常处理慢、跨部门数据不互通、管理层缺乏实时经营视图
    assert.deepEqual(
      out.painPoints,
      ["质量异常处理慢", "跨部门协同低效", "管理层数据不可视"],
    );
  });

  it("主痛点无可命中关键词时痛点留空（交由用户补选）", () => {
    const out = solutionInputFromDiagnosis(
      sampleContext({ mainPainPoint: "暂无特别问题" }),
    );
    assert.deepEqual(out.painPoints, []);
  });

  it("补充说明凝练诊断结论且成熟度不重复前缀", () => {
    const ctx = sampleContext();
    const out = solutionInputFromDiagnosis(ctx);
    assert.match(out.additionalContext, /继承自企业诊断/);
    assert.match(out.additionalContext, /核心短板/);
    assert.match(out.additionalContext, /推荐优先场景/);
    // maturity.label 已含等级前缀（如「L2 在线化阶段」），不应出现「L2 L2」
    assert.ok(
      !/L\d\s+L\d/.test(out.additionalContext),
      "成熟度等级不应重复",
    );
  });

  it("企业规模：合法直传、非法置空；现状系统直传", () => {
    const valid = solutionInputFromDiagnosis(sampleContext());
    assert.equal(valid.companySize, "中型（200-1000 人）");
    assert.equal(valid.currentSystems, "ERP、MES、企业微信");

    const invalid = solutionInputFromDiagnosis(
      sampleContext({ companySize: "巨型（百万人）" }),
    );
    assert.equal(invalid.companySize, "");
  });
});
