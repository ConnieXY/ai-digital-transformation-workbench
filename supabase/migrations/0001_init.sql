-- =============================================================
-- AI Transformation Workbench — 初始 schema (P0)
-- 在 Supabase → SQL Editor 粘贴运行一次即可。
--
-- 设计要点：
--  * 所有写入走服务端 service_role（绕过 RLS）；客户端不直连 DB。
--  * 各业务表启用 RLS 且不开放任何 anon 策略 = 对 anon 默认拒绝，
--    service_role 仍可读写。（Auth + 细粒度 RLS 列为后续 roadmap）
--  * 匿名归属：用 session_id（浏览器生成的不透明 id）读回自己的数据。
-- =============================================================

create extension if not exists vector;      -- pgvector
create extension if not exists pgcrypto;     -- gen_random_uuid()

-- ---------- 业务实体 ----------

create table if not exists companies (
  id              uuid primary key default gen_random_uuid(),
  session_id      text not null,
  name            text,
  industry        text,
  company_size    text,
  employee_count  text,
  current_systems text,
  main_pain_point text,
  created_at      timestamptz not null default now()
);

create table if not exists assessments (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid references companies(id) on delete cascade,
  session_id          text not null,
  answers             jsonb not null,
  scores              jsonb not null,          -- 各维度得分
  overall_score       numeric,
  maturity_level      text,
  weakest_dimensions  jsonb,
  llm_insight         jsonb,                   -- LLM 结构化洞察（无则 null）
  source              text not null default 'rule',  -- 'llm' | 'rule'
  created_at          timestamptz not null default now()
);

create table if not exists solutions (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid references companies(id) on delete set null,
  session_id  text not null,
  input       jsonb not null,
  result      jsonb not null,
  citations   jsonb,
  source      text not null default 'rule',
  created_at  timestamptz not null default now()
);

create table if not exists incidents (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid references companies(id) on delete set null,
  session_id        text not null,
  product_name      text,
  production_line   text,
  process           text,
  batch             text,
  incident_type     text,
  description       text,
  affected_quantity text,
  severity          text,
  discovered_at     text,
  reporter          text,
  status            text not null default 'reported',
  created_at        timestamptz not null default now()
);

create table if not exists incident_analyses (
  id          uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  analysis    jsonb not null,
  citations   jsonb,
  source      text not null default 'rule',
  created_at  timestamptz not null default now()
);

create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  title       text not null,
  department  text,
  priority    text,
  due         text,
  status      text not null default '待确认',
  description text,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists review_reports (
  id          uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  report      jsonb not null,
  citations   jsonb,
  source      text not null default 'rule',
  created_at  timestamptz not null default now()
);

-- 闭环状态流转 + human-in-the-loop 审计
create table if not exists workflow_events (
  id          uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  from_state  text,
  to_state    text not null,
  actor       text not null default 'ai',     -- 'ai' | 'human'
  note        text,
  created_at  timestamptz not null default now()
);

-- ---------- 知识库 / RAG ----------

create table if not exists documents (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  source     text,
  doc_type   text,                 -- qm / sop / incident-case / playbook
  metadata   jsonb,
  created_at timestamptz not null default now()
);

create table if not exists document_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index int not null,
  content     text not null,
  token_count int,
  embedding   vector(1536),        -- 需配 1536 维 embedding 模型
  metadata    jsonb
);

create index if not exists document_chunks_embedding_idx
  on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 余弦检索 RPC（P0-3 使用）
create or replace function match_document_chunks(
  query_embedding vector(1536),
  match_count int default 5,
  doc_type_filter text default null
)
returns table (
  id uuid, document_id uuid, content text, similarity float, metadata jsonb
)
language sql stable as $$
  select c.id, c.document_id, c.content,
         1 - (c.embedding <=> query_embedding) as similarity,
         c.metadata
  from document_chunks c
  where c.embedding is not null
    and (doc_type_filter is null
         or exists (select 1 from documents d
                    where d.id = c.document_id and d.doc_type = doc_type_filter))
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- ---------- LLM 可观测性（Trace Viewer 数据源） ----------

create table if not exists llm_traces (
  id            uuid primary key default gen_random_uuid(),
  session_id    text,
  entity_type   text,                 -- 'assessment' | 'solution' | 'incident' ...
  entity_id     uuid,
  step          text,                 -- 'diagnosis.insight' | 'solution.generate' ...
  provider      text,
  model         text,
  operation     text not null default 'chat',  -- 'chat' | 'embed'
  request       jsonb,
  response      jsonb,
  input_tokens  int,
  output_tokens int,
  cost_usd      numeric,
  latency_ms    int,
  status        text not null default 'ok',     -- 'ok' | 'error'
  error         text,
  citations     jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists llm_traces_created_idx on llm_traces (created_at desc);
create index if not exists llm_traces_entity_idx  on llm_traces (entity_type, entity_id);

-- ---------- RLS：默认锁死（service_role 绕过） ----------
do $$
declare t text;
begin
  foreach t in array array[
    'companies','assessments','solutions','incidents','incident_analyses',
    'tasks','review_reports','workflow_events','documents','document_chunks','llm_traces'
  ] loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;
