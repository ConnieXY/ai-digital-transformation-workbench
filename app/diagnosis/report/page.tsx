"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import ScoreBar from "@/components/diagnosis/ScoreBar";
import {
  type DiagnosisSubmission,
  type DimensionId,
  DIAGNOSIS_STORAGE_KEY,
  SOLUTION_CONTEXT_KEY,
} from "@/data/diagnosis";
import { type DiagnosisResult, scoreDiagnosis } from "@/lib/scoring";
import type { DiagnosisInsight } from "@/lib/schemas/diagnosis";

const MATURITY_SCALE = ["L1", "L2", "L3", "L4", "L5"];

/** 各维度对应的预期价值文案，用于机会地图表格。 */
const valueByDimension: Record<DimensionId, string> = {
  "org-collaboration": "缩短跨部门协作周期，提升事项闭环率",
  "process-efficiency": "降低流程等待与人工干预，提升处理时效",
  "data-management": "统一数据口径，支撑实时经营决策",
  knowledge: "沉淀组织知识，降低对个人经验的依赖",
  "business-operation": "强化客户与经营洞察，发现增长机会",
  "ai-maturity": "以 AI 提效核心环节，释放人力产能",
};

interface OpportunityRow {
  scenario: string;
  dimensionTitle: string;
  priority: "高" | "中";
  value: string;
}

