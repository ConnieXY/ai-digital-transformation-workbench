import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PUBLIC_AI_DAILY_CREDITS,
  creditCostForStep,
} from "@/lib/ai/creditsCore";

describe("public AI credits", () => {
  it("默认每日额度为 15 credits", () => {
    assert.equal(DEFAULT_PUBLIC_AI_DAILY_CREDITS, 15);
  });

  it("按 AI 任务消耗 credits", () => {
    assert.equal(creditCostForStep("diagnosis.insight"), 1);
    assert.equal(creditCostForStep("solution.generate"), 3);
    assert.equal(creditCostForStep("incident.analyze"), 3);
    assert.equal(creditCostForStep("incident.review"), 2);
    assert.equal(creditCostForStep("rag.search"), 1);
  });

  it("未知任务使用保守的最低消耗", () => {
    assert.equal(creditCostForStep("unknown.step"), 1);
  });
});
