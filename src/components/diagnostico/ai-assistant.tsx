import { useCallback, useEffect, useState } from "react";
import { Bot, Lightbulb, Loader2, RefreshCw, Scale } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  getCachedDiagnosticoHelp,
  getDiagnosticoHelp,
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
  upgrading: boolean;
  error: string | null;
  fromFallback: boolean;
};

function buildInitialHelpState(
  pregunta: PreguntaDiagnostico,
  type: DiagnosticoHelpType,
  user: ReturnType<typeof useAuth>["user"]
): HelpState {
  if (!user) {
    return {
      content: getStaticDiagnosticoHelp(pregunta, type),
      loading: false,
      upgrading: false,
      error: null,
      fromFallback: true,
    };
  }

  const cached = getCachedDiagnosticoHelp(pregunta.id, type);
  if (cached) {
    return {
      content: cached,
      loading: false,
      upgrading: false,
      error: null,
      fromFallback: false,
    };
  }

  return {
    content: getStaticDiagnosticoHelp(pregunta, type),
    loading: true,
    upgrading: true,
    error: null,
    fromFallback: true,
  };
}

export function AiAssistant({ pregunta, compact }: AiAssistantProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<DiagnosticoHelpType>("significado");
  const [help, setHelp] = useState<Record<DiagnosticoHelpType, HelpState>>(() => ({
    significado: buildInitialHelpState(pregunta, "significado", user),
    evaluacion: buildInitialHelpState(pregunta, "evaluacion", user),
  }));

  const loadHelp = useCallback(
    async (type: DiagnosticoHelpType, force = false) => {
      if (!user) return;

      const cached = !force ? getCachedDiagnosticoHelp(pregunta.id, type) : null;
      if (cached) {
        setHelp((prev) => ({
          ...prev,
          [type]: {
            content: cached,
            loading: false,
            upgrading: false,
            error: null,
            fromFallback: false,
          },
        }));
        return;
      }

      setHelp((prev) => ({
        ...prev,
        [type]: {
          content: prev[type].content ?? getStaticDiagnosticoHelp(pregunta, type),
          loading: true,
          upgrading: true,
          error: null,
          fromFallback: prev[type].fromFallback,
        },
      }));

      try {
        const { content, fromCache } = await getDiagnosticoHelp(pregunta, type, user, { force });
        setHelp((prev) => ({
          ...prev,
          [type]: {
            content,
            loading: false,
            upgrading: false,
            error: null,
            fromFallback: false,
          },
        }));
        if (fromCache) return;
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "No se pudo obtener ayuda de la IA. Mostramos una guía básica.";
        setHelp((prev) => ({
          ...prev,
          [type]: {
            content: getStaticDiagnosticoHelp(pregunta, type),
            loading: false,
            upgrading: false,
            error: message,
            fromFallback: true,
          },
        }));
      }
    },
    [pregunta, user]
  );

  useEffect(() => {
    setTab("significado");
    setHelp({
      significado: buildInitialHelpState(pregunta, "significado", user),
      evaluacion: buildInitialHelpState(pregunta, "evaluacion", user),
    });

    if (!user) return;
    void loadHelp("significado");
    void loadHelp("evaluacion");
  }, [pregunta.id, user, loadHelp]);

  function renderTabContent(type: DiagnosticoHelpType) {
    const state = help[type];

    if (!state.content) return null;

    return (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {state.content}
        </p>
        {state.upgrading && state.loading && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            Mejorando respuesta con IA…
          </p>
        )}
        {state.error && state.fromFallback && !state.loading && (
          <p className="text-xs text-amber-600 dark:text-amber-400">{state.error}</p>
        )}
        {user && !state.loading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => void loadHelp(type, true)}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Actualizar respuesta
          </Button>
        )}
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