/** 由诊断结果推导机会地图表格行：最弱维度→高优先级，次弱→中优先级。 */
function buildOpportunityRows(result: DiagnosisResult): OpportunityRow[] {
  return result.recommendations.flatMap((rec, recIndex) =>
    rec.scenarios.map((scenario) => ({
      scenario,
      dimensionTitle: rec.dimensionTitle,
      priority: recIndex === 0 ? "高" : "中",
      value: valueByDimension[rec.dimensionId],
    })),
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function ReportPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submission, setSubmission] = useState<DiagnosisSubmission | null>(null);
  const [insight, setInsight] = useState<DiagnosisInsight | null>(null);
  const [source, setSource] = useState<"llm" | "rule" | null>(null);

  useEffect(() => {
    setMounted(true);

    const loadLocal = () => {
      try {
        const raw = localStorage.getItem(DIAGNOSIS_STORAGE_KEY);
        if (raw) setSubmission(JSON.parse(raw) as DiagnosisSubmission);
      } catch {
        setSubmission(null);
      }
    };

    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      loadLocal();
      return;
    }

    // 优先从后端按 id 读取（真实持久化）
    setLoading(true);
    fetch(`/api/diagnosis/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
      .then((d) => {
        setSubmission({
          companyInfo: d.companyInfo,
          answers: d.answers,
          submittedAt: d.submittedAt,
        });
        setInsight((d.insight as DiagnosisInsight) ?? null);
        setSource((d.source as "llm" | "rule") ?? null);
      })
      .catch(loadLocal)
      .finally(() => setLoading(false));
  }, []);

  // 首屏（localStorage 读取前）不渲染内容，避免水合不一致
  if (!mounted) {
    return (
      <PageShell>
        <div className="container-page py-24" />
      </PageShell>
    );
  }

  // 从后端按 id 拉取中
  if (loading) {
    return (
      <PageShell>
        <section className="container-page py-24 text-center">
          <p className="text-sm text-ink-500">正在生成诊断报告…</p>
        </section>
      </PageShell>
    );
  }

  // 无数据：提示返回重新诊断
  if (!submission) {
    return (
      <PageShell>
        <section className="container-page py-24">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-xl">
              📋
            </span>
            <h1 className="mt-5 text-xl font-semibold text-ink-900">
              暂无诊断数据
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              尚未检测到问卷结果。请先完成数智化成熟度问卷，再查看诊断报告。
            </p>
            <Link
              href="/diagnosis/questionnaire"
              className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              返回填写问卷
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </PageShell>
    );
  }

  const { companyInfo, answers, submittedAt } = submission;
  const result = scoreDiagnosis(answers);
  const opportunityRows = buildOpportunityRows(result);
  const currentLevelIndex = MATURITY_SCALE.indexOf(result.maturity.level);

  function handleGenerateSolution() {
    // 将诊断上下文传递给「行业解决方案生成」模块
    const context = { companyInfo, result, submittedAt };
    localStorage.setItem(SOLUTION_CONTEXT_KEY, JSON.stringify(context));
    router.push("/solution-builder");
  }

  const infoItems = [
    { label: "企业名称", value: companyInfo.companyName || "—" },
    { label: "所属行业", value: companyInfo.industry || "—" },
    { label: "企业规模", value: companyInfo.companySize || "—" },
    { label: "员工人数", value: companyInfo.employeeCount || "—" },
    { label: "主要系统", value: companyInfo.currentSystems || "—" },
    { label: "评估范围", value: "6D · 24 题" },
  ];

  return (
    <PageShell>
      {/* 报告抬头 */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-12 sm:py-16">
          <Link
            href="/diagnosis"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <span aria-hidden>←</span> 返回诊断说明
          </Link>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                企业数智化成熟度诊断报告
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                {companyInfo.companyName || "未命名企业"}
              </h1>
            </div>
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              <p className="text-sm text-ink-500">
                报告生成日期：{formatDate(submittedAt)}
              </p>
              {source && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    source === "llm"
                      ? "bg-brand-50 text-brand-700"
                      : "bg-slate-100 text-ink-500"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      source === "llm" ? "bg-brand-500" : "bg-slate-400"
                    }`}
                  />
                  {source === "llm" ? "AI 生成洞察" : "规则引擎（未接 LLM）"}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container-page space-y-12 py-12 sm:py-16">
        {/* 01 企业信息摘要 */}
        <ReportSection index="01" title="企业信息摘要">
          <div className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {infoItems.map((item) => (
              <div key={item.label} className="bg-white p-5">
                <p className="text-xs font-medium text-ink-500">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-ink-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          {companyInfo.mainPainPoint && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-medium text-ink-500">
                当前最想解决的问题
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
                {companyInfo.mainPainPoint}
              </p>
            </div>
          )}
        </ReportSection>

        {/* AI 洞察（仅在接入 LLM 时出现） */}
        {insight && (
          <section className="rounded-2xl border border-brand-200 bg-brand-50/40 p-6 shadow-card sm:p-8">
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                AI
              </span>
              <h2 className="text-lg font-bold tracking-tight text-ink-900">
                AI 诊断洞察
              </h2>
            </div>
            <p className="mt-4 text-base font-semibold text-ink-900">
              {insight.headline}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">
              {insight.summary}
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  关键风险
                </p>
                <ul className="mt-2 space-y-2">
                  {insight.keyRisks.map((r) => (
                    <li key={r.risk} className="text-sm leading-relaxed text-ink-700">
                      <span className="font-medium text-ink-900">
                        {r.dimension}：
                      </span>
                      {r.risk}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  快赢动作
                </p>
                <ul className="mt-2 space-y-1.5">
                  {insight.quickWins.map((w) => (
                    <li key={w} className="flex gap-2 text-sm leading-relaxed text-ink-700">
                      <span aria-hidden className="mt-1.5 h-1 w-1 flex-none rounded-full bg-brand-500" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  汇报论点
                </p>
                <ul className="mt-2 space-y-1.5">
                  {insight.execTalkingPoints.map((t) => (
                    <li key={t} className="flex gap-2 text-sm leading-relaxed text-ink-700">
                      <span aria-hidden className="mt-1.5 h-1 w-1 flex-none rounded-full bg-brand-500" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* 02 总体成熟度等级 */}
        <ReportSection index="02" title="总体成熟度等级">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="flex flex-none items-center gap-5">
                <div className="grid h-24 w-24 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                  <span className="text-3xl font-bold leading-none">
                    {result.maturity.level}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-ink-500">综合得分</p>
                  <p className="text-4xl font-bold tracking-tight text-ink-900">
                    {result.overallScore.toFixed(1)}
                    <span className="text-lg font-normal text-ink-300">
                      {" "}
                      / 5.0
                    </span>
                  </p>
                </div>
              </div>
              <div className="min-w-0 border-slate-100 sm:border-l sm:pl-8">
                <h3 className="text-xl font-semibold text-ink-900">
                  {result.maturity.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">
                  {result.maturity.description}
                </p>
              </div>
            </div>

            {/* 等级刻度 */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-5 sm:px-8">
              <div className="flex gap-2">
                {MATURITY_SCALE.map((level, i) => {
                  const active = i <= currentLevelIndex;
                  const isCurrent = i === currentLevelIndex;
                  return (
                    <div key={level} className="flex-1">
                      <div
                        className={`h-1.5 rounded-full ${
                          active ? "bg-brand-500" : "bg-slate-200"
                        }`}
                      />
                      <p
                        className={`mt-2 text-center text-xs ${
                          isCurrent
                            ? "font-semibold text-brand-600"
                            : "text-ink-300"
                        }`}
                      >
                        {level}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ReportSection>

        {/* 03 6D 维度得分 */}
        <ReportSection
          index="03"
          title="6D 维度得分"
          subtitle="从六个核心维度量化企业当前的数智化成熟度。"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.dimensionScores.map((score) => (
              <ScoreBar key={score.dimension.id} score={score} />
            ))}
          </div>
        </ReportSection>

        {/* 04 核心瓶颈诊断 */}
        <ReportSection
          index="04"
          title="核心瓶颈诊断"
          subtitle="得分最低的两个维度，是当前制约数智化的关键短板。"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {result.weakestDimensions.map((score, i) => (
              <div
                key={score.dimension.id}
                className="rounded-2xl border border-rose-100 bg-rose-50/50 p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
                    短板 {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-rose-600">
                    {score.average.toFixed(1)} / 5.0
                  </span>
                </div>
                <h4 className="mt-4 text-lg font-semibold text-ink-900">
                  {score.dimension.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">
                  {score.dimension.description}
                </p>
              </div>
            ))}
          </div>
        </ReportSection>

        {/* 05 推荐场景机会地图 */}
        <ReportSection
          index="05"
          title="推荐场景机会地图"
          subtitle="针对核心短板，优先落地以下高价值场景。"
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-ink-500">
                    <th className="px-5 py-3.5 font-medium">推荐场景</th>
                    <th className="px-5 py-3.5 font-medium">对应问题</th>
                    <th className="px-5 py-3.5 font-medium">优先级</th>
                    <th className="px-5 py-3.5 font-medium">预期价值</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {opportunityRows.map((row, i) => (
                    <tr key={i} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-4 font-medium text-ink-900">
                        {row.scenario}
                      </td>
                      <td className="px-5 py-4 text-ink-700">
                        {row.dimensionTitle}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            row.priority === "高"
                              ? "bg-rose-100 text-rose-600"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {row.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-ink-700">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ReportSection>

        {/* 行动区 */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h3 className="text-lg font-semibold text-ink-900">下一步</h3>
            <p className="mt-1 text-sm text-ink-500">
              将诊断结论转化为可执行的落地路径与解决方案。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/diagnosis/roadmap"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
            >
              查看 30/60/90 落地路线图
            </Link>
            <button
              type="button"
              onClick={handleGenerateSolution}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              生成行业解决方案
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

/** 报告区块：序号标记 + 标题 + 可选副标题。 */
function ReportSection({
  index,
  title,
  subtitle,
  children,
}: {
  index: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-ink-900 text-xs font-bold text-white">
          {index}
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink-900">
            {title}
          </h2>
          {subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
