import { ShieldCheck, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type DiagnosticoIntroProps = {
  empresa: string;
  responsable: string;
  onResponsableChange: (value: string) => void;
  responsableError?: string;
  onStart: () => void;
};

export function DiagnosticoIntro({
  empresa,
  responsable,
  onResponsableChange,
  responsableError,
  onStart,
}: DiagnosticoIntroProps) {
  return (
    <div className="animate-in fade-in duration-500 max-w-lg mx-auto text-center space-y-8 py-4">
      <div className="space-y-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg">
          <ShieldCheck className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Autodiagnóstico Ley 1581</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Evalúa el cumplimiento en <strong>3 bloques</strong> con hasta{" "}
            <strong>11 preguntas</strong>. Algunas solo aparecen según tus respuestas (por ejemplo, si no
            tienes política de datos, se omiten las preguntas 2 a 5).
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          {["Sin tecnicismos", "Asistente IA", "Resultado inmediato"].map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 font-medium"
            >
              <Sparkles className="h-3 w-3" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 text-left space-y-4 shadow-sm">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wide">Empresa</Label>
          <Input value={empresa} disabled className="bg-muted/50 font-medium" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsable-intro">Tu nombre (responsable del diagnóstico)</Label>
          <Input
            id="responsable-intro"
            value={responsable}
            onChange={(e) => onResponsableChange(e.target.value)}
            placeholder="Ej. María García"
          />
          {responsableError && <p className="text-xs text-destructive">{responsableError}</p>}
        </div>
      </div>

      <Button size="lg" className="w-full sm:w-auto px-10 rounded-xl shadow-sm" onClick={onStart} type="button">
        Comenzar diagnóstico →
      </Button>
    </div>
  );
}
