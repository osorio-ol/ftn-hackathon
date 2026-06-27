import { jsPDF } from "jspdf";
import type { HistorialItem } from "@/lib/history";
import type { RecommendationReport } from "@/lib/api/assessments";
import { normalizeRecommendationReport } from "@/lib/api/assessments";

function asReport(ai?: Record<string, unknown>): RecommendationReport | undefined {
  return normalizeRecommendationReport(ai as RecommendationReport | undefined);
}

function addSection(doc: jsPDF, title: string, lines: string[], y: number, margin: number, maxWidth: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();

  if (y > pageHeight - 30) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, maxWidth) as string[];
    if (y + wrapped.length * 5 > pageHeight - 15) {
      doc.addPage();
      y = 20;
    }
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5 + 2;
  }

  return y + 4;
}

export function downloadReportePdf(item: HistorialItem) {
  const doc = new jsPDF();
  const margin = 20;
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let y = 20;
  const report = asReport(item.aiReport);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CAVALTEC — Informe Ley 1581", margin, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Autodiagnostico de cumplimiento — Fase de diseno", margin, y);
  doc.setTextColor(0);
  y += 12;

  y = addSection(
    doc,
    "Datos generales",
    [
      `Empresa: ${item.empresa}`,
      `Responsable: ${item.responsable}`,
      `Fecha: ${item.fecha.slice(0, 10)}`,
      `Nivel de cumplimiento: ${item.puntaje}%`,
      `Estado: ${item.estado}`,
      ...(item.assessmentId ? [`ID evaluacion: ${item.assessmentId}`] : []),
    ],
    y,
    margin,
    maxWidth
  );

  if (report?.nivel_riesgo) {
    y = addSection(doc, "Nivel de riesgo (IA)", [report.nivel_riesgo], y, margin, maxWidth);
  }

  if (report?.analisis_general) {
    y = addSection(doc, "Analisis general (IA)", [report.analisis_general], y, margin, maxWidth);
  }

  if (report?.fortalezas?.length) {
    y = addSection(
      doc,
      "Fortalezas",
      report.fortalezas.map((f, i) => `${i + 1}. ${f}`),
      y,
      margin,
      maxWidth
    );
  }

  if (item.brechas.length) {
    y = addSection(
      doc,
      "Areas de mejora",
      item.brechas.map((b, i) => `${i + 1}. ${b}`),
      y,
      margin,
      maxWidth
    );
  }

  if (item.recomendaciones.length) {
    y = addSection(
      doc,
      report ? "Plan de accion (IA)" : "Recomendaciones",
      item.recomendaciones.map((r, i) => `${i + 1}. ${r}`),
      y,
      margin,
      maxWidth
    );
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    "Generado por CAVALTEC — Proteccion de datos personales Ley 1581 de 2012",
    margin,
    doc.internal.pageSize.getHeight() - 10
  );

  const slug = item.empresa.replace(/\s+/g, "-").toLowerCase();
  doc.save(`reporte-${slug}-${item.fecha.slice(0, 10)}.pdf`);
}
