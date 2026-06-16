"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import RoadmapPhaseCard, {
  type RoadmapPhase,
} from "@/components/diagnosis/RoadmapPhaseCard";
import {
  type DiagnosisSubmission,
  DIAGNOSIS_STORAGE_KEY,
  SOLUTION_CONTEXT_KEY,
} from "@/data/diagnosis";
import { scoreDiagnosis } from "@/lib/scoring";

/** 30/60/90 天三阶段落地路线图（结构稳定，与诊断结论配合使用）。 */
const phases: RoadmapPhase[] = [
  {
    day: "30",
    title: "现状梳理与试点选择",
    subtitle: "摸清家底、对齐目标，锁定高价值试点场景。",
    accent: "brand",
    tasks: [
      "梳理核心业务流程与数据现状",
      "对齐管理层转型目标与优先级",
      "围绕核心短板选定 1-2 个试点场景",
    ],
    roles: ["管理层", "业务负责人", "IT / 数据负责人"],
    deliverables: ["现状盘点报告", "试点场景清单", "试点目标与范围说明"],
    metrics: ["现状梳理覆盖率", "试点场景确认数量"],
  },
  {
    day: "60",
    title: "MVP 试点上线",
    subtitle: "小步快跑，让试点场景在真实业务中跑起来。",
    accent: "violet",
    tasks: [
      "搭建试点场景 MVP 并导入真实数据",
      "小范围试运行并收集一线反馈",
      "快速迭代修复关键问题",
    ],
    roles: ["业务一线", "IT / 实施团队", "产品 / 方案负责人"],
    deliverables: ["可用的 MVP", "试运行操作手册", "首轮反馈与问题清单"],
    metrics: ["MVP 上线率", "试点用户活跃度", "关键流程提效幅度"],
  },
  {
    day: "90",
    title: "复盘优化与扩展推广",
    subtitle: "沉淀经验、量化价值，制定规模化推广路径。",
    accent: "emerald",
    tasks: [
      "复盘试点效果并量化业务价值",
      "优化流程、配置与使用规范",
      "制定向更多部门扩展的推广计划",
    ],
    roles: ["管理层", "业务负责人", "IT / 数据团队"],
    deliverables: ["试点复盘报告", "优化方案", "规模化推广路线图"],
    metrics: ["试点 ROI", "推广覆盖部门数", "目标维度得分提升"],
  },
];

export default function RoadmapPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [submission, setSubmission] = useState<DiagnosisSubmission | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(DIAGNOSIS_STORAGE_KEY);
      if (raw) setSubmission(JSON.parse(raw) as DiagnosisSubmission);
    } catch {
      setSubmission(null);
    }
  }, []);

  if (!mounted) {
    return (
      <PageShell>
        <div className="container-page py-24" />
      </PageShell>
    );
  }

  if (!submission) {
    return (
      <PageShell>
        <section className="container-page py-24">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-xl">
              🗺️
            </span>
            <h1 className="mt-5 text-xl font-semibold text-ink-900">
              暂无诊断数据
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              落地路线图需基于诊断结果生成。请先完成数智化成熟度问卷。
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

  function handleGenerateSolution() {
    const context = { companyInfo, result, submittedAt };
    localStorage.setItem(SOLUTION_CONTEXT_KEY, JSON.stringify(context));
    router.push("/solution-builder");
  }

  return (
    <PageShell>
      {/* 抬头 */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-12 sm:py-16">
          <Link
            href="/diagnosis/report"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <span aria-hidden>←</span> 返回诊断报告
          </Link>

          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-brand-500">
            {companyInfo.companyName || "未命名企业"} · 落地建议
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            30/60/90 天数智化落地路线图
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-700">
            将诊断结论转化为分阶段、可执行的落地节奏，从试点验证逐步走向规模化推广。
          </p>
        </div>
      </section>

      <div className="container-page space-y-10 py-12 sm:py-16">
        {/* 当前成熟度与核心短板 */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <p className="text-xs font-medium text-ink-500">当前成熟度等级</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white">
                {result.maturity.level}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  {result.maturity.name}
                </p>
                <p className="text-xs text-ink-500">
                  综合得分 {result.overallScore.toFixed(1)} / 5.0
                </p>
              </div>
            </div>
          </div>

          {result.weakestDimensions.map((score, i) => (
            <div
              key={score.dimension.id}
              className="rounded-2xl border border-rose-100 bg-rose-50/50 p-6"
            >
              <p className="text-xs font-medium text-rose-600">
                核心短板 {i + 1}
              </p>
              <p className="mt-3 text-base font-semibold text-ink-900">
                {score.dimension.title}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                得分 {score.average.toFixed(1)} / 5.0 ·
                建议优先在试点阶段切入
              </p>
            </div>
          ))}
        </div>

        {/* 三阶段路线图 */}
        <div className="grid gap-6 lg:grid-cols-3">
          {phases.map((phase) => (
            <RoadmapPhaseCard key={phase.day} phase={phase} />
          ))}
        </div>

        {/* 底部按钮 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/diagnosis/report"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
          >
            返回诊断报告
          </Link>
          <button
            type="button"
            onClick={handleGenerateSolution}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            生成行业解决方案
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </PageShell>
  );
}
