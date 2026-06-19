/**
 * 知识库灌库脚本：读取 knowledge/*.md → 解析 frontmatter → 分块 → 生成 embedding
 * → 写入 Supabase（documents + document_chunks，pgvector）。
 *
 * 运行：npm run ingest   （需 .env.local 配好 SUPABASE_* 与 EMBEDDING_*）
 * 幂等：每次先清空 documents（级联删除 chunks）再重新灌入。
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { chunkText } from "../lib/rag/chunk";
import { embedTexts } from "../lib/rag/embed";

interface Parsed {
  title: string;
  source: string;
  docType: string;
  body: string;
}

function parseFrontmatter(md: string): Parsed {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  let body = md;
  if (m) {
    for (const line of m[1].split("\n")) {
      const i = line.indexOf(":");
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
    body = m[2];
  }
  return {
    title: meta.title ?? "untitled",
    source: meta.source ?? "",
    docType: meta.doc_type ?? "",
    body: body.trim(),
  };
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("缺少 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");

  const sb = createClient(url, key, { auth: { persistSession: false } });
  const dir = path.join(process.cwd(), "knowledge");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  console.log(`发现 ${files.length} 份文档，开始灌库…`);

  // 幂等：清空旧数据（documents 级联删除 chunks）
  await sb
    .from("documents")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  let totalChunks = 0;
  let totalTokens = 0;

  for (const f of files) {
    const md = fs.readFileSync(path.join(dir, f), "utf-8");
    const { title, source, docType, body } = parseFrontmatter(md);

    const { data: doc, error: dErr } = await sb
      .from("documents")
      .insert({ title, source, doc_type: docType, metadata: { file: f } })
      .select("id")
      .single();
    if (dErr || !doc) throw new Error(`插入 document 失败(${f}): ${dErr?.message}`);

    const chunks = chunkText(body);
    const { vectors, tokens, model } = await embedTexts(
      chunks.map((c) => c.content),
    );
    totalTokens += tokens;

    const rows = chunks.map((c, i) => ({
      document_id: doc.id,
      chunk_index: c.index,
      content: c.content,
      token_count: Math.round(c.content.length / 2),
      embedding: `[${vectors[i].join(",")}]`,
      metadata: { doc_type: docType, title },
    }));
    const { error: cErr } = await sb.from("document_chunks").insert(rows);
    if (cErr) throw new Error(`插入 chunks 失败(${f}): ${cErr.message}`);

    totalChunks += chunks.length;
    console.log(`  ✓ ${f}  (${chunks.length} chunks, model=${model})`);
  }

  console.log(
    `\n完成：${files.length} 文档 / ${totalChunks} chunks / ~${totalTokens} embedding tokens`,
  );
}

main().catch((e) => {
  console.error("灌库失败：", e);
  process.exit(1);
});
