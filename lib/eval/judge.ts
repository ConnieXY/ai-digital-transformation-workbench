import OpenAI from "openai";

/**
 * LLM-as-judge 忠实度评判：给定结论与其引用的证据，判断证据是否支撑该结论。
 * 直接读 LLM_* 环境变量（供 eval 脚本使用）。
 * 注意：LLM-as-judge 本身有偏差，仅作为忠实度的近似信号，非绝对真值。
 */
export async function judgeFaithfulness(
  claim: string,
  evidence: string,
): Promise<{ supported: boolean; reason: string }> {
  const apiKey = process.env.LLM_API_KEY?.trim();
  if (!apiKey) return { supported: false, reason: "no LLM key" };

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.LLM_BASE_URL?.trim() || "https://api.openai.com/v1",
  });

  const res = await client.chat.completions.create({
    model: process.env.LLM_MODEL?.trim() || "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "你是严格的事实核查员。判断【结论】是否能由【证据】直接支撑。" +
          "只看证据，不靠常识补全。返回 JSON：{\"supported\": true|false, \"reason\": \"简短理由\"}。",
      },
      {
        role: "user",
        content: `【结论】${claim}\n\n【证据】${evidence}`,
      },
    ],
  });

  try {
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
    return {
      supported: Boolean(parsed.supported),
      reason: String(parsed.reason ?? ""),
    };
  } catch {
    return { supported: false, reason: "judge parse error" };
  }
}
