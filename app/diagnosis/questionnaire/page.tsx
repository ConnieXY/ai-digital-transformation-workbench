"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import CompanyInfoForm from "@/components/diagnosis/CompanyInfoForm";
import QuestionItem from "@/components/diagnosis/QuestionItem";
import {
  type Answers,
  type CompanyInfo,
  type DiagnosisSubmission,
  DIAGNOSIS_STORAGE_KEY,
  dimensions,
  emptyCompanyInfo,
  questions,
  sampleDiagnosisSubmission,
} from "@/data/diagnosis";

/** 按维度分组问题，并保留其在 questions 数组中的全局下标。 */
const questionsByDimension = dimensions.map((dimension) => ({
  dimension,
  items: questions
    .map((question, index) => ({ question, index }))
    .filter(({ question }) => question.dimension === dimension.id),
}));

export default function QuestionnairePage() {
  const router = useRouter();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(emptyCompanyInfo);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const progress = useMemo(
    () => Math.round((answeredCount / totalQuestions) * 100),
    [answeredCount, totalQuestions],
  );

  function handleInfoChange(field: keyof CompanyInfo, value: string) {
    setCompanyInfo((prev) => ({ ...prev, [field]: value }));
  }

  function handleAnswer(index: number, value: number) {
    setAnswers((prev) => ({ ...prev, [index]: value }));
    setError(null);
  }

  function fillSample() {
    setCompanyInfo(sampleDiagnosisSubmission.companyInfo);
    setAnswers(sampleDiagnosisSubmission.answers);
    setError(null);
  }

  function handleSubmit() {
    // 简单校验：企业名称必填 + 所有问题均已作答
    if (!companyInfo.companyName.trim()) {
      setError("请先填写企业名称。");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (answeredCount < totalQuestions) {
      setError(
        `还有 ${totalQuestions - answeredCount} 题未作答，请完成全部问卷后再生成报告。`,
      );
      return;
    }

    const submission: DiagnosisSubmission = {
      companyInfo,
      answers,
      submittedAt: new Date().toISOString(),
    };
    localStorage.setItem(DIAGNOSIS_STORAGE_KEY, JSON.stringify(submission));
    router.push("/diagnosis/report");
  }

  return (
    <PageShell>
      {/* 顶部标题 + 进度条（吸顶） */}
      <div className="sticky top-16 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container-page py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-ink-900">
                数智化成熟度问卷
              </h1>
              <p className="mt-0.5 text-xs text-ink-500">
                填写企业信息并完成 6D 评分
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-brand-600">
                {answeredCount}/{totalQuestions}
              </p>
              <p className="text-xs text-ink-500">已作答</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="container-page py-10 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/diagnosis"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <span aria-hidden>←</span> 返回诊断说明
          </Link>
          <button
            type="button"
            onClick={fillSample}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
          >
            <span aria-hidden>✨</span> 填入示例
          </button>
        </div>

        <div className="mx-auto mt-6 max-w-3xl space-y-8">
          {/* 分区一：企业基本信息 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-sm font-bold text-brand-600">
                A
              </span>
              <div>
                <h2 className="text-lg font-semibold text-ink-900">
                  企业基本信息
                </h2>
                <p className="text-sm text-ink-500">
                  用于生成贴合企业实际情况的诊断报告
                </p>
              </div>
            </div>
            <div className="mt-6">
              <CompanyInfoForm value={companyInfo} onChange={handleInfoChange} />
            </div>
          </section>

          {/* 分区二：6D 评分，每个维度一张卡片 */}
          {questionsByDimension.map(({ dimension, items }) => {
            const sectionAnswered = items.filter(
              ({ index }) => answers[index] != null,
            ).length;
            return (
              <section
                key={dimension.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-sm font-bold text-brand-600">
                      {dimension.index}
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold text-ink-900">
                        {dimension.title}
                      </h2>
                      <p className="text-sm text-ink-500">
                        {dimension.description}
                      </p>
                    </div>
                  </div>
                  <span className="flex-none rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-ink-500">
                    {sectionAnswered}/{items.length}
                  </span>
                </div>

                <div className="mt-5">
                  {items.map(({ question, index }, i) => (
                    <QuestionItem
                      key={index}
                      number={i + 1}
                      question={question}
                      value={answers[index] ?? null}
                      onChange={(value) => handleAnswer(index, value)}
                    />
                  ))}
                </div>
              </section>
            );
          })}

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
                完成全部 {totalQuestions} 题后即可生成诊断报告
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 sm:w-auto"
              >
                生成诊断报告
                <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
