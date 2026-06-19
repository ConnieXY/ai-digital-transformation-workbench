export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResult {
  content: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
}

export interface LLMProvider {
  readonly name: string;
  readonly model: string;
  /** 以 JSON 模式返回文本（调用方再做 schema 校验） */
  chatJSON(messages: ChatMessage[]): Promise<ChatResult>;
}

/** 业务实体类型，用于把一次 LLM 调用关联到具体记录（Trace Viewer） */
export type TraceEntityType =
  | "assessment"
  | "solution"
  | "incident"
  | "review"
  | "rag";
