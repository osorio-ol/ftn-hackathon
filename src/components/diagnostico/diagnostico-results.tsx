import { Bot, CheckCircle2, Download, Sparkles, TrendingUp, AlertTriangle, AlertCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ComplianceGauge } from "@/components/diagnostico/compliance-gauge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { RecommendationReport } from "@/lib/api/assessments";

type DiagnosticoResultsProps = {
  empresa: string;
  responsable: string;
  puntaje: number;
  estado: "Cumple" | "Parcial" | "No cumple";
  respuestasSi: number;
  totalPreguntas: number;
  brechas: string[];
  recomendaciones: string[];
  aiReport?: RecommendationReport | null;
  aiError?: string | null;
  onDownload: () => void;
  onReset: () => void;
};

const estadoConfig = {
  Cumple: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900",
    message: "¡Excelente! Tu organización muestra un alto nivel de cumplimiento.",
  },
  Parcial: {
    icon: TrendingUp,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900",
    message: "Vas por buen camino. Hay brechas que puedes cerrar con un plan de mejora.",
  },
  "No cumple": {
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900",
    message: "Es momento de actuar. Prioriza las recomendaciones para proteger los datos.",
  },
};

export function DiagnosticoResults({
  empresa,
  puntaje,
  estado,
  respuestasSi,
  totalPreguntas,
  brechas,
  recomendaciones,
  aiReport,
  aiError,
  onDownload,
  onReset,
}: DiagnosticoResultsProps) {
  const config = estadoConfig[estado];
  const Icon = config.icon;
  const fortalezas = aiReport?.fortalezas ?? [];
  const nivelRiesgo = aiReport?.nivel_riesgo;

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto space-y-6">
      <div className="rounded-3xl border bg-gradient-to-b from-card to-muted/20 overflow-hidden shadow-sm">
        <div className="px-6 pt-8 pb-4 text-center space-y-1">
          <p className="text-sm text-muted-foreground">{empresa}</p>
          <h2 className="text-2xl font-bold">Tu resultado</h2>
          <p className="text-sm text-muted-foreground">
            {respuestasSi} de {totalPreguntas} criterios cumplidos
          </p>
        </div>

        <div className="flex justify-center py-2">
          <ComplianceGauge value={puntaje} size={220} />
        </div>

        <div className={cn("mx-6 mb-6 rounded-2xl border p-4 flex gap-3 items-start", config.bg)}>
          <Icon className={cn("h-6 w-6 shrink-0 mt-0.5", config.color)} />
          <div>
            <p className={cn("font-semibold", config.color)}>{estado}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{config.message}</p>
            {nivelRiesgo && (
              <p className="text-xs text-muted-foreground mt-1">
                Nivel de riesgo (IA): <strong>{nivelRiesgo}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      {aiError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{aiError}</AlertDescription>
        </Alert>
      )}

      {aiReport?.analisis_general && (
        <div className="rounded-2xl border bg-card p-5 space-y-2">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <Bot className="h-4 w-4 text-primary" />
            Análisis general (IA)
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{aiReport.analisis_general}</p>
        </div>
      )}

      {fortalezas.length > 0 && (
        <div className="rounded-2xl border bg-card p-5 space-y-3">
          <h3 className="font-semibold flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Fortalezas
          </h3>
          <ul className="space-y-2">
            {fortalezas.map((f, i) => (
              <li key={i} className="text-sm text-muted-foreground rounded-xl bg-green-50 dark:bg-green-950/20 px-3 py-2">
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {brechas.length > 0 && (
        <div className="rounded-2xl border bg-card p-5 space-y-3">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Áreas de mejora ({brechas.length})
          </h3>
          <ul className="space-y-2">
            {brechas.map((b, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm text-muted-foreground rounded-xl bg-muted/40 px-3 py-2"
              >
                <span className="text-amber-500 font-bold shrink-0">{i + 1}.</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <Bot className="h-4 w-4 text-primary" />
          {aiReport ? "Plan de acción (IA)" : "Plan de acción sugerido"}
        </h3>
        <ul className="space-y-2">
          {recomendaciones.map((r, i) => (
            <li
              key={i}
              className="flex gap-3 text-sm rounded-xl border border-primary/10 bg-primary/5 px-3 py-2.5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {i + 1}
              </span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
        <Button onClick={onDownload} variant="outline" className="rounded-full">
          <Download className="mr-2 h-4 w-4" />
          Descargar PDF
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/historial">Ver historial</Link>
        </Button>
        <Button onClick={onReset} className="rounded-full">
          Nuevo diagnóstico
        </Button>
      </div>
    </div>
  );
}
