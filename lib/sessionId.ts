"use client";

const KEY = "wb:session";

/** 获取/生成本浏览器的匿名 session id（用于把数据归属到当前访客）。 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "anonymous";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}
