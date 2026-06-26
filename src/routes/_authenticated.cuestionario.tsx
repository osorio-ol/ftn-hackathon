import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { preguntasLey1581 } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/cuestionario")({
  component: CuestionarioPage,
});

const schema = z.object({
  empresa: z.string().trim().min(2, "Empresa requerida"),
  responsable: z.string().trim().min(2, "Responsable requerido"),
  respuestas: z
    .array(z.enum(["si", "no", "parcial"], { errorMap: () => ({ message: "Responde esta pregunta" }) }))
    .length(preguntasLey1581.length),
});
type FormValues = z.infer<typeof schema>;

function CuestionarioPage() {
  const [resultado, setResultado] = useState<{ puntaje: number; estado: string } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      empresa: "",
      responsable: "",
      respuestas: Array(preguntasLey1581.length).fill(undefined) as any,
    },
  });

  const onSubmit = async (values: FormValues) => {
    await new Promise((r) => setTimeout(r, 700));
    const score = values.respuestas.reduce(
      (acc, r) => acc + (r === "si" ? 100 : r === "parcial" ? 50 : 0),
      0
    );
    const puntaje = Math.round(score / values.respuestas.length);
    const estado = puntaje >= 80 ? "Cumple" : puntaje >= 60 ? "Parcial" : "No cumple";
    setResultado({ puntaje, estado });
    toast.success("Cuestionario enviado correctamente");
  };

  if (resultado) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <CardTitle>Resultado del autodiagnóstico</CardTitle>
          </div>
          <CardDescription>Nivel de cumplimiento estimado de la Ley 1581</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Puntaje</span>
              <span className="font-semibold">{resultado.puntaje}%</span>
            </div>
            <Progress value={resultado.puntaje} />
          </div>
          <Alert>
            <AlertTitle>Estado: {resultado.estado}</AlertTitle>
            <AlertDescription>
              {resultado.estado === "Cumple"
                ? "La organización mantiene un alto nivel de cumplimiento."
                : resultado.estado === "Parcial"
                ? "Existen brechas que deben ser atendidas en un plan de mejora."
                : "Se requiere implementar de inmediato políticas y controles."}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => {
              setResultado(null);
              reset();
            }}
          >
            Nuevo cuestionario
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="empresa">Empresa</Label>
            <Input id="empresa" {...register("empresa")} />
            {errors.empresa && <p className="text-xs text-destructive">{errors.empresa.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsable">Responsable</Label>
            <Input id="responsable" {...register("responsable")} />
            {errors.responsable && (
              <p className="text-xs text-destructive">{errors.responsable.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cuestionario (11 preguntas)</CardTitle>
          <CardDescription>Responde según el estado actual de la organización.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {preguntasLey1581.map((pregunta, idx) => (
            <div key={idx} className="space-y-2 border-b pb-4 last:border-0">
              <p className="text-sm font-medium">
                {idx + 1}. {pregunta}
              </p>
              <Controller
                control={control}
                name={`respuestas.${idx}` as const}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-6"
                  >
                    {[
                      { v: "si", l: "Sí" },
                      { v: "parcial", l: "Parcial" },
                      { v: "no", l: "No" },
                    ].map((opt) => (
                      <div key={opt.v} className="flex items-center gap-2">
                        <RadioGroupItem id={`q${idx}-${opt.v}`} value={opt.v} />
                        <Label htmlFor={`q${idx}-${opt.v}`} className="text-sm font-normal">
                          {opt.l}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              />
              {errors.respuestas?.[idx] && (
                <p className="text-xs text-destructive">{errors.respuestas[idx]?.message as string}</p>
              )}
            </div>
          ))}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar cuestionario
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}