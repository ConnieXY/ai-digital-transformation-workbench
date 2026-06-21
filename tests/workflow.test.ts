import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  INCIDENT_STATES,
  canTransition,
} from "@/lib/workflow/incidentStates";

describe("canTransition（质量异常状态机）", () => {
  it("合法流转放行", () => {
    assert.ok(canTransition("reported", "analyzed"));
    assert.ok(canTransition("analyzed", "tasks_generated"));
    assert.ok(canTransition("tasks_generated", "in_progress"));
    assert.ok(canTransition("tasks_generated", "reviewed")); // 可跳过处理中
    assert.ok(canTransition("in_progress", "reviewed"));
    assert.ok(canTransition("reviewed", "closed"));
  });

  it("非法流转拦截", () => {
    assert.equal(canTransition("reported", "reviewed"), false);
    assert.equal(canTransition("reported", "closed"), false);
    assert.equal(canTransition("analyzed", "reported"), false); // 不可回退
    assert.equal(canTransition("closed", "reported"), false);
  });

  it("同态幂等放行", () => {
    assert.ok(canTransition("in_progress", "in_progress"));
    assert.ok(canTransition("closed", "closed"));
  });

  it("closed 为终态，无任何向外流转", () => {
    for (const s of INCIDENT_STATES) {
      if (s === "closed") continue;
      assert.equal(canTransition("closed", s), false, `closed → ${s} 应被拦截`);
    }
  });

  it("状态集合完整且有序", () => {
    assert.deepEqual(INCIDENT_STATES, [
      "reported",
      "analyzed",
      "tasks_generated",
      "in_progress",
      "reviewed",
      "closed",
    ]);
  });
});
