import { Badge } from "@/components/ui/badge";
import type { RecommendationReport } from "@/lib/api/assessments";
import { formatReportDate, normalizeRecommendationReport } from "@/lib/api/assessments";
import type { HistorialItem } from "@/lib/history";
import { SectionAccordion, type SectionAccordionItem } from "@/components/layout/section-accordion";

type ReportDetailProps = {
  item: HistorialItem;
};

export function ReportDetail({ item }: ReportDetailProps) {
  const report = normalizeRecommendationReport(item.aiReport as RecommendationReport | undefined);
  const hasAi = !!report?.analisis_general || !!report?.fortalezas?.length;

  const sections: SectionAccordionItem[] = [];

  if (report?.analisis_general) {
    sections.push({
      id: "analisis",
      title: "Análisis general (IA)",
      badge: "IA",
      children: (
        <p className="text-sm leading-relaxed text-muted-foreground rounded-lg bg-primary/5 border border-primary/10 p-3">
          {report.analisis_general}
        </p>
      ),
    });
  }

  if (report?.fortalezas && report.fortalezas.length > 0) {
    sections.push({
      id: "fortalezas",
      title: "Fortalezas",
      badge: String(report.fortalezas.length),
      children: (
        <ul className="space-y-2">
          {report.fortalezas.map((f, i) => (
            <li key={i} className="text-sm rounded-lg bg-green-50 dark:bg-green-950/20 px-3 py-2">
              {f}
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (item.brechas.length > 0) {
    sections.push({
      id: "brechas",
      title: "Áreas de mejora",
      badge: String(item.brechas.length),
      children: (
        <ul className="space-y-2">
          {item.brechas.map((b, i) => (
            <li key={i} className="text-sm text-muted-foreground rounded-lg bg-muted/40 px-3 py-2">
              <span className="font-semibold text-amber-600 mr-2">{i + 1}.</span>
              {b}
            </li>
          ))}
        </ul>
      ),
    });
  }

  sections.push({
    id: "recomendaciones",
    title: hasAi ? "Plan de acción (IA)" : "Recomendaciones",
    badge: item.recomendaciones.length ? String(item.recomendaciones.length) : undefined,
    children:
      item.recomendaciones.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay recomendaciones registradas.</p>
      ) : (
        <ul className="space-y-2">
          {item.recomendaciones.map((r, i) => (
            <li
              key={i}
              className="flex gap-2 text-sm rounded-lg border border-primary/10 bg-primary/5 px-3 py-2"
            >
              <span className="font-bold text-primary shrink-0">{i + 1}.</span>
              {r}
            </li>
          ))}
        </ul>
      ),
  });

  const defaultOpen = [
    report?.analisis_general ? "analisis" : null,
    "recomendaciones",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{item.estado}</Badge>
        <Badge variant="secondary">{item.puntaje}% cumplimiento</Badge>
        {hasAi && (
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            Informe IA
          </Badge>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm rounded-lg border bg-muted/20 p-3">
        <div>
          <dt className="text-xs text-muted-foreground">Empresa</dt>
          <dd className="font-medium">{item.empresa}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Responsable</dt>
          <dd className="font-medium">{item.responsable}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Fecha</dt>
          <dd>{formatReportDate(item.fecha)}</dd>
        </div>
        {item.assessmentId && (
          <div>
            <dt className="text-xs text-muted-foreground">ID evaluación</dt>
            <dd className="font-mono text-xs">{item.assessmentId}</dd>
          </div>
        )}
      </dl>

      {report?.nivel_riesgo && (
        <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Nivel de riesgo (IA): </span>
          <strong>{report.nivel_riesgo}</strong>
        </div>
      )}

      <SectionAccordion sections={sections} defaultOpen={defaultOpen} />
    </div>
  );
}
