import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Lightbulb, Loader2, RefreshCw, Scale } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  fetchDiagnosticoHelp,
  getStaticDiagnosticoHelp,
  type DiagnosticoHelpType,
} from "@/lib/api/diagnostico-help";
import { ApiError } from "@/lib/api/client";
import type { PreguntaDiagnostico } from "@/lib/diagnostico";

type AiAssistantProps = {
  pregunta: PreguntaDiagnostico;
  compact?: boolean;
};

type HelpState = {
  content: string | null;
  loading: boolean;
  error: string | null;
  fromFallback: boolean;
};

const emptyHelpState = (): HelpState => ({
  content: null,
  loading: false,
  error: null,
  fromFallback: false,
});

export function AiAssistant({ pregunta, compact }: AiAssistantProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<DiagnosticoHelpType>("significado");
  const [help, setHelp] = useState<Record<DiagnosticoHelpType, HelpState>>({
    significado: emptyHelpState(),
    evaluacion: emptyHelpState(),
  });
  const loadedKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadedKeys.current.clear();
    setHelp({
      significado: emptyHelpState(),
      evaluacion: emptyHelpState(),
    });
    setTab("significado");
  }, [pregunta.id]);

  const loadHelp = useCallback(
    async (type: DiagnosticoHelpType, force = false) => {
      if (!user) return;

      const cacheKey = `${pregunta.id}-${type}`;
      if (!force && loadedKeys.current.has(cacheKey)) return;

      setHelp((prev) => ({
        ...prev,
        [type]: { ...prev[type], loading: true, error: null },
      }));

      try {
        const content = await fetchDiagnosticoHelp(pregunta, type, user);
        loadedKeys.current.add(cacheKey);
        setHelp((prev) => ({
          ...prev,
          [type]: { content, loading: false, error: null, fromFallback: false },
        }));
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "No se pudo obtener ayuda de la IA. Mostramos una guía básica.";
        loadedKeys.current.add(cacheKey);
        setHelp((prev) => ({
          ...prev,
          [type]: {
            content: getStaticDiagnosticoHelp(pregunta, type),
            loading: false,
            error: message,
            fromFallback: true,
          },
        }));
      }
    },
    [pregunta, user]
  );

  useEffect(() => {
    if (user) void loadHelp(tab);
  }, [tab, pregunta.id, user, loadHelp]);

  function renderTabContent(type: DiagnosticoHelpType) {
    const state = help[type];

    if (!user) {
      return (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {getStaticDiagnosticoHelp(pregunta, type)}
        </p>
      );
    }

    if (state.loading) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Consultando asistente IA…
        </div>
      );
    }

    if (!state.content) return null;

    return (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {state.content}
        </p>
        {state.error && state.fromFallback && (
          <p className="text-xs text-amber-600 dark:text-amber-400">{state.error}</p>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          onClick={() => {
            loadedKeys.current.delete(`${pregunta.id}-${type}`);
            void loadHelp(type, true);
          }}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Actualizar respuesta
        </Button>
      </>
    );
  }

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
      {!compact && (
        <p className="text-sm font-medium flex items-center gap-2 mb-3">
          <Bot className="h-4 w-4 text-primary" />
          Asistente IA
        </p>
      )}
      <Tabs value={tab} onValueChange={(value) => setTab(value as DiagnosticoHelpType)}>
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="significado" className="text-xs gap-1">
            <Scale className="h-3 w-3" />
            ¿Qué significa?
          </TabsTrigger>
          <TabsTrigger value="evaluacion" className="text-xs gap-1">
            <Lightbulb className="h-3 w-3" />
            ¿Cómo evaluarlo?
          </TabsTrigger>
        </TabsList>

        {(["significado", "evaluacion"] as const).map((type) => (
          <TabsContent key={type} value={type} className="mt-3 space-y-2">
            {renderTabContent(type)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
