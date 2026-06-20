# 架构决策记录 · ADR Log

> 记录关键技术决策的**背景 / 决策 / 取舍**。评估中"为什么这么做"比"做了什么"更重要。

格式：每条含 Context（为什么要决策）/ Decision（决策内容）/ Consequences（收益与代价）。

---

## ADR-0001 · 用 Route Handlers 而非 Server Actions 承载 AI 能力

- **Context**：AI 调用需要清晰契约、可测试、可在 Trace Viewer 展示，且需要被脚本/评测复用。
- **Decision**：所有 AI/RAG/数据能力走 Next.js Route Handlers（`/api/*`，Node runtime），客户端只做 typed fetch。
- **Consequences**：✅ 显式 API 契约，eval/ingest 可直接调用；✅ 密钥仅服务端。⚠️ 比 Server Actions 多一点样板；页面多为客户端取数（见 ADR-0008 关于 RSC 的改进）。

## ADR-0002 · LLM Provider 抽象（OpenAI 兼容），不写死厂商

- **Context**：要求"优先 OpenAI，但不写死"，且开发期没有 OpenAI 额度。
- **Decision**：`lib/llm/provider.ts` 用 OpenAI SDK + 可配 `baseURL`，通过环境变量切换 DeepSeek / 通义千问 / OpenAI；默认 DeepSeek。embedding 同理（百炼 `text-embedding-v4`）。
- **Consequences**：✅ 换模型零代码改动，成本极低（DeepSeek ≈ ¥0.005/次）；✅ 证明"provider 不写死"。⚠️ 仅覆盖 OpenAI 兼容协议；接 Anthropic 原生 Messages API 仍需适配层（诚实标注）。

## ADR-0003 · 结构化输出：JSON 模式 + Zod 校验 + 有界重试（而非 strict json_schema）

- **Context**：所有 LLM 输出必须结构化、可校验；但需跨厂商可移植，部分国产模型不支持 OpenAI 的 `strict json_schema`。
- **Decision**：`runStructured()` 用 `response_format: json_object` + 把 Zod schema 转 JSON Schema 注入提示 + Zod 校验 + 失败 1 次 repair 重试；并对瞬时抖动做指数退避。
- **Consequences**：✅ 跨厂商稳定，校验失败可自修复；✅ 类型安全（Zod 即真值来源）。⚠️ 不如原生 strict 严格——靠校验+重试兜底（eval 中 schema 合法率 100% 验证了有效性）。

## ADR-0004 · RAG Grounding：相关性门控 + 弃权 + 引用忠实度

- **Context**：首版 eval 发现"有引用 ≠ 有依据"——忠实度仅 ~50%，弱语料（零售）下模型会拿无关片段硬凑引用。
- **Decision**：① 检索后做**相关性门控**（余弦 < `RAG_MIN_SIMILARITY=0.48` 的片段不喂给 LLM）；② 提示要求"有依据才标引用、无依据则 citations 留空并诚实说明"；③ 给评测裁判更完整证据。
- **Consequences**：✅ 忠实度 **0/3 → 3/3**；零售场景从"假装有据"变为"诚实弃权"；✅ grounding 覆盖率单独考核，防止靠"全弃权"刷分。⚠️ 门控阈值需随语料调参。

## ADR-0005 · 可观测 + 可评测：llm_traces + 离线 Eval + 跨模型 LLM-as-judge

- **Context**：production-minded 的 AI 必须能被观测与评测；"看起来对"不可信。
- **Decision**：① 每次 LLM/embedding 调用写 `llm_traces`（模型/tokens/成本/延迟/状态/引用），`/traces` 可视化（p50/p95、错误率、成本）；② `npm run eval` 跑黄金集，评测 schema/引用有效性/**忠实度(LLM-as-judge)**/检索召回，输出 scorecard 并以非零退出做 CI 门禁；③ 裁判用**不同于生成器的模型**（`JUDGE_*`，默认 Qwen），避免"同模型自评"偏差。
- **Consequences**：✅ 质量可量化、可回归；✅ 跨模型裁判降低自评偏差。⚠️ LLM-as-judge 仍是近似信号（已在文档/代码注释中标注）；trace 目前是平表而非 span 树（见 ADR-0008）。

