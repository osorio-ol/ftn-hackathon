import { ApiError, apiRequest } from "@/lib/api/client";
import {
  getRecommendationOptional,
  type RecommendationOut,
  normalizeRecommendationReport,
} from "@/lib/api/assessments";

export type GenerateRecommendationsContext = {
  puntaje: number;
  estado: string;
  brechas: string[];
  recomendaciones: string[];
  empresa?: string;
};

export async function generateRecommendationsFlow(
  assessmentId: number,
  context: GenerateRecommendationsContext
): Promise<RecommendationOut> {
  const rec = await apiRequest<RecommendationOut>(
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
    ...rec,
    report: normalizeRecommendationReport(rec.report) ?? rec.report,
  };
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
