import type { SolutionSource } from "@/lib/schemas/solution";

/** 把带编号的来源拼成喂给 LLM 的知识块（引用其序号）。纯函数、可单测。 */
export function buildKnowledgeBlock(
  sources: SolutionSource[],
  chunkContents: string[],
): string {
  return sources
    .map((s, i) => `[${s.index}] (${s.docType}) ${s.title}\n${chunkContents[i]}`)
    .join("\n\n");
}

/** 过滤越界引用（保证 citations 只含有效来源序号）。纯函数、可单测。 */
export function filterCitations(
  cites: number[],
  sources: SolutionSource[],
): number[] {
  const valid = new Set(sources.map((s) => s.index));
  return (cites ?? []).filter((n) => valid.has(n));
}
