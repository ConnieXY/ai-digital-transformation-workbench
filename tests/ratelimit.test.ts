import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { rateLimit, identityFromRequest, _resetRateLimit } from "@/lib/ratelimit";

beforeEach(() => _resetRateLimit());

describe("rateLimit（固定窗口）", () => {
  it("窗口内放行到上限，超出拦截", () => {
    const t0 = 1_000_000;
    assert.equal(rateLimit("k", 3, 60_000, t0).ok, true); // 1
    assert.equal(rateLimit("k", 3, 60_000, t0).ok, true); // 2
    const third = rateLimit("k", 3, 60_000, t0); // 3
    assert.equal(third.ok, true);
    assert.equal(third.remaining, 0);
    const fourth = rateLimit("k", 3, 60_000, t0); // 4 → 拦
    assert.equal(fourth.ok, false);
    assert.ok(fourth.retryAfterSec > 0 && fourth.retryAfterSec <= 60);
  });

  it("窗口滚动后重置", () => {
    const t0 = 2_000_000;
    rateLimit("k", 1, 60_000, t0);
    assert.equal(rateLimit("k", 1, 60_000, t0).ok, false); // 同窗口被拦
    assert.equal(rateLimit("k", 1, 60_000, t0 + 60_001).ok, true); // 新窗口放行
  });

  it("不同主体互不影响", () => {
    const t0 = 3_000_000;
    assert.equal(rateLimit("a", 1, 60_000, t0).ok, true);
    assert.equal(rateLimit("b", 1, 60_000, t0).ok, true);
    assert.equal(rateLimit("a", 1, 60_000, t0).ok, false);
  });
});

describe("identityFromRequest", () => {
  it("优先用 JWT 的 sub", () => {
    const payload = Buffer.from(JSON.stringify({ sub: "user-123" })).toString(
      "base64",
    );
    const req = new Request("http://x", {
      headers: { authorization: `Bearer h.${payload}.s` },
    });
    assert.equal(identityFromRequest(req), "u:user-123");
  });

  it("无 token 时回退到 IP", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    assert.equal(identityFromRequest(req), "ip:203.0.113.7");
  });

  it("无任何标识回退到 anon", () => {
    assert.equal(identityFromRequest(new Request("http://x")), "ip:anon");
  });
});
