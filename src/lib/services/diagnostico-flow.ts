import {
  buildAssessmentPayload,
  createAssessment,
  reportToBrechas,
  reportToRecomendaciones,
  type RecommendationReport,
} from "@/lib/api/assessments";
import { generateRecommendationsFlow } from "@/lib/api/n8n";
import { ApiError } from "@/lib/api/client";
import type { User } from "@/lib/auth";
import {
  calcularPuntaje,
  generarRecomendaciones,
  type BloqueId,
  type RespuestaValor,
} from "@/lib/diagnostico";

export type DiagnosticoFlowResult = {
  assessmentId: number;
  puntaje: number;
  estado: "Cumple" | "Parcial" | "No cumple";
  brechas: string[];
  recomendaciones: string[];
  respuestasSi: number;
  totalPreguntas: number;
  porBloque: Record<BloqueId, number>;
  aiReport: RecommendationReport | null;
  aiError: string | null;
};

export type DiagnosticoFlowInput = {
  user: User;
  responsable: string;
  respuestas: Record<number, RespuestaValor | undefined>;
  onPhaseChange?: (phase: DiagnosticoPhase) => void;
};

export type DiagnosticoPhase = "saving" | "generating" | "loading-report";

export async function submitDiagnosticoFlow(
  input: DiagnosticoFlowInput
): Promise<DiagnosticoFlowResult> {
  const { user, respuestas, onPhaseChange } = input;
  const calc = calcularPuntaje(respuestas);
  const fallbackRecomendaciones = generarRecomendaciones(calc.brechas);

  onPhaseChange?.("saving");
  let assessmentId: number;
  try {
    const payload = buildAssessmentPayload(user, calc.puntaje, respuestas);
    const assessment = await createAssessment(payload);
    assessmentId = assessment.id;
  } catch (err) {
    const msg =
      err instanceof ApiError
        ? err.message
        : "No se pudo guardar el diagnóstico. Intenta de nuevo.";
    throw new ApiError(msg, err instanceof ApiError ? err.status : 500);
  }

  onPhaseChange?.("generating");
  let aiReport: RecommendationReport | null = null;
  let aiError: string | null = null;
  let brechas = calc.brechas;
  let recomendaciones = fallbackRecomendaciones;

  try {
    onPhaseChange?.("loading-report");
    const recommendation = await generateRecommendationsFlow(assessmentId, {
      puntaje: calc.puntaje,
      estado: calc.estado,
      brechas: calc.brechas,
      recomendaciones: fallbackRecomendaciones,
      empresa: user.company_name ?? undefined,
    });
    aiReport = recommendation.report;
    const fromAi = reportToRecomendaciones(aiReport);
    const fromAiBrechas = reportToBrechas(aiReport);
    if (fromAi.length > 0) recomendaciones = fromAi;
    if (fromAiBrechas.length > 0) brechas = fromAiBrechas;
  } catch (err) {
    aiError =
      err instanceof ApiError
        ? err.message
        : "No se pudieron generar las recomendaciones con IA. Se muestran sugerencias básicas.";
  }

  return {
    assessmentId,
    puntaje: calc.puntaje,
    estado: calc.estado,
    brechas,
    recomendaciones,
    respuestasSi: calc.respuestasSi,
    totalPreguntas: calc.totalPreguntas,
    porBloque: calc.porBloque,
    aiReport,
    aiError,
  };
}
