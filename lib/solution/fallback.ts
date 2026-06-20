import type { SolutionInput } from "@/data/solution";
import type { GroundedSolution } from "@/lib/schemas/solution";
import { generateSolution } from "@/lib/solutionGenerator";

/**
 * 规则降级适配器：把规则方案转成与 LLM 同 schema 的 grounded 结构（citations 留空）。
 * 纯函数、客户端可用 —— 服务端任务与离线前端渲染共用同一适配，确保只有一套渲染。
 */
export function solutionFallback(input: SolutionInput): GroundedSolution {
  const r = generateSolution(input);
  const emphasized = r.roleValues.find((v) => v.emphasized) ?? r.roleValues[0];
  return {
    summary: `${r.priorityScenario.summary}（规则生成，未接 LLM，故无知识库引用）`,
    recommendations: r.solutions.slice(0, 5).map((s) => ({
      scenario: s.scenario,
      solution: s.solution,
      tools: s.tools,
      expectedValue: s.value,
      citations: [],
    })),
    roleValue: {
      role: input.targetRole || emphasized?.title || "决策者",
      value: emphasized?.value ?? "",
    },
    risks: r.priorityScenario.reasons.slice(0, 3),
  };
}
