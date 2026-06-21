import { env } from "@/lib/env";

export interface RateResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

// 进程内固定窗口计数。注意：serverless 多实例下是「每实例」限流，
// 作为突发抑制的第一道闸足够；硬性额度保护由「当日成本上限」承担（见 lib/llm/budget.ts）。
const buckets = new Map<string, { count: number; resetAt: number }>();

/** 固定窗口限流。纯函数（now 可注入），便于单测。 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateResult {
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, remaining: limit - b.count, retryAfterSec: 0 };
}

/** 测试用：清空计数。 */
export function _resetRateLimit(): void {
  buckets.clear();
}

/** 从请求解析限流主体：优先匿名 JWT 的 sub，回退到 IP。 */
export function identityFromRequest(req: Request): string {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token) {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString("utf-8"),
      );
      if (payload?.sub) return `u:${payload.sub}`;
    } catch {
      // token 无法解析 → 落到 IP
    }
  }
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon";
  return `ip:${ip}`;
}

/**
 * 路由级限流：超限返回 { retryAfterSec }，否则 null。
 * 默认每分钟 env.ratePerMin 次/主体（对真人/eval 宽松，对刷量收紧）。
 */
export function enforceRateLimit(
  req: Request,
  limitPerMin: number = env.ratePerMin,
): { retryAfterSec: number } | null {
  const r = rateLimit(identityFromRequest(req), limitPerMin, 60_000);
  return r.ok ? null : { retryAfterSec: r.retryAfterSec };
}
