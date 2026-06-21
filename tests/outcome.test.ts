import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeLoopOutcome } from "@/lib/manufacturing/outcome";

const tasks = [
  { status: "已关闭" },
  { status: "已关闭" },
  { status: "处理中" },
  { status: "待确认" },
];
const events = [
  { actor: "human", to_state: "reported" },
  { actor: "ai", to_state: "analyzed" },
  { actor: "ai", to_state: "tasks_generated" },
  { actor: "human", to_state: "in_progress" },
  { actor: "ai", to_state: "reviewed" },
];

describe("computeLoopOutcome", () => {
  it("任务闭环率：已关闭 / 总数", () => {
    const o = computeLoopOutcome(tasks, events);
    assert.equal(o.totalTasks, 4);
    assert.equal(o.closedTasks, 2);
    assert.equal(o.closureRate, 0.5);
  });

  it("AI / 人工环节计数", () => {
    const o = computeLoopOutcome(tasks, events);
    assert.equal(o.totalSteps, 5);
    assert.equal(o.aiSteps, 3);
    assert.equal(o.humanSteps, 2);
  });

  it("阶段去重并保持发生顺序", () => {
    const dup = [...events, { actor: "human", to_state: "reviewed" }];
    const o = computeLoopOutcome(tasks, dup);
    assert.deepEqual(o.stages, [
      "reported",
      "analyzed",
      "tasks_generated",
      "in_progress",
      "reviewed",
    ]);
  });

  it("空输入不除零，闭环率为 0", () => {
    const o = computeLoopOutcome([], []);
    assert.equal(o.closureRate, 0);
    assert.equal(o.totalSteps, 0);
    assert.deepEqual(o.stages, []);
  });

  it("targetHours 默认 72、可覆盖", () => {
    assert.equal(computeLoopOutcome(tasks, events).targetHours, 72);
    assert.equal(computeLoopOutcome(tasks, events, 48).targetHours, 48);
  });

  it("忽略空 to_state 与未知 actor", () => {
    const o = computeLoopOutcome(
      [{ status: null }],
      [
        { actor: null, to_state: null },
        { actor: "system", to_state: "x" },
      ],
    );
    assert.equal(o.closedTasks, 0);
    assert.equal(o.aiSteps, 0);
    assert.equal(o.humanSteps, 0);
    assert.deepEqual(o.stages, ["x"]);
  });
});
