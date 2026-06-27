import { ApiError, apiRequest } from "@/lib/api/client";

import type { User } from "@/lib/auth";

import type { RespuestaValor } from "@/lib/diagnostico";

import { getIdsDelFlujo, pruneRespuestasFueraDeFlujo } from "@/lib/diagnostico";


export type AssessmentAnswer = {

  question_number: number;

  answer: boolean;

};



export type AssessmentSummary = {

  id: number;

  company_id: number;

  company_name: string;

  score: number;

  status: "Cumple" | "Parcial" | "No cumple" | string;

  created_at: string;

  has_recommendation: boolean;

  nivel_riesgo: string | null;

};



export type AssessmentOut = {

  id: number;

  company_id: number;

  score: number;

  created_at: string;

  answers: AssessmentAnswer[];

  company?: { id: number; name: string };

};



export type RecommendationReport = {

  empresa?: string;

  analisis_general?: string;

  fortalezas?: string[];

  debilidades?: string[];

  nivel_riesgo?: string;

  recomendaciones?: string[];

  [key: string]: unknown;

};



function formatReportListItem(entry: unknown): string | null {

  if (typeof entry === "string") {

    const trimmed = entry.trim();

    return trimmed || null;

  }

  if (!entry || typeof entry !== "object") return null;

  const o = entry as Record<string, unknown>;

  if (typeof o.recomendacion === "string") {

    const parts: string[] = [];

    if (typeof o.prioridad === "string") parts.push(`[${o.prioridad}]`);

    parts.push(o.recomendacion);

    if (typeof o.justificacion === "string") parts.push(o.justificacion);

    return parts.join(" — ");

  }

  const item = typeof o.item === "string" ? o.item : "";

  const desc = typeof o.descripcion === "string" ? o.descripcion : "";

  if (item && desc) return `${item}: ${desc}`;

  if (item) return item;

  if (desc) return desc;

  return null;

}



function asReportStringList(value: unknown): string[] {

  if (!value) return [];

  if (typeof value === "string") {

    const trimmed = value.trim();

    return trimmed ? [trimmed] : [];

  }

  if (!Array.isArray(value)) return [];

  return value.map(formatReportListItem).filter((s): s is string => !!s);

}



/** n8n may return structured objects; UI expects string arrays. */

export function normalizeRecommendationReport(

  report: RecommendationReport | undefined | null

): RecommendationReport | undefined {

  if (!report || typeof report !== "object") return undefined;

  return {

    ...report,

    empresa: typeof report.empresa === "string" ? report.empresa : undefined,

    analisis_general:

      typeof report.analisis_general === "string" ? report.analisis_general : undefined,

    nivel_riesgo: typeof report.nivel_riesgo === "string" ? report.nivel_riesgo : undefined,

    fortalezas: asReportStringList(report.fortalezas),

    debilidades: asReportStringList(report.debilidades),

    recomendaciones: asReportStringList(report.recomendaciones),

  };

}



export function formatReportDate(fecha: string | undefined): string {

  if (!fecha) return "—";

  const s = String(fecha);

  return s.length >= 10 ? s.slice(0, 10) : s;

}



export type RecommendationOut = {

  id: number;

  assessment_id: number;

  report: RecommendationReport;

  created_at: string;

};

export type GenerateRecommendationsOut = RecommendationOut & {
  n8n_pending: boolean;
};



export type CreateAssessmentPayload = {

  company_id?: number;

  company?: {

    name: string;

    email: string;

    nit: string;

    sector: string;

  };

  score: number;

  answers: AssessmentAnswer[];

};



export function buildAssessmentPayload(

  user: User,

  score: number,

  respuestas: Record<number, RespuestaValor | undefined>

): CreateAssessmentPayload {

  const sanitized = pruneRespuestasFueraDeFlujo(respuestas);
  const ids = getIdsDelFlujo(sanitized);
  const answers = ids.map((id) => ({
    question_number: id,
    answer: sanitized[id] === "si",
  }));



  if (user.company_id) {

    return { company_id: user.company_id, score, answers };

  }



  return {

    company: {

      name: user.company_name ?? "Empresa",

      email: user.email,

      nit: user.company_nit ?? "000000000",

      sector: user.company_sector ?? "Otro",

    },

    score,

    answers,

  };

}



export function resolveAssessmentListCompanyId(user: User | null): number | undefined | null {
  if (!user) return null;
  if (user.role === "admin" || user.role === "auditor") return undefined;
  if (user.company_id == null) return null;
  return user.company_id;
}

export async function listAssessments(companyId?: number): Promise<AssessmentSummary[]> {

  const qs = companyId != null ? `?company_id=${companyId}` : "";

  return apiRequest<AssessmentSummary[]>(`/api/v1/assessments${qs}`);

}

export async function listAssessmentsForUser(user: User | null): Promise<AssessmentSummary[]> {
  const scope = resolveAssessmentListCompanyId(user);
  if (scope === null) return [];
  return listAssessments(scope);
}



export async function createAssessment(payload: CreateAssessmentPayload): Promise<AssessmentOut> {

  return apiRequest<AssessmentOut>("/api/v1/assessments", {

    method: "POST",

    body: payload,

  });

}



export async function getAssessment(assessmentId: number): Promise<AssessmentOut> {

  return apiRequest<AssessmentOut>(`/api/v1/assessments/${assessmentId}`);

}



export async function deleteAssessment(assessmentId: number): Promise<void> {

  await apiRequest<void>(`/api/v1/assessments/${assessmentId}`, { method: "DELETE" });

}



export async function getRecommendation(assessmentId: number): Promise<RecommendationOut> {

  const rec = await apiRequest<RecommendationOut>(`/api/v1/recommendations/${assessmentId}`);

  return {

    ...rec,

    report: normalizeRecommendationReport(rec.report) ?? rec.report,

  };

}



export async function getRecommendationOptional(

  assessmentId: number

): Promise<RecommendationOut | null> {

  try {

    const rec = await apiRequest<RecommendationOut | null>(
      `/api/v1/recommendations/${assessmentId}/optional`
    );

    if (!rec) return null;

    return {

      ...rec,

      report: normalizeRecommendationReport(rec.report) ?? rec.report,

    };

  } catch (err) {

    if (err instanceof ApiError && err.status === 404) return null;

    throw err;

  }

}



export function reportToRecomendaciones(report: RecommendationReport): string[] {

  const normalized = normalizeRecommendationReport(report) ?? report;

  if (normalized.recomendaciones && normalized.recomendaciones.length > 0) {

    return normalized.recomendaciones;

  }

  const items: string[] = [];

  if (normalized.analisis_general) items.push(normalized.analisis_general);

  if (normalized.debilidades?.length) {

    items.push(...normalized.debilidades.map((d) => `Atender: ${d}`));

  }

  return items;

}



export function reportToBrechas(report: RecommendationReport): string[] {

  const normalized = normalizeRecommendationReport(report) ?? report;

  if (normalized.debilidades && normalized.debilidades.length > 0) {

    return normalized.debilidades;

  }

  return [];

}



export function scoreStatus(score: number): AssessmentSummary["status"] {

  if (score >= 80) return "Cumple";

  if (score >= 60) return "Parcial";

  return "No cumple";

}


