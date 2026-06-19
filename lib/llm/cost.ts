/**
 * LLM 成本估算（USD / 每百万 token）。仅为近似，用于 Trace Viewer 展示。
 * 价格会变动；以各平台官方为准。
 */
interface Price {
  input: number;
  output: number;
}

const PRICES: Record<string, Price> = {
  // OpenAI
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "text-embedding-3-small": { input: 0.02, output: 0 },
  // DeepSeek（约值）
  "deepseek-chat": { input: 0.27, output: 1.1 },
  // 通义千问（约值）
  "qwen-plus": { input: 0.4, output: 1.2 },
  "text-embedding-v3": { input: 0.05, output: 0 },
  "text-embedding-v4": { input: 0.07, output: 0 },
};

/** 按系列前缀兜底匹配价格（应对各平台的具体变体名，如 deepseek-v4-flash）。 */
function matchByPrefix(model: string): Price | undefined {
  if (model.startsWith("gpt-4o-mini")) return PRICES["gpt-4o-mini"];
  if (model.startsWith("gpt-4o")) return PRICES["gpt-4o"];
  if (model.startsWith("deepseek")) return PRICES["deepseek-chat"];
  if (model.startsWith("qwen")) return PRICES["qwen-plus"];
  if (model.startsWith("text-embedding-v")) return PRICES["text-embedding-v4"];
  if (model.startsWith("text-embedding-3")) return PRICES["text-embedding-3-small"];
  return undefined;
}

/** 根据模型与 token 数估算成本（USD）。未知模型返回 0。 */
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const p = PRICES[model] ?? matchByPrefix(model);
  if (!p) return 0;
  const cost =
    (inputTokens / 1_000_000) * p.input +
    (outputTokens / 1_000_000) * p.output;
  // 保留 6 位小数
  return Math.round(cost * 1e6) / 1e6;
}
