import { ApiError, apiRequest } from "@/lib/api/client";
import {
  getRecommendationOptional,
  type GenerateRecommendationsOut,
  type RecommendationOut,
  type RecommendationReport,
  normalizeRecommendationReport,
} from "@/lib/api/assessments";

export type GenerateRecommendationsContext = {
  puntaje: number;
  estado: string;
  brechas: string[];
  recomendaciones: string[];
  empresa?: string;
};

export function isFallbackRecommendationReport(report: RecommendationReport): boolean {
  if (report.source === "fallback") return true;
  const ag = report.analisis_general ?? "";
  return (
    ag.startsWith("La evaluación registró un cumplimiento del") &&
    (!report.fortalezas || report.fortalezas.length === 0)
  );
}

function normalizeRec(rec: RecommendationOut): RecommendationOut {
  return {
    ...rec,
    report: normalizeRecommendationReport(rec.report) ?? rec.report,
  };
}

export async function generateRecommendationsFlow(
  assessmentId: number,
  context: GenerateRecommendationsContext
): Promise<GenerateRecommendationsOut> {
  const rec = await apiRequest<GenerateRecommendationsOut>(
    `/api/v1/assessments/${assessmentId}/generate-recommendations`,
    {
      method: "POST",
      body: {
        puntaje: context.puntaje,
        estado: context.estado,
        brechas: context.brechas,
        recomendaciones: context.recomendaciones,
        empresa: context.empresa,
      },
    }
  );

  return {
    ...normalizeRec(rec),
    n8n_pending: rec.n8n_pending ?? false,
  };
}

export async function waitForEnrichedRecommendation(
  assessmentId: number,
  options?: { maxWaitMs?: number; intervalMs?: number }
): Promise<RecommendationOut | null> {
  const maxWaitMs = options?.maxWaitMs ?? 90_000;
  const intervalMs = options?.intervalMs ?? 3_000;
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    const rec = await getRecommendationOptional(assessmentId);
    if (rec?.report && !isFallbackRecommendationReport(rec.report)) {
      return normalizeRec(rec);
    }
  }

  return null;
}

/** @deprecated Usar generateRecommendationsFlow con contexto del diagnóstico */
export async function triggerN8nRecommendations(_assessmentId: number): Promise<void> {
  /* mantenido por compatibilidad; el backend dispara n8n en producción */
}

export async function fetchRecommendationWithRetry(assessmentId: number) {
  const rec = await getRecommendationOptional(assessmentId);
  if (rec) return rec;
  throw new ApiError("No se encontró la recomendación generada.", 404);
}

export type GenerateRecommendationsResult = Awaited<
  ReturnType<typeof generateRecommendationsFlow>
>;
