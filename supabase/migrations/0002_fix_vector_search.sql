-- =============================================================
-- 修复向量检索：ivfflat → HNSW
-- 原因：ivfflat(lists=100) 在小语料(十几条)上 probes=1 只搜到极少候选，
--       导致 top-k 返回不全。HNSW 在小数据上即可返回正确 top-k，且可扩展。
-- 在 Supabase → SQL Editor 运行一次。
-- =============================================================

drop index if exists document_chunks_embedding_idx;

create index if not exists document_chunks_embedding_hnsw
  on document_chunks using hnsw (embedding vector_cosine_ops);
