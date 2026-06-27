import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import type { PreguntaDiagnostico, RespuestaValor } from "@/lib/diagnostico";
import { AiAssistant } from "@/components/diagnostico/ai-assistant";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { HelpCircle } from "lucide-react";

type QuestionCardProps = {
  pregunta: PreguntaDiagnostico;
  value?: RespuestaValor;
  onChange: (value: RespuestaValor) => void;
  iaActiva: boolean;
  index: number;
  total: number;
};

export function QuestionCard({
  pregunta,
  value,
  onChange,
  iaActiva,
  index,
  total,
}: QuestionCardProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
      <div className="text-center space-y-2">
        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
          Pregunta {index + 1} de {total}
        </span>
        <h2 className="text-xl md:text-2xl font-semibold leading-snug max-w-xl mx-auto">
          {pregunta.texto}
        </h2>
        <p className="text-sm text-muted-foreground">
          Elige la opción que mejor describa tu organización hoy
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => onChange("si")}
          className={cn(
            "group flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all hover:scale-[1.02] hover:shadow-md",
            value === "si"
              ? "border-green-500 bg-green-50 dark:bg-green-950/30 shadow-md ring-2 ring-green-500/20"
              : "border-border bg-card hover:border-green-300 hover:bg-green-50/50 dark:hover:bg-green-950/10"
          )}
        >
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
              value === "si"
                ? "bg-green-500 text-white"
                : "bg-muted text-muted-foreground group-hover:bg-green-100 group-hover:text-green-700 dark:group-hover:bg-green-900"
            )}
          >
            <Check className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <span className={cn("text-lg font-semibold", value === "si" && "text-green-700 dark:text-green-400")}>
            Sí
          </span>
          <span className="text-xs text-muted-foreground text-center">Cumplimos con esto</span>
        </button>

        <button
          type="button"
          onClick={() => onChange("no")}
          className={cn(
            "group flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all hover:scale-[1.02] hover:shadow-md",
            value === "no"
              ? "border-red-400 bg-red-50 dark:bg-red-950/30 shadow-md ring-2 ring-red-400/20"
              : "border-border bg-card hover:border-red-200 hover:bg-red-50/50 dark:hover:bg-red-950/10"
          )}
        >
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
              value === "no"
                ? "bg-red-500 text-white"
                : "bg-muted text-muted-foreground group-hover:bg-red-100 group-hover:text-red-700 dark:group-hover:bg-red-900"
            )}
          >
            <X className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <span className={cn("text-lg font-semibold", value === "no" && "text-red-700 dark:text-red-400")}>
            No
          </span>
          <span className="text-xs text-muted-foreground text-center">Aún no lo tenemos</span>
        </button>
      </div>

      {iaActiva && (
        <Collapsible className="max-w-lg mx-auto">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground gap-2">
              <HelpCircle className="h-4 w-4" />
              ¿Necesitas ayuda con esta pregunta?
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <AiAssistant pregunta={pregunta} compact />
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
