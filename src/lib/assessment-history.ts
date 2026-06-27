import type { AssessmentOut, AssessmentSummary, RecommendationReport } from "@/lib/api/assessments";
import {
  getAssessment,
  getRecommendationOptional,
  normalizeRecommendationReport,
  reportToBrechas,
  reportToRecomendaciones,
  scoreStatus,
} from "@/lib/api/assessments";
import { calcularPuntaje, generarRecomendaciones } from "@/lib/diagnostico";
import type { HistorialItem } from "@/lib/history";

export function assessmentToHistorial(
  a: AssessmentSummary,
  report?: RecommendationReport,
  responsable = "—"
): HistorialItem {
  const normalized = report ? normalizeRecommendationReport(report) : undefined;
  return {
    id: `EV-${a.id}`,
    empresa: a.company_name,
    responsable,
    fecha: a.created_at,
    puntaje: Math.round(a.score),
    estado: a.status as HistorialItem["estado"],
    brechas: normalized ? reportToBrechas(normalized) : [],
    recomendaciones: normalized ? reportToRecomendaciones(normalized) : [],
    porBloque: {},
    companyId: a.company_id,
    assessmentId: a.id,
    aiReport: normalized,
  };
}

export function buildHistorialFromAssessment(
  assessment: AssessmentOut,
  report?: RecommendationReport,
  responsable = "—"
): HistorialItem {
  const normalized = report ? normalizeRecommendationReport(report) : undefined;
  const respuestas = Object.fromEntries(
    assessment.answers.map((a) => [a.question_number, a.answer ? "si" : "no"] as const)
  );
  const calc = calcularPuntaje(respuestas);
  const brechas = normalized ? reportToBrechas(normalized) : calc.brechas;
  const recomendaciones = normalized ? reportToRecomendaciones(normalized) : generarRecomendaciones(calc.brechas);

  return {
    id: `EV-${assessment.id}`,
    empresa: assessment.company?.name ?? normalized?.empresa ?? "Empresa",
    responsable,
    fecha: assessment.created_at,
    puntaje: Math.round(assessment.score),
    estado: scoreStatus(assessment.score) as HistorialItem["estado"],
    brechas,
    recomendaciones,
    porBloque: {},
    companyId: assessment.company_id,
    assessmentId: assessment.id,
    aiReport: normalized,
  };
}

export async function loadAssessmentReport(assessmentId: number): Promise<RecommendationReport | undefined> {
  const rec = await getRecommendationOptional(assessmentId);
  return rec?.report;
}

export async function loadHistorialItemForAssessment(
  summary: AssessmentSummary,
  responsable = "—"
): Promise<HistorialItem> {
  const report = await loadAssessmentReport(summary.id);
  if (report) {
    return assessmentToHistorial(summary, report, responsable);
  }
  try {
    const assessment = await getAssessment(summary.id);
    return buildHistorialFromAssessment(assessment, undefined, responsable);
  } catch {
    return assessmentToHistorial(summary, undefined, responsable);
  }
}

export function monthLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
}

export function buildTrendFromAssessments(items: AssessmentSummary[]) {
  const byMonth = new Map<string, { total: number; count: number }>();
  for (const item of [...items].reverse()) {
    const key = monthLabel(item.created_at);
    const cur = byMonth.get(key) ?? { total: 0, count: 0 };
    cur.total += item.score;
    cur.count += 1;
    byMonth.set(key, cur);
  }
  return Array.from(byMonth.entries()).map(([mes, { total, count }]) => ({
    mes,
    puntaje: Math.round(total / count),
  }));
}
