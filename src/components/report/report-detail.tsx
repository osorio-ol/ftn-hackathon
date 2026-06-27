import { Bot, CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RecommendationReport } from "@/lib/api/assessments";
import { formatReportDate, normalizeRecommendationReport } from "@/lib/api/assessments";
import type { HistorialItem } from "@/lib/history";

type ReportDetailProps = {
  item: HistorialItem;
  compact?: boolean;
};

export function ReportDetail({ item, compact }: ReportDetailProps) {
  const report = normalizeRecommendationReport(item.aiReport as RecommendationReport | undefined);
  const hasAi = !!report?.analisis_general || !!report?.fortalezas?.length;

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{item.estado}</Badge>
        <Badge variant="secondary">{item.puntaje}% cumplimiento</Badge>
        {hasAi && (
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            <Bot className="mr-1 h-3 w-3" />
            Informe IA
          </Badge>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs">Empresa</dt>
          <dd className="font-medium">{item.empresa}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Responsable</dt>
          <dd className="font-medium">{item.responsable}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Fecha</dt>
          <dd>{formatReportDate(item.fecha)}</dd>
        </div>
        {item.assessmentId && (
          <div>
            <dt className="text-muted-foreground text-xs">ID evaluación</dt>
            <dd className="font-mono text-xs">{item.assessmentId}</dd>
          </div>
        )}
      </dl>

      {report?.nivel_riesgo && (
        <div className="rounded-xl border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Nivel de riesgo (IA): </span>
          <strong>{report.nivel_riesgo}</strong>
        </div>
      )}

      {report?.analisis_general && (
        <section className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            Análisis general (IA)
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed rounded-xl bg-primary/5 border border-primary/10 p-3">
            {report.analisis_general}
          </p>
        </section>
      )}

      {report?.fortalezas && report.fortalezas.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Fortalezas
          </h4>
          <ul className="space-y-1.5">
            {report.fortalezas.map((f, i) => (
              <li key={i} className="text-sm rounded-lg bg-green-50 dark:bg-green-950/20 px-3 py-2">
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      {item.brechas.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Áreas de mejora
          </h4>
          <ul className="space-y-1.5">
            {item.brechas.map((b, i) => (
              <li key={i} className="text-sm text-muted-foreground rounded-lg bg-muted/40 px-3 py-2">
                <span className="font-bold text-amber-600 mr-2">{i + 1}.</span>
                {b}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          {hasAi ? "Plan de acción (IA)" : "Recomendaciones"}
        </h4>
        {item.recomendaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay recomendaciones registradas.</p>
        ) : (
          <ul className="space-y-2">
            {item.recomendaciones.map((r, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm rounded-xl border border-primary/10 bg-primary/5 px-3 py-2"
              >
                <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                {r}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
