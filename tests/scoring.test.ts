import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scoreDiagnosis } from "@/lib/scoring";
import { sampleDiagnosisSubmission, type Answers } from "@/data/diagnosis";

const allAnswers = (v: number): Answers =>
  Object.fromEntries(Array.from({ length: 24 }, (_, i) => [i, v]));

describe("scoreDiagnosis", () => {
  it("示例提交：综合分 2.6、成熟度 L2", () => {
    const r = scoreDiagnosis(sampleDiagnosisSubmission.answers);
    assert.equal(r.overallScore, 2.6);
    assert.equal(r.maturity.level, "L2");
    assert.equal(r.dimensionScores.length, 6);
  });

  it("最弱两维：AI 应用成熟度(1.5) + 流程效率(2.3)", () => {
    const r = scoreDiagnosis(sampleDiagnosisSubmission.answers);
    assert.deepEqual(
      r.weakestDimensions.map((w) => w.dimension.id),
      ["ai-maturity", "process-efficiency"],
    );
    assert.equal(r.weakestDimensions[0].average, 1.5);
    assert.equal(r.weakestDimensions[1].average, 2.3);
  });

  it("推荐场景对应最弱维度", () => {
    const r = scoreDiagnosis(sampleDiagnosisSubmission.answers);
    assert.equal(r.recommendations[0].dimensionId, "ai-maturity");
    assert.deepEqual(r.recommendations[0].scenarios, [
      "AI 文档处理",
      "智能问答",
      "流程助手",
    ]);
  });

  it("满分 → L5 / 全 1 分 → L1（成熟度区间边界）", () => {
    const top = scoreDiagnosis(allAnswers(5));
    assert.equal(top.overallScore, 5);
    assert.equal(top.maturity.level, "L5");

    const bottom = scoreDiagnosis(allAnswers(1));
    assert.equal(bottom.overallScore, 1);
    assert.equal(bottom.maturity.level, "L1");
  });

  it("每个维度得分都在 1..5 区间", () => {
    const r = scoreDiagnosis(sampleDiagnosisSubmission.answers);
    for (const d of r.dimensionScores) {
      assert.ok(d.average >= 1 && d.average <= 5, `${d.dimension.id} 越界`);
    }
  });
});
