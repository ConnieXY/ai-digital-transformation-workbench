import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildKnowledgeBlock, filterCitations } from "@/lib/ai/citations";
import type { SolutionSource } from "@/lib/schemas/solution";

const src = (index: number, title: string, docType: string): SolutionSource => ({
  index,
  title,
  docType,
  snippet: `snippet-${index}`,
  similarity: 0.9,
});

const sources = [src(1, "T1", "sop"), src(2, "T2", "case"), src(3, "T3", "method")];

describe("filterCitations（过滤越界引用）", () => {
  it("只保留存在的来源序号", () => {
    assert.deepEqual(filterCitations([1, 3, 9], sources), [1, 3]);
  });

  it("空 / null / undefined 安全返回 []", () => {
    assert.deepEqual(filterCitations([], sources), []);
    assert.deepEqual(filterCitations(null as unknown as number[], sources), []);
    assert.deepEqual(
      filterCitations(undefined as unknown as number[], sources),
      [],
    );
  });

  it("全部越界 → []", () => {
    assert.deepEqual(filterCitations([7, 8], sources), []);
  });

  it("无来源时任何引用都被过滤", () => {
    assert.deepEqual(filterCitations([1, 2], []), []);
  });
});

describe("buildKnowledgeBlock（拼接知识块）", () => {
  it("按 [序号] (类型) 标题 + 正文 拼接，段间空行分隔", () => {
    const out = buildKnowledgeBlock(sources.slice(0, 2), ["内容A", "内容B"]);
    assert.equal(out, "[1] (sop) T1\n内容A\n\n[2] (case) T2\n内容B");
  });

  it("空来源 → 空串", () => {
    assert.equal(buildKnowledgeBlock([], []), "");
  });
});
