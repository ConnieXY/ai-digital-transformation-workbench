"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { type SolutionInput, SOLUTION_INPUT_KEY } from "@/data/solution";
import { generateSolution } from "@/lib/solutionGenerator";

export default function OnePagerPage() {
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
              📄
            </span>
            <h1 className="mt-5 text-xl font-semibold text-ink-900">
              暂无方案输入
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              一页纸方案需基于行业与客户信息生成。请先填写输入表单。
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
  // 优先取命中痛点的方案，不足则按顺序补足，最多展示 4 条
  const highlighted = result.solutions.filter((s) => s.highlighted);
  const topSolutions = (
    highlighted.length ? highlighted : result.solutions
  ).slice(0, 4);
  const keyValue =
    result.roleValues.find((r) => r.emphasized) ?? result.roleValues[0];

  return (
    <PageShell>
      {/* 抬头 */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-10 sm:py-12">
          <Link
            href="/solution-builder/result"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <span aria-hidden>←</span> 返回方案结果
          </Link>
        </div>
      </section>

      <div className="container-page py-10 sm:py-12">
        {/* 一页纸方案：单张纸式卡片 */}
        <article className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          {/* 方案抬头 */}
          <header className="bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-7 text-white">
            <p className="text-xs font-medium uppercase tracking-wider text-brand-100">
              一页纸方案 · One Pager
            </p>
            <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl">
              {input.industry}数智化解决方案
            </h1>
            <p className="mt-2 text-sm text-brand-50">
              面向{input.targetRole || "企业决策者"}
              ，聚焦核心痛点的可落地方案概要。
            </p>
          </header>

          <div className="space-y-7 p-8">
            {/* 客户与目标 */}
            <section className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
              {[
                { label: "目标行业", value: input.industry || "—" },
                { label: "企业规模", value: input.companySize || "—" },
                {
                  label: "业务目标",
                  value: input.businessGoals.length
                    ? input.businessGoals.join("、")
                    : "—",
                },
              ].map((item) => (
                <div key={item.label} className="bg-white p-4">
                  <p className="text-xs font-medium text-ink-500">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </section>

            {/* 核心痛点 → 推荐方案 */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500">
                核心痛点与对策
              </h2>
              <ul className="mt-3 space-y-3">
                {topSolutions.map((sol) => (
                  <li key={sol.scenario} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-brand-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-900">
                        {sol.scenario}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink-700">
                        {sol.solution}（{sol.tools}）
                      </p>
                      <p className="mt-1 inline-flex rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                        预期价值 · {sol.value}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* 价值主张 */}
            <section className="rounded-xl border border-brand-100 bg-brand-50/60 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-600">
                核心价值主张
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">
                {keyValue?.value}
              </p>
            </section>

            {/* 优先落地场景 */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500">
                优先落地场景（建议首个试点）
              </h2>
              <p className="mt-2 text-base font-semibold text-ink-900">
                {result.priorityScenario.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-700">
                {result.priorityScenario.summary}
              </p>
              {result.priorityScenario.reasons.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-ink-500">为什么先做它</p>
                  <ul className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                    {result.priorityScenario.reasons.map((reason) => (
                      <li
                        key={reason}
                        className="flex gap-2 text-xs leading-relaxed text-ink-700"
                      >
                        <span aria-hidden className="text-emerald-500">
                          ✓
                        </span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        </article>

        {/* 底部按钮 */}
        <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/manufacturing-demo"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            查看制造业场景 Demo
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/solution-builder/result"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
          >
            返回完整方案
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
