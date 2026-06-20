import type { z } from "zod";
import type { Check } from "./types";

/** schema 合法性：用 Zod 重新校验产出。 */
export function checkSchema(schema: z.ZodType, data: unknown): Check {
  const r = schema.safeParse(data);
  return {
    name: "schema_valid",
    passed: r.success,
    detail: r.success ? undefined : JSON.stringify(r.error.issues).slice(0, 200),
  };
}

/**
 * 引用合法性：所有引用序号都在 [1..sourceCount]。
 * 允许某条无引用（abstain）——是否有足够 grounding 由 coverage 单独考核。
 */
export function checkCitations(
  citationLists: number[][],
  sourceCount: number,
): Check {
  const bad: string[] = [];
  citationLists.forEach((cites, i) => {
    for (const n of cites ?? [])
      if (n < 1 || n > sourceCount) bad.push(`#${i + 1} 越界[${n}]`);
  });
  return {
    name: "citations_valid",
    passed: bad.length === 0,
    detail: bad.join("; ") || undefined,
  };
}

/** grounding 覆盖率：有引用的条目占比 ≥ minRatio（防止靠"全部弃权"骗过忠实度）。 */
export function checkCoverage(
  citationLists: number[][],
  minRatio: number,
): Check {
  const total = citationLists.length;
  const grounded = citationLists.filter((c) => c && c.length > 0).length;
  const ratio = total ? grounded / total : 0;
  return {
    name: "grounding_coverage",
    passed: ratio >= minRatio,
    score: Number(ratio.toFixed(2)),
    detail: `有依据 ${grounded}/${total}（要求 ≥${minRatio}）`,
  };
}

/** 关键词覆盖：产出文本应包含期望关键词中的至少 minHit 个。 */
export function checkKeywords(
  text: string,
  keywords: string[],
  minHit = 1,
): Check {
  const hit = keywords.filter((k) => text.includes(k));
  return {
    name: "keywords",
    passed: hit.length >= minHit,
    score: keywords.length ? hit.length / keywords.length : 0,
    detail: `命中 ${hit.length}/${keywords.length}: ${hit.join("、")}`,
  };
}

/** 召回@k：期望文档标题出现在检索结果中。 */
export function checkRecall(titles: string[], expectedTitle: string): Check {
  const passed = titles.includes(expectedTitle);
  return {
    name: "recall@k",
    passed,
    detail: passed ? `命中（位次 ${titles.indexOf(expectedTitle) + 1}）` : `未命中：${titles.join(" / ")}`,
  };
}

/** 字符二元组 Jaccard，作为忠实度的廉价代理信号。 */
export function bigramOverlap(a: string, b: string): number {
  const grams = (s: string) => {
    const t = s.replace(/\s+/g, "");
    const set = new Set<string>();
    for (let i = 0; i < t.length - 1; i++) set.add(t.slice(i, i + 2));
    return set;
  };
  const ga = Array.from(grams(a));
  const gb = grams(b);
  if (ga.length === 0) return 0;
  const inter = ga.filter((g) => gb.has(g)).length;
  return inter / ga.length;
}
