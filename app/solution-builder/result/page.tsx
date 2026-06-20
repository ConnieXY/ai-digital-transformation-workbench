"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import GroundedSolutionView from "@/components/solution/GroundedSolutionView";
import { type SolutionInput, SOLUTION_INPUT_KEY } from "@/data/solution";
import type { GroundedSolution, SolutionSource } from "@/lib/schemas/solution";
import { solutionFallback } from "@/lib/solution/fallback";

interface GroundedPayload {
  input: SolutionInput;
  grounded: GroundedSolution;
  sources: SolutionSource[];
}

export default function SolutionResultPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<GroundedPayload | null>(null);

  useEffect(() => {
    setMounted(true);

    // 离线 / 无 id：用同一套 grounded 结构（规则降级，与 LLM 路径统一渲染）
    const loadLocal = () => {
      try {
        const raw = localStorage.getItem(SOLUTION_INPUT_KEY);
        if (!raw) return;
        const input = JSON.parse(raw) as SolutionInput;
        setPayload({ input, grounded: solutionFallback(input), sources: [] });
      } catch {
        setPayload(null);
      }
    };

    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      loadLocal();
      return;
    }
    setLoading(true);
    fetch(`/api/solutions/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
      .then((d) => {
        if (d?.grounded?.recommendations) {
          setPayload({
            input: d.input,
            grounded: d.grounded,
            sources: d.sources ?? [],
          });
        } else {
          loadLocal();
        }
      })
      .catch(loadLocal)
      .finally(() => setLoading(false));
  }, []);

  if (!mounted) {
    return (
      <PageShell>
        <div className="container-page py-24" />
      </PageShell>
    );
  }

  if (loading) {
    return (
      <PageShell>
        <section className="container-page py-24 text-center">
          <p className="text-sm text-ink-500">正在基于知识库生成方案…</p>
        </section>
      </PageShell>
    );
  }

  if (!payload) {
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

  // 唯一渲染路径：LLM 与规则降级都走 GroundedSolutionView
  return (
    <PageShell>
      <GroundedSolutionView
        input={payload.input}
        grounded={payload.grounded}
        sources={payload.sources}
      />
    </PageShell>
  );
}
