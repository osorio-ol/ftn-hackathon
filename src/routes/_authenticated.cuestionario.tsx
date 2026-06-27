import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import {
  clearRespuestasDependientes,
  getPreguntasActivas,
  preguntasDiagnostico,
  type RespuestaValor,
} from "@/lib/diagnostico";
import { saveEvaluacion, downloadReporte } from "@/lib/history";
import {
  submitDiagnosticoFlow,
  type DiagnosticoFlowResult,
  type DiagnosticoPhase,
} from "@/lib/services/diagnostico-flow";
import { DiagnosticoIntro } from "@/components/diagnostico/diagnostico-intro";
import { DiagnosticoLoading } from "@/components/diagnostico/diagnostico-loading";
import { DiagnosticoProgress } from "@/components/diagnostico/diagnostico-progress";
import { DiagnosticoResults } from "@/components/diagnostico/diagnostico-results";
import { QuestionCard } from "@/components/diagnostico/question-card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const TOTAL_PREGUNTAS_MODELO = preguntasDiagnostico.length;

export const Route = createFileRoute("/_authenticated/cuestionario")({
  component: CuestionarioPage,
});

const schema = z.object({
  responsable: z.string().trim().min(2, "Ingresa tu nombre"),
});

type FormValues = z.infer<typeof schema>;

function CuestionarioPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<number, RespuestaValor>>({});
  const [iaActiva, setIaActiva] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState<DiagnosticoPhase | null>(null);
  const [resultado, setResultado] = useState<
    (DiagnosticoFlowResult & { historialId: string; empresa: string; responsable: string }) | null
  >(null);

  const empresa = user?.company_name ?? "Empresa";

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      responsable: user?.name ?? "",
    },
  });

  const responsableWatch = watch("responsable");

  const respuestasMap = respuestas;

  const preguntasActivas = useMemo(
    () => getPreguntasActivas(respuestasMap),
    [respuestasMap]
  );

  const totalPreguntas = preguntasActivas.length;

  const answeredCount = useMemo(
    () => preguntasActivas.filter((p) => respuestasMap[p.id]).length,
    [preguntasActivas, respuestasMap]
  );

  const currentPregunta = step > 0 && step <= totalPreguntas ? preguntasActivas[step - 1] : null;

  /** Evita pantalla vacía si el flujo se acorta (p. ej. P1 = No). */
  useEffect(() => {
    if (step > 0 && totalPreguntas > 0 && step > totalPreguntas) {
      setStep(totalPreguntas);
    }
  }, [step, totalPreguntas]);

  const handleStart = () => {
    if (!responsableWatch || responsableWatch.trim().length < 2) {
      toast.error("Ingresa tu nombre para continuar");
      return;
    }
    setStep(1);
  };

  const goNext = () => {
    if (step > 0 && step <= totalPreguntas) {
      const pregunta = preguntasActivas[step - 1];
      if (!respuestasMap[pregunta.id]) {
        toast.error("Selecciona Sí o No para continuar");
        return;
      }
    }
    if (step < totalPreguntas) setStep((s) => s + 1);
  };

  const goPrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleAnswer = (preguntaId: number, value: RespuestaValor) => {
    const updated = clearRespuestasDependientes(respuestasMap, preguntaId, value);
    setRespuestas(updated);

    if (preguntaId === 1 && value === "no") {
      toast.info("Sin política de datos", {
        description:
          "Según la metodología, no se aplican las preguntas 2 a 5. Continuarás con privacidad y gobernanza.",
      });
    }

    const activeAfter = getPreguntasActivas(updated);
    const currentIdx = activeAfter.findIndex((p) => p.id === preguntaId);

    setTimeout(() => {
      if (preguntaId === 1 && value === "no") {
        const q6Idx = activeAfter.findIndex((p) => p.id === 6);
        setStep(q6Idx >= 0 ? q6Idx + 1 : 1);
        return;
      }
      if (preguntaId === 10 && value === "no" && step > activeAfter.length) {
        setStep(activeAfter.length);
        return;
      }
      const nextStep = currentIdx + 2;
      if (currentIdx >= 0 && currentIdx < activeAfter.length - 1) {
        setStep(nextStep);
      } else if (step > activeAfter.length) {
        setStep(Math.max(1, activeAfter.length));
      }
    }, 350);
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error("Debes iniciar sesión para guardar el diagnóstico");
      return;
    }

    const activas = getPreguntasActivas(respuestas);
    const sinResponder = activas.filter((p) => !respuestas[p.id]);
    if (sinResponder.length > 0) {
      toast.error(`Faltan ${sinResponder.length} preguntas por responder`);
      const idx = activas.findIndex((p) => p.id === sinResponder[0].id);
      setStep(idx + 1);
      return;
    }

    setLoadingPhase("saving");
    try {
      const flowResult = await submitDiagnosticoFlow({
        user,
        responsable: values.responsable,
        respuestas,
        onPhaseChange: setLoadingPhase,
      });

      const saved = saveEvaluacion({
        empresa,
        responsable: values.responsable,
        puntaje: flowResult.puntaje,
        estado: flowResult.estado,
        brechas: flowResult.brechas,
        recomendaciones: flowResult.recomendaciones,
        porBloque: {
          politica: flowResult.porBloque.politica,
          privacidad: flowResult.porBloque.privacidad,
          gobernanza: flowResult.porBloque.gobernanza,
        },
        companyId: user.company_id,
        assessmentId: flowResult.assessmentId,
        aiReport: flowResult.aiReport ?? undefined,
      });

      setResultado({
        ...flowResult,
        empresa,
        responsable: values.responsable,
        historialId: saved.id,
      });

      if (flowResult.aiError) {
        toast.warning("Diagnóstico guardado", { description: flowResult.aiError });
      } else {
        toast.success("¡Diagnóstico completado con recomendaciones IA!");
      }
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Ocurrió un error al procesar tu diagnóstico.";
      toast.error(msg);
    } finally {
      setLoadingPhase(null);
    }
  };

  if (loadingPhase) {
    return <DiagnosticoLoading phase={loadingPhase} />;
  }

  if (resultado) {
    return (
      <DiagnosticoResults
        empresa={resultado.empresa}
        responsable={resultado.responsable}
        puntaje={resultado.puntaje}
        estado={resultado.estado}
        respuestasSi={resultado.respuestasSi}
        totalPreguntas={resultado.totalPreguntas}
        brechas={resultado.brechas}
        recomendaciones={resultado.recomendaciones}
        porBloque={resultado.porBloque}
        aiReport={resultado.aiReport}
        aiError={resultado.aiError}
        onDownload={() =>
          downloadReporte({
            id: resultado.historialId,
            empresa: resultado.empresa,
            responsable: resultado.responsable,
            fecha: new Date().toISOString(),
            puntaje: resultado.puntaje,
            estado: resultado.estado,
            brechas: resultado.brechas,
            recomendaciones: resultado.recomendaciones,
            porBloque: {
              politica: resultado.porBloque.politica,
              privacidad: resultado.porBloque.privacidad,
              gobernanza: resultado.porBloque.gobernanza,
            },
            companyId: user?.company_id,
            assessmentId: resultado.assessmentId,
            aiReport: resultado.aiReport ?? undefined,
          })
        }
        onReset={() => {
          setResultado(null);
          setStep(0);
          setRespuestas({});
          reset();
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto min-h-[60vh] flex flex-col">
      {step === 0 && (
        <div className="mb-2 text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Autodiagnóstico</p>
          <h1 className="mt-1 text-lg font-bold tracking-tight">Ley 1581 de 2012</h1>
        </div>
      )}
      {step > 0 && (
        <DiagnosticoProgress
          step={step}
          answered={answeredCount}
          totalQuestions={totalPreguntas}
          maxQuestions={TOTAL_PREGUNTAS_MODELO}
          iaActiva={iaActiva}
          onIaToggle={setIaActiva}
          label={
            currentPregunta
              ? `Pregunta ${step} de ${totalPreguntas} aplicables (${TOTAL_PREGUNTAS_MODELO} en el modelo)`
              : `Pregunta ${Math.min(step, totalPreguntas)} de ${totalPreguntas}`
          }
        />
      )}

      {step > 0 && respuestasMap[1] === "no" && currentPregunta?.id === 6 && (
        <Alert className="mb-4 border-primary/20 bg-primary/5">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Respondiste <strong>No</strong> a tener política de datos. Las preguntas 2 a 5 no aplican y el
            bloque de política queda en 0%.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex-1 py-6 md:py-10">
        {step === 0 && (
          <DiagnosticoIntro
            empresa={empresa}
            responsable={responsableWatch}
            onResponsableChange={(v) => setValue("responsable", v)}
            responsableError={errors.responsable?.message}
            onStart={handleStart}
          />
        )}

        {currentPregunta && (
          <QuestionCard
            pregunta={currentPregunta}
            value={respuestas[currentPregunta.id]}
            onChange={(v) => handleAnswer(currentPregunta.id, v)}
            iaActiva={iaActiva}
            index={step - 1}
            total={totalPreguntas}
            showSkipHint={currentPregunta.id === 1}
          />
        )}
      </div>

      {step > 0 && (
        <div className="sticky bottom-0 -mx-4 md:-mx-6 px-4 md:px-6 py-4 bg-background/90 backdrop-blur-md border-t border-border/80">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={goPrev} disabled={step <= 1} className="rounded-lg">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Anterior
            </Button>

            {step < totalPreguntas ? (
              <Button type="button" onClick={goNext} className="rounded-lg px-6 shadow-sm">
                Siguiente
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting || !!loadingPhase} className="rounded-lg px-6 shadow-sm">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ver mi resultado
              </Button>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
