import { Bot, Loader2 } from "lucide-react";
import type { DiagnosticoPhase } from "@/lib/services/diagnostico-flow";

const phaseMessages: Record<DiagnosticoPhase, string> = {
  saving: "Guardando tu diagnóstico…",
  generating: "Generando recomendaciones con IA…",
  "loading-report": "Preparando tu informe personalizado…",
};

type DiagnosticoLoadingProps = {
  phase: DiagnosticoPhase;
};

export function DiagnosticoLoading({ phase }: DiagnosticoLoadingProps) {
  return (
    <div className="max-w-md mx-auto py-20 text-center space-y-6 animate-in fade-in duration-300">
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
          <Bot className="h-7 w-7 text-primary" />
        </div>
        <Loader2 className="absolute -bottom-1 -right-1 h-6 w-6 text-primary animate-spin" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{phaseMessages[phase]}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Esto puede tomar unos segundos. Estamos analizando tus respuestas según la Ley 1581.
        </p>
      </div>
      <div className="flex justify-center gap-1.5">
        {(["saving", "generating", "loading-report"] as DiagnosticoPhase[]).map((p) => (
          <span
            key={p}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              p === phase ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
