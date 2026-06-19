import "server-only";
import type { CompanyInfo } from "@/data/diagnosis";
import type { DiagnosisResult } from "@/lib/scoring";
import {
  type DiagnosisInsight,
  DiagnosisInsightSchema,
} from "@/lib/schemas/diagnosis";
import { runStructured } from "@/lib/llm/run";

interface Args {
  companyInfo: CompanyInfo;
  result: DiagnosisResult;
  sessionId?: string;
  entityId?: string | null;
}

/**
 * 基于规则化评分结果，调用 LLM 生成结构化诊断洞察。
 * 仅在已配置 LLM 时调用（route 层负责降级）。
 */
export async function generateDiagnosisInsight({
  companyInfo,
  result,
  sessionId,
  entityId,
}: Args): Promise<DiagnosisInsight> {
  const dims = result.dimensionScores
    .map((d) => `${d.dimension.title}: ${d.average}/5`)
    .join("；");
  const weakest = result.weakestDimensions
    .map((d) => d.dimension.title)
    .join("、");

  const system =
    "你是一名资深企业数智化转型顾问。基于给定的 6D 成熟度评分结果，输出克制、专业、可执行的诊断洞察。" +
    "只依据提供的数据，不编造企业未提供的事实；语言为中文，面向 B2B 决策者。";

  const user = [
    `企业：${companyInfo.companyName || "（未命名）"}`,
    `行业：${companyInfo.industry || "未提供"}｜规模：${companyInfo.companySize || "未提供"}`,
    `当前系统：${companyInfo.currentSystems || "未提供"}`,
    `主要痛点：${companyInfo.mainPainPoint || "未提供"}`,
    `综合成熟度：${result.overallScore}/5（${result.maturity.label}）`,
    `各维度得分：${dims}`,
    `最薄弱维度：${weakest}`,
    "请据此生成结构化诊断洞察。",
  ].join("\n");

  return runStructured({
    schema: DiagnosisInsightSchema,
    system,
    user,
    step: "diagnosis.insight",
    entityType: "assessment",
    entityId,
    sessionId,
  });
}
