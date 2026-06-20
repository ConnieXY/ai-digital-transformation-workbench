# 企业 AI 数智化转型工作台 · AI Transformation Workbench

> 端到端 AI 落地系统：把企业模糊的 AI 转型诉求，转化为**可信、可观测、可演示**的诊断、方案与业务闭环。

🔗 **在线体验**：<https://aiworkbench.wowonderwhy.com>

以「**Diagnose → Design → Deliver**」为方法主线，串起三个模块，并以**制造业质量异常闭环**作为完整样板。落地场景源自作者服务汽车电子/半导体等制造业客户的真实痛点。

---

## 一分钟看懂（直接体验真实 AI 产物）

公网入口"**查看真实 AI 示例**"展示的是真实 LLM+RAG 跑出的固化产物（零 key、零成本）：

| 模块 | 直达 |
|---|---|
| 诊断报告（结构化 AI 洞察） | [/diagnosis/report?id=28c7c17e…](https://aiworkbench.wowonderwhy.com/diagnosis/report?id=28c7c17e-7549-49e8-960c-16c3eeb0b84b) |
| 行业方案（grounded + 引用来源） | [/solution-builder/result?id=ddbec716…](https://aiworkbench.wowonderwhy.com/solution-builder/result?id=ddbec716-99d6-4e9a-84c1-069546310989) |
| 制造业闭环（根因→任务→复盘 + HITL） | [/manufacturing-demo/analysis?id=c7a1e47d…](https://aiworkbench.wowonderwhy.com/manufacturing-demo/analysis?id=c7a1e47d-9b8f-4c18-b8f4-6a684132da4c) |
| Trace Viewer（成本/延迟/调用追踪） | [/traces](https://aiworkbench.wowonderwhy.com/traces) |

## 核心能力

- **结构化诊断**：6D 成熟度问卷 → LLM 结构化洞察（Zod 校验）。
- **Grounded 方案**：RAG 检索知识库 → 方案/根因**强制引用来源**；无依据则诚实弃权。
- **业务闭环**：制造业质量异常 上报→根因→任务→看板(human-in-the-loop)→复盘，状态机 + 事件审计。
- **可观测**：每次 LLM/embedding 调用写 `llm_traces`，`/traces` 看成本/延迟(p50·p95)/结构化输出/RAG 引用/错误。
- **可评测**：`npm run eval` 跑黄金集（schema/引用/**忠实度 LLM-as-judge**/召回），可作 CI 门禁。
- **工程取舍**：provider 抽象（不写死厂商）、优雅降级、密钥仅服务端、公网真实快照。

## 关键结果

| 指标 | 数值 |
|---|---|
| 引用忠实度（eval 驱动） | **0/3 → 3/3** |
| 检索 recall@k | 2/2（案例库命中第一，cos 0.82） |
| 单次调用成本 / 延迟 | ≈ $0.005 / p50 ≈ 7s |
| 评测 scorecard | schema 100% · 引用有效 100% · 忠实度 3/3 · 召回 2/2 |

## 技术栈

Next.js 14（App Router）· React 18 · TypeScript · Tailwind · Supabase（Postgres + **pgvector**）· OpenAI 兼容 LLM（默认 DeepSeek，可切 Qwen/OpenAI）· 百炼 `text-embedding-v4` · Zod · Vercel。

## 文档

| 文档 | 内容 |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 架构总览 + 数据流图（Mermaid） |
| [docs/ADR.md](docs/ADR.md) | 架构决策记录（为什么这么做 + 取舍 + 已知边界） |
| [docs/CASE_STUDY.md](docs/CASE_STUDY.md) | 案例研究（问题→方法→结果→学习） |
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | 2–3 分钟演示脚本 |
| [docs/RESUME_BULLETS.md](docs/RESUME_BULLETS.md) | 要点 |

## 本地运行

```bash
npm install
cp .env.example .env.local     # 填 Supabase 与 LLM/Embedding key（见 .env.example 注释）
# 在 Supabase SQL Editor 运行 supabase/migrations/0001_init.sql 与 0002_fix_vector_search.sql
npm run ingest                 # 知识库灌库（chunk → embedding → pgvector）
npm run dev                    # http://localhost:3000
npm run eval                   # 离线评测（需 dev server 在跑）
```

> 未配 key 时自动降级为规则路径，公网即此模式 + 真实 AI 快照（不触发付费调用）。

## 状态与边界（诚实声明）

**演示 / 预览版**。已知取舍与路线图见 [ADR-0008](docs/ADR.md#adr-0008--已知缺口与路线图诚实边界)：暂无鉴权（匿名 session）、公网为只读真实快照、trace 为平表、尚无自动化测试。下一步：Auth + RLS、统一 AITask 抽象、trace 升级 span 树、测试进 CI。

## 作者

By **Connie Wang** —— 客户成功 / 商业化 / To B 产品。本项目由本人用 [Claude Code](https://claude.com/claude-code) 从 0 到 1 设计与实现。