## ADR-0006 · 匿名 session + 优雅降级 + 公网用真实快照展示

- **Context**：作为演示项目，公网要展示**真实** AI 能力；但开放的付费 LLM 端点有刷量/注入/成本风险。
- **Decision**：① 无登录，用浏览器生成的匿名 `session_id` 归属数据；② 未配 LLM/DB key 时回落规则路径；③ **公网不配 LLM key**，改用固化的真实 AI 产物快照（`data/featured/*`）——GET 路由 featured-first，命中固化 id 直接返回，**零成本、确定性、防滥用**地展示真实 grounded 产物 + Trace Viewer。
- **Consequences**：✅ 公网零配置即可交互式浏览真实产物；✅ 成本/滥用风险为零。⚠️ 公网示例是只读快照而非实时生成（实时路径留本地/带 key 环境）；匿名 session 无真正鉴权（IDOR，见 ADR-0008）。

## ADR-0007 · Supabase + pgvector；HNSW 而非 ivfflat

- **Context**：需要关系数据 + 向量检索；小语料（十余文档）。
- **Decision**：Supabase Postgres + pgvector，检索走 `match_document_chunks` RPC。初版 ivfflat(lists=100) 在小数据上 `probes=1` 只召回极少候选 → 改 **HNSW**。
- **Consequences**：✅ 检索 recall@k 满分，案例库命中位次第一（cos 0.82）；✅ 一套库同时承载业务数据 + 向量。⚠️ service_role 在服务端使用，RLS 已开但未配面向用户的策略（见 ADR-0008）。

## ADR-0008 · 已知缺口与路线图（诚实边界）

当前为**演示/预览版**，以下为刻意的 v1 取舍及改进方向（能清晰说出边界本身是工程成熟度）：

| 缺口 | 现状 | 改进方向 |
|---|---|---|
| 鉴权/数据隔离 | 匿名 session，GET 按 id 可读（IDOR） | Supabase Auth + 基于 `auth.uid()` 的 RLS |
| Trace 形态 | 平表，retrieve 与 generate 无父子关联 | span 树 + correlation id（OTel 风格） |
| 测试 | 仅 tsc + eval | 单测（评分纯函数）+ API 集成测试 + eval 进 CI |
| 公网实时性 | 真实产物为固化快照 | 带限流/鉴权的"在线真跑"环境 |
| 流式 | 同步等待 5–9s | 流式输出 / 后台任务 |

> ~~模块抽象重复~~ 已在 [ADR-0009](#adr-0009--统一-aitask-抽象合并规则llm-双路径) 完成。

## ADR-0009 · 统一 AITask 抽象（合并规则/LLM 双路径）

- **Context**：诊断/方案/根因/复盘四处生成器各自重复"检索→组装提示→结构化生成→过滤引用→trace"，且"用 LLM 还是规则降级"的分支散落在各路由（有的甚至无 LLM 直接 503），形成两套真值/控制流。
- **Decision**：抽象 `runAITask(task, input, ctx)` 运行器（`lib/ai/task.ts`）：把"RAG 检索 → 提示组装 → 结构化生成 → 后处理 → 确定性降级 → 统一 source/trace"收敛为一条管线；四个模块退化为声明式任务配置（`lib/ai/tasks/*`，各含同 schema 的规则降级）。路由只调 `runAITask`。
- **Consequences**：✅ 消除重复，新增 AI 任务只写配置；✅ 降级逻辑集中一处，无 LLM 时优雅回落（不再 503）；✅ 重构后 **eval 6/6 用例 19/19 检查全绿 → 行为保持零回归**。⚠️ 客户端结果页的"规则视图 vs grounded 视图"渲染合一仍可进一步收敛（现已具备同 schema 基础）。
