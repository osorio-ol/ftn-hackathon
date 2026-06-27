import { Bot, Lightbulb, Scale } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PreguntaDiagnostico } from "@/lib/diagnostico";

type AiAssistantProps = {
  pregunta: PreguntaDiagnostico;
  compact?: boolean;
};

export function AiAssistant({ pregunta, compact }: AiAssistantProps) {
  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
      {!compact && (
        <p className="text-sm font-medium flex items-center gap-2 mb-3">
          <Bot className="h-4 w-4 text-primary" />
          Asistente IA
        </p>
      )}
      <Tabs defaultValue="legal">
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="legal" className="text-xs gap-1">
            <Scale className="h-3 w-3" />
            ¿Qué significa?
          </TabsTrigger>
          <TabsTrigger value="practica" className="text-xs gap-1">
            <Lightbulb className="h-3 w-3" />
            ¿Cómo evaluarlo?
          </TabsTrigger>
        </TabsList>
        <TabsContent value="legal" className="text-sm text-muted-foreground mt-3 leading-relaxed">
          {pregunta.ayudaLegal}
        </TabsContent>
        <TabsContent value="practica" className="text-sm text-muted-foreground mt-3 leading-relaxed">
          {pregunta.ayudaPractica}
        </TabsContent>
      </Tabs>
    </div>
  );
}
