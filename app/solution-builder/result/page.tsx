"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import {
  type SolutionInput,
  SOLUTION_INPUT_KEY,
} from "@/data/solution";
import { generateSolution } from "@/lib/solutionGenerator";

export default function SolutionResultPage() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState<SolutionInput | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(SOLUTION_INPUT_KEY);
      if (raw) setInput(JSON.parse(raw) as SolutionInput);
    } catch {
      setInput(null);
    }
  }, []);

  if (!mounted) {
    return (
      <PageShell>
        <div className="container-page py-24" />
      </PageShell>
    );
  }

  if (!input) {
    return (
      <PageShell>
        <section className="container-page py-24">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-xl">
              🧩
            </span>
            <h1 className="mt-5 text-xl font-semibold text-ink-900">
              暂无方案输入
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              尚未检测到行业与客户信息。请先填写输入表单，再生成解决方案。
            </p>
            <Link
              href="/solution-builder/input"
              className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              返回填写输入
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </PageShell>
    );
  }

  const result = generateSolution(input);

  const profileItems = [
    { label: "目标行业", value: input.industry || "—" },
    { label: "企业规模", value: input.companySize || "—" },
    { label: "沟通对象", value: input.targetRole || "—" },
    {
      label: "业务目标",
      value: input.businessGoals.length ? input.businessGoals.join("、") : "—",
    },
    {
      label: "关注痛点",
      value: input.painPoints.length ? input.painPoints.join("、") : "—",
    },
    { label: "当前系统", value: input.currentSystems || "—" },
  ];

  return (
    <PageShell>
      {/* 抬头 */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-12 sm:py-16">
          <Link
            href="/solution-builder/input"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <span aria-hidden>←</span> 返回修改输入
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-brand-500">
            {input.industry} · 行业解决方案
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            {input.industry}数智化解决方案
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-700">
            基于所选行业、客户画像与业务痛点，生成痛点地图、解决方案组合与角色化价值主张。
          </p>
        </div>
      </section>

      <div className="container-page space-y-12 py-12 sm:py-16">
        {/* 01 客户画像摘要 */}
        <SolutionSection index="01" title="客户画像摘要">
          <div className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {profileItems.map((item) => (
              <div key={item.label} className="bg-white p-5">
                <p className="text-xs font-medium text-ink-500">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-ink-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          {input.additionalContext && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-medium text-ink-500">补充说明</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
                {input.additionalContext}
              </p>
            </div>
          )}
        </SolutionSection>

        {/* 02 行业痛点地图 */}
        <SolutionSection
          index="02"
          title="行业痛点地图"
          subtitle="按业务环节梳理常见痛点与对应的数智化机会，高亮为你所选痛点。"
        >
          <TableCard>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-ink-500">
                  <th className="px-5 py-3.5 font-medium">业务环节</th>
                  <th className="px-5 py-3.5 font-medium">常见痛点</th>
                  <th className="px-5 py-3.5 font-medium">数智化机会</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.painMap.map((row) => (
                  <tr
                    key={row.stage}
                    className={row.highlighted ? "bg-brand-50/60" : ""}
                  >
                    <td className="px-5 py-4 font-medium text-ink-900">
                      <span className="flex items-center gap-2">
                        {row.stage}
                        {row.highlighted && (
                          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                            关注
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-ink-700">{row.pains}</td>
                    <td className="px-5 py-4 text-ink-700">{row.opportunity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </SolutionSection>

        {/* 03 解决方案组合 */}
        <SolutionSection
          index="03"
          title="解决方案组合"
          subtitle="针对核心痛点匹配可落地的场景、工具组合与预期价值。"
        >
          <TableCard>
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-ink-500">
                  <th className="px-5 py-3.5 font-medium">推荐场景</th>
                  <th className="px-5 py-3.5 font-medium">解决方案</th>
                  <th className="px-5 py-3.5 font-medium">可用工具组合</th>
                  <th className="px-5 py-3.5 font-medium">预期价值</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.solutions.map((row) => (
                  <tr
                    key={row.scenario}
                    className={row.highlighted ? "bg-brand-50/60" : ""}
                  >
                    <td className="px-5 py-4 font-medium text-ink-900">
                      {row.scenario}
                    </td>
                    <td className="px-5 py-4 text-ink-700">{row.solution}</td>
                    <td className="px-5 py-4 text-ink-700">{row.tools}</td>
                    <td className="px-5 py-4 text-ink-700">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </SolutionSection>

        {/* 04 角色化价值主张 */}
        <SolutionSection
          index="04"
          title="角色化价值主张"
          subtitle="面向不同决策角色，提炼差异化的价值主张（高亮为你的目标沟通对象）。"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {result.roleValues.map((role) => (
              <div
                key={role.title}
                className={`rounded-2xl border p-6 ${
                  role.emphasized
                    ? "border-brand-300 bg-brand-50/60 shadow-card"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-base font-semibold text-ink-900">
                    {role.title}
                  </h4>
                  {role.emphasized && (
                    <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[10px] font-semibold text-white">
                      目标对象
                    </span>
                  )}
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-700">
                  {role.value}
                </p>
              </div>
            ))}
          </div>
        </SolutionSection>

        {/* 05 推荐优先落地场景 */}
        <SolutionSection
          index="05"
          title="推荐优先落地场景"
          subtitle="建议作为首个试点，快速验证价值、形成示范。"
        >
          <div className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-card">
            <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-5 text-white sm:px-8">
              <p className="text-xs font-medium uppercase tracking-wider text-brand-100">
                首选试点场景
              </p>
              <h3 className="mt-1 text-xl font-bold">
                {result.priorityScenario.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-50">
                {result.priorityScenario.summary}
              </p>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                为什么优先选它
              </p>
              <ul className="mt-3 space-y-2">
                {result.priorityScenario.reasons.map((reason) => (
                  <li
                    key={reason}
                    className="flex gap-2.5 text-sm leading-relaxed text-ink-700"
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-brand-500"
                    />
                    {reason}
                  </li>
                ))}
              </ul>
              <Link
                href="/manufacturing-demo"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
              >
                查看该场景 Demo
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </SolutionSection>

        {/* 底部按钮 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/solution-builder/one-pager"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            生成一页纸方案
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/manufacturing-demo"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
          >
            查看制造业场景 Demo
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

/** 表格容器：圆角、边框、横向滚动。 */
function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

/** 方案区块：序号标记 + 标题 + 可选副标题。 */
function SolutionSection({
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
