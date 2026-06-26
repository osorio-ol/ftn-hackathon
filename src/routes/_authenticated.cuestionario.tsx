import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  calcularPuntaje,
  generarRecomendaciones,
  preguntasDiagnostico,
  type RespuestaValor,
} from "@/lib/diagnostico";
import { saveEvaluacion, downloadReporte } from "@/lib/history";
import { DiagnosticoIntro } from "@/components/diagnostico/diagnostico-intro";
import { DiagnosticoProgress } from "@/components/diagnostico/diagnostico-progress";
import { DiagnosticoResults } from "@/components/diagnostico/diagnostico-results";
import { QuestionCard } from "@/components/diagnostico/question-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/cuestionario")({
  component: CuestionarioPage,
});

const schema = z.object({
  responsable: z.string().trim().min(2, "Ingresa tu nombre"),
  respuestas: z.record(z.string(), z.enum(["si", "no"]).optional()),
});

type FormValues = z.infer<typeof schema>;
type Resultado = ReturnType<typeof calcularPuntaje> & {
  recomendaciones: string[];
  empresa: string;
  responsable: string;
  historialId: string;
};

function CuestionarioPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [iaActiva, setIaActiva] = useState(true);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const empresa = user?.company_name ?? "Empresa";
  const totalPreguntas = preguntasDiagnostico.length;
  const totalSteps = totalPreguntas + 1;

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      responsable: user?.name ?? "",
      respuestas: {},
    },
  });

  const respuestasWatch = watch("respuestas");
  const responsableWatch = watch("responsable");

  const answeredCount = useMemo(
    () => preguntasDiagnostico.filter((p) => respuestasWatch?.[String(p.id)]).length,
    [respuestasWatch]
  );

  const currentPregunta = step > 0 ? preguntasDiagnostico[step - 1] : null;

  const handleStart = () => {
    if (!responsableWatch || responsableWatch.trim().length < 2) {
      toast.error("Ingresa tu nombre para continuar");
      return;
    }
    setStep(1);
  };

  const goNext = () => {
    if (step > 0 && step <= totalPreguntas) {
      const pregunta = preguntasDiagnostico[step - 1];
      if (!respuestasWatch?.[String(pregunta.id)]) {
        toast.error("Selecciona Sí o No para continuar");
        return;
      }
    }
    if (step < totalPreguntas) {
      setStep((s) => s + 1);
    }
  };

  const goPrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleAnswer = (preguntaId: number, value: RespuestaValor) => {
    setValue(`respuestas.${preguntaId}`, value, { shouldValidate: true });
    if (step < totalPreguntas) {
      setTimeout(() => setStep((s) => (s === step ? s + 1 : s)), 350);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const sinResponder = preguntasDiagnostico.filter((p) => !values.respuestas?.[String(p.id)]);
    if (sinResponder.length > 0) {
      toast.error(`Faltan ${sinResponder.length} preguntas por responder`);
      setStep(sinResponder[0].id);
      return;
    }

    await new Promise((r) => setTimeout(r, 400));
    const map: Record<number, RespuestaValor | undefined> = {};
    for (const [k, v] of Object.entries(values.respuestas ?? {})) {
      if (v) map[Number(k)] = v;
    }
    const calc = calcularPuntaje(map);
    const recomendaciones = generarRecomendaciones(calc.brechas);
    const saved = saveEvaluacion({
      empresa,
      responsable: values.responsable,
      puntaje: calc.puntaje,
      estado: calc.estado,
      brechas: calc.brechas,
      recomendaciones,
      porBloque: { cumplimiento: calc.puntaje },
      companyId: user?.company_id,
    });
    setResultado({
      ...calc,
      recomendaciones,
      empresa,
      responsable: values.responsable,
      historialId: saved.id,
    });
    toast.success("¡Diagnóstico completado!");
  };

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
            porBloque: { cumplimiento: resultado.puntaje },
            companyId: user?.company_id,
          })
        }
        onReset={() => {
          setResultado(null);
          setStep(0);
          reset();
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto min-h-[60vh] flex flex-col">
      {step > 0 && (
        <DiagnosticoProgress
          step={step}
          totalSteps={totalSteps}
          answered={answeredCount}
          totalQuestions={totalPreguntas}
          iaActiva={iaActiva}
          onIaToggle={setIaActiva}
          label={
            currentPregunta
              ? `Pregunta ${step} de ${totalPreguntas}`
              : undefined
          }
        />
      )}

      <div className="flex-1 py-6 md:py-10">
        {step === 0 && (
          <DiagnosticoIntro
              empresa={empresa}
              responsable={responsableWatch}
              onResponsableChange={(v) => setValue("responsable", v)}
              responsableError={errors.responsable?.message}
              onStart={handleStart}
            totalPreguntas={totalPreguntas}
          />
        )}

        {currentPregunta && (
          <Controller
            control={control}
            name={`respuestas.${currentPregunta.id}`}
            render={({ field }) => (
              <QuestionCard
                pregunta={currentPregunta}
                value={field.value}
                onChange={(v) => handleAnswer(currentPregunta.id, v)}
                iaActiva={iaActiva}
                index={step - 1}
                total={totalPreguntas}
              />
            )}
          />
        )}
      </div>

      {step > 0 && (
        <div className="sticky bottom-0 -mx-4 md:-mx-6 px-4 md:px-6 py-4 bg-background/90 backdrop-blur-md border-t">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={goPrev} disabled={step <= 1} className="rounded-full">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Anterior
            </Button>

            {step < totalPreguntas ? (
              <Button type="button" onClick={goNext} className="rounded-full px-6">
                Siguiente
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="rounded-full px-6">
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
