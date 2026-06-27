import { preguntasDiagnostico } from "@/lib/diagnostico";
import { buildComplianceScore, type ComplianceLevel } from "@/lib/compliance/score";
import type { AssessmentOut } from "@/lib/api/assessments";

export type ComparisonSnapshot = {
  assessmentId: number;
  fecha: string;
  puntaje: number;
  level: ComplianceLevel;
  label: string;
  brechasCount: number;
  respuestasSi: number;
  porPregunta: Record<number, boolean>;
};

export type ComparisonResult = {
  before: ComparisonSnapshot;
  after: ComparisonSnapshot;
  deltaScore: number;
  deltaBrechas: number;
  improvedQuestions: number[];
  regressedQuestions: number[];
  summary: string;
};

function snapshotFromAssessment(a: AssessmentOut): ComparisonSnapshot {
  const porPregunta: Record<number, boolean> = {};
  let respuestasSi = 0;
  for (const ans of a.answers) {
    porPregunta[ans.question_number] = ans.answer;
    if (ans.answer) respuestasSi++;
  }
  const brechasCount = preguntasDiagnostico.filter((q) => porPregunta[q.id] === false).length;
  const score = buildComplianceScore(a.score);

  return {
    assessmentId: a.id,
    fecha: a.created_at,
    puntaje: score.percentage,
    level: score.level,
    label: score.label,
    brechasCount,
    respuestasSi,
    porPregunta,
  };
}

export function compareAssessments(before: AssessmentOut, after: AssessmentOut): ComparisonResult {
  const b = snapshotFromAssessment(before);
  const a = snapshotFromAssessment(after);
  const deltaScore = a.puntaje - b.puntaje;
  const deltaBrechas = b.brechasCount - a.brechasCount;

  const improvedQuestions: number[] = [];
  const regressedQuestions: number[] = [];

  for (const q of preguntasDiagnostico) {
    const was = b.porPregunta[q.id];
    const now = a.porPregunta[q.id];
    if (was === false && now === true) improvedQuestions.push(q.id);
    if (was === true && now === false) regressedQuestions.push(q.id);
  }

  let summary: string;
  if (deltaScore > 0) {
    summary = `El cumplimiento mejoró ${deltaScore} puntos porcentuales (${b.label} → ${a.label}). Se corrigieron ${improvedQuestions.length} áreas.`;
  } else if (deltaScore < 0) {
    summary = `El cumplimiento disminuyó ${Math.abs(deltaScore)} puntos (${b.label} → ${a.label}). Revise las áreas regresadas.`;
  } else {
    summary = `El puntaje se mantiene en ${a.puntaje}%. ${deltaBrechas > 0 ? `Se redujeron ${deltaBrechas} brechas.` : "Considere implementar el plan de acción."}`;
  }

  return {
    before: b,
    after: a,
    deltaScore,
    deltaBrechas,
    improvedQuestions,
    regressedQuestions,
    summary,
  };
}

export function pickBeforeAfter(assessments: AssessmentOut[]): { before: AssessmentOut; after: AssessmentOut } | null {
  if (assessments.length < 2) return null;
  const sorted = [...assessments].sort(
    (x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime()
  );
  return { before: sorted[0], after: sorted[sorted.length - 1] };
}
