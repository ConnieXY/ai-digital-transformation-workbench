"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import JourneySteps from "@/components/JourneySteps";
import { apiFetch } from "@/lib/api";
import ChipMultiSelect from "@/components/solution/ChipMultiSelect";
import { getSessionId } from "@/lib/sessionId";
import { SOLUTION_CONTEXT_KEY } from "@/data/diagnosis";
import {
  solutionInputFromDiagnosis,
  type DiagnosisContext,
} from "@/lib/journey/fromDiagnosis";
import {
  type SolutionInput,
  SOLUTION_INPUT_KEY,
  businessGoalOptions,
  emptySolutionInput,
  industryOptions,
  painPointsByIndustry,
  sampleSolutionInput,
  solutionCompanySizeOptions,
  targetRoleOptions,
} from "@/data/solution";

const fieldLabel = "mb-1.5 block text-sm font-medium text-ink-700";
const fieldBase =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

export default function SolutionInputPage() {
  const router = useRouter();
  const [input, setInput] = useState<SolutionInput>(emptySolutionInput);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fromDiagnosis, setFromDiagnosis] = useState<string | null>(null);

  // 若存在模块一诊断结果，继承诊断结论（成熟度/短板/推荐场景）作为方案输入
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SOLUTION_CONTEXT_KEY);
      if (!raw) return;
      const ctx = JSON.parse(raw) as DiagnosisContext;
      if (!ctx?.result || !ctx?.companyInfo) return;
      setInput(solutionInputFromDiagnosis(ctx));
      setFromDiagnosis(
        `${ctx.companyInfo.companyName || "企业"} · 成熟度 ${ctx.result.maturity.level}`,
      );
    } catch {
      // 忽略解析异常，使用默认值
    }
  }, []);

  const painPointOptions = useMemo(
    () => painPointsByIndustry[input.industry] ?? [],
    [input.industry],
  );

  function setField<K extends keyof SolutionInput>(
    field: K,
    value: SolutionInput[K],
  ) {
    setInput((prev) => ({ ...prev, [field]: value }));
  }

  // 切换行业时，清除不属于新行业的已选痛点
  function handleIndustryChange(industry: string) {
    const validPainPoints = painPointsByIndustry[industry] ?? [];
    setInput((prev) => ({
      ...prev,
      industry,
      painPoints: prev.painPoints.filter((p) => validPainPoints.includes(p)),
    }));
  }

  function toggleInList(field: "businessGoals" | "painPoints", value: string) {
    setInput((prev) => {
      const list = prev[field];
      const next = list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];
      return { ...prev, [field]: next };
    });
    setError(null);
  }

  function fillSample() {
    setInput(sampleSolutionInput);
    setError(null);
  }

  function clearSolutionInput() {
    localStorage.removeItem(SOLUTION_CONTEXT_KEY);
    localStorage.removeItem(SOLUTION_INPUT_KEY);
    setInput(emptySolutionInput);
    setFromDiagnosis(null);
    setError(null);
  }

  async function handleSubmit() {
    if (input.painPoints.length === 0) {
      setError("请至少选择一个业务痛点，以便生成针对性的解决方案。");
      return;
    }
    // 始终保留 localStorage 兜底
    localStorage.setItem(SOLUTION_INPUT_KEY, JSON.stringify(input));

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/solutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), input }),
      });
      const data = await res.json();
      if (res.ok && data.persisted && data.id) {
        router.push(`/solution-builder/result?id=${data.id}`);
        return;
      }
    } catch {
      // 后端不可用 → 走规则兜底
    }
    router.push("/solution-builder/result");
  }

  return (
    <PageShell>
      <JourneySteps current={1} />
      {/* 抬头 */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-12 sm:py-14">
          {fromDiagnosis && (
            <div className="mb-5 flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-2.5">
                <span aria-hidden className="mt-0.5">
                  🔗
                </span>
                <p className="leading-relaxed">
                  已继承自<span className="font-semibold">企业诊断</span>（{fromDiagnosis}）：
                  行业、规模、最弱维度对应的目标与痛点、推荐场景已自动带入，可直接生成或微调。
                </p>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/solution-builder"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
            >
              <span aria-hidden>←</span> 返回方案生成器
            </Link>
            <button
              type="button"
              onClick={fillSample}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
            >
              <span aria-hidden>✨</span> 填入示例
            </button>
            {fromDiagnosis && (
              <button
                type="button"
                onClick={clearSolutionInput}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
              >
                清空重填
              </button>
            )}
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            输入行业与客户信息
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-700">
            填写行业、客户画像与业务痛点，系统将据此生成行业解决方案。
          </p>
        </div>
      </section>

      <div className="container-page py-10 sm:py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* 分区一：行业与客户画像 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            <SectionHeader index="A" title="行业与客户画像" />
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="industry" className={fieldLabel}>
                  行业
                </label>
                <select
                  id="industry"
                  className={fieldBase}
                  value={input.industry}
                  onChange={(e) => handleIndustryChange(e.target.value)}
                >
                  {industryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="companySize" className={fieldLabel}>
                  企业规模
                </label>
                <select
                  id="companySize"
                  className={fieldBase}
                  value={input.companySize}
                  onChange={(e) => setField("companySize", e.target.value)}
                >
                  <option value="">请选择企业规模</option>
                  {solutionCompanySizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="targetRole" className={fieldLabel}>
                  目标沟通对象
                </label>
                <select
                  id="targetRole"
                  className={fieldBase}
                  value={input.targetRole}
                  onChange={(e) => setField("targetRole", e.target.value)}
                >
                  <option value="">请选择目标沟通对象</option>
                  {targetRoleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* 分区二：业务目标与痛点 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            <SectionHeader index="B" title="业务目标与痛点" />
            <div className="mt-6 space-y-6">
              <div>
                <p className={fieldLabel}>业务目标（可多选）</p>
                <ChipMultiSelect
                  options={businessGoalOptions}
                  selected={input.businessGoals}
                  onToggle={(value) => toggleInList("businessGoals", value)}
                />
              </div>

              <div>
                <p className={fieldLabel}>
                  业务痛点（可多选 · 随行业变化）
                </p>
                <ChipMultiSelect
                  options={painPointOptions}
                  selected={input.painPoints}
                  onToggle={(value) => toggleInList("painPoints", value)}
                />
              </div>
            </div>
          </section>

          {/* 分区三：现状与补充 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            <SectionHeader index="C" title="现状与补充说明" />
            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="currentSystems" className={fieldLabel}>
                  当前使用系统
                </label>
                <input
                  id="currentSystems"
                  type="text"
                  className={fieldBase}
                  placeholder="例如 ERP、MES、CRM、企业微信…"
                  value={input.currentSystems}
                  onChange={(e) => setField("currentSystems", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="additionalContext" className={fieldLabel}>
                  补充说明
                </label>
                <textarea
                  id="additionalContext"
                  rows={3}
                  className={`${fieldBase} resize-none`}
                  placeholder="补充客户背景、特殊诉求或约束条件…"
                  value={input.additionalContext}
                  onChange={(e) =>
                    setField("additionalContext", e.target.value)
                  }
                />
              </div>
            </div>
          </section>

          {/* 提交区 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <span className="h-2 w-2 flex-none rounded-full bg-amber-400" />
                {error}
              </div>
            )}
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-ink-500">
                已选 {input.painPoints.length} 个痛点 · {input.businessGoals.length}{" "}
                个目标
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {submitting ? "生成中…" : "生成解决方案"}
                {!submitting && <span aria-hidden>→</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

/** 分区标题：字母标记 + 标题。 */
function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-sm font-bold text-brand-600">
        {index}
      </span>
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
    </div>
  );
}
