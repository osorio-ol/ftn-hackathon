import { Progress } from "@/components/ui/progress";
import { Bot } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type DiagnosticoProgressProps = {
  step: number;
  answered: number;
  totalQuestions: number;
  maxQuestions?: number;
  iaActiva: boolean;
  onIaToggle: (value: boolean) => void;
  label?: string;
};

export function DiagnosticoProgress({
  step,
  answered,
  totalQuestions,
  maxQuestions,
  iaActiva,
  onIaToggle,
  label,
}: DiagnosticoProgressProps) {
  const progress =
    totalQuestions > 0 ? Math.min(100, (answered / totalQuestions) * 100) : 0;

  return (
    <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-background/80 backdrop-blur-md border-b space-y-3">
      <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">
            {label ?? `Pregunta ${step} de ${totalQuestions}`}
          </p>
          <p className="text-sm font-medium">
            {answered} de {totalQuestions} respondidas
            {maxQuestions != null && totalQuestions < maxQuestions && (
              <span className="text-muted-foreground font-normal">
                {" "}
                · {maxQuestions - totalQuestions} omitidas por tus respuestas
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
          <Label htmlFor="ia-toggle" className="text-xs font-normal text-muted-foreground">
            Ayuda IA
          </Label>
          <Switch id="ia-toggle" checked={iaActiva} onCheckedChange={onIaToggle} className="scale-90" />
        </div>
      </div>
      <Progress value={progress} className="h-2 max-w-2xl mx-auto" />
    </div>
  );
}
