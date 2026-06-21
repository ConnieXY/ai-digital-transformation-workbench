import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * 录制 / 回放层（cassette）：把 eval 消费的两类非确定、需密钥的调用
 *（① 命中服务端 LLM 的 API 响应；② 忠实度裁判 judge）原样录下，
 * 之后在无服务器、无密钥、零成本、可确定复现的环境（如 CI）里回放。
 *
 * EVAL_MODE：
 *   live   （默认）直接真调，不读写磁带 —— 现有在线评测行为
 *   record 真调一次并把请求签名→响应写入 evals/cassettes.json
 *   replay 只从磁带取值，绝不联网/调密钥；缺条目即报错提示重录
 */
export type CassetteMode = "live" | "record" | "replay";
export const cassetteMode: CassetteMode =
  (process.env.EVAL_MODE as CassetteMode) || "live";

const FILE = path.join(process.cwd(), "evals", "cassettes.json");
interface Entry {
  sig: string;
  value: unknown;
}
let store: Record<string, Entry> = {};
let loaded = false;

function load(): void {
  if (loaded) return;
  loaded = true;
  try {
    store = JSON.parse(fs.readFileSync(FILE, "utf-8"));
  } catch {
    store = {};
  }
}

function keyOf(sig: string): string {
  return crypto.createHash("sha1").update(sig).digest("hex").slice(0, 16);
}

/** 录/放一次调用：sig 为稳定的请求签名，live 为真实调用。 */
export async function cassette<T>(
  sig: string,
  live: () => Promise<T>,
): Promise<T> {
  if (cassetteMode === "live") return live();
  const k = keyOf(sig);

  if (cassetteMode === "replay") {
    load();
    const e = store[k];
    if (!e) {
      throw new Error(
        `cassette 缺条目（请用 EVAL_MODE=record 重新录制）：${sig.slice(0, 140)}`,
      );
    }
    return e.value as T;
  }

  // record
  const value = await live();
  store[k] = { sig, value };
  return value;
}

/** record 模式下持久化磁带。 */
export function saveCassette(): void {
  if (cassetteMode !== "record") return;
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(store, null, 2));
}
