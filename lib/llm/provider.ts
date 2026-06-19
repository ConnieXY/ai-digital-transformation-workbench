import "server-only";
import OpenAI from "openai";
import { env, hasLLM } from "@/lib/env";
import type { ChatMessage, ChatResult, LLMProvider } from "./types";

/**
 * OpenAI 兼容 provider —— 通过 baseURL 适配 OpenAI / DeepSeek / 通义千问 / Kimi 等，
 * 切换平台只需改环境变量，不改业务代码。
 */
class OpenAICompatibleProvider implements LLMProvider {
  readonly name: string;
  readonly model: string;
  private client: OpenAI;

  constructor() {
    this.name = env.llmProvider;
    this.model = env.llmModel;
    this.client = new OpenAI({
      apiKey: env.llmApiKey,
      baseURL: env.llmBaseUrl,
    });
  }

  async chatJSON(messages: ChatMessage[]): Promise<ChatResult> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });
    return {
      content: res.choices[0]?.message?.content ?? "",
      model: res.model || this.model,
      provider: this.name,
      inputTokens: res.usage?.prompt_tokens ?? 0,
      outputTokens: res.usage?.completion_tokens ?? 0,
    };
  }
}

let provider: LLMProvider | null = null;

/** 获取 LLM provider；未配置 key 时返回 null（调用方降级为规则路径）。 */
export function getLLMProvider(): LLMProvider | null {
  if (!hasLLM) return null;
  if (!provider) provider = new OpenAICompatibleProvider();
  return provider;
}
