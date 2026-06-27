import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  Lock,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { AuthLayout } from "@/components/auth/auth-layout";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { CompanyBadge, RoleNotice } from "@/components/auth/role-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/registro")({
  component: RegistroPage,
});

const schema = z
  .object({
    company_name: z.string().trim().min(2, "Nombre de empresa requerido"),
    nit: z.string().trim().min(5, "NIT inválido"),
    sector: z.string().trim().min(2, "Sector requerido"),
    size: z.enum(["pequena", "mediana", "grande"], { required_error: "Selecciona el tamaño" }),
    contact_name: z.string().trim().min(2, "Nombre del responsable requerido"),
    email: z.string().email("Correo inválido"),
    password: z.string().min(5, "Mínimo 5 caracteres"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirm_password"],
  });

type FormValues = z.infer<typeof schema>;

const sectores = [
  "Tecnología",
  "Salud",
  "Financiero",
  "Retail",
  "Educación",
  "Manufactura",
  "Servicios",
  "Otro",
];

const steps = [
  { id: 1, label: "Empresa", icon: Building2 },
  { id: 2, label: "Tu cuenta", icon: User },
];

function RegistroPage() {
  const { register: registerUser, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      company_name: "",
      nit: "",
      sector: "",
      size: undefined,
      contact_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const values = watch();

  if (user) {
    navigate({ to: "/dashboard", replace: true });
    return null;
  }

  const goStep2 = async () => {
    const ok = await trigger(["company_name", "nit", "sector", "size"]);
    if (ok) setStep(2);
  };

  const onSubmit = async (formValues: FormValues) => {
    setSubmitError(null);
    try {
      await registerUser({
        company_name: formValues.company_name,
        nit: formValues.nit,
        sector: formValues.sector,
        size: formValues.size,
        contact_name: formValues.contact_name,
        email: formValues.email,
        password: formValues.password,
      });
      toast.success("¡Empresa registrada! Ya puedes iniciar tu autodiagnóstico.");
      navigate({ to: "/cuestionario", replace: true });
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Error en el registro");
    }
  };

  return (
    <AuthLayout
      variant="register"
      title="Registra tu empresa"
      subtitle="Crea una cuenta tipo Empresa y accede al autodiagnóstico Ley 1581"
      footer={
        <span>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Iniciar sesión
          </Link>
        </span>
      }
    >
      <div className="flex items-center justify-between gap-2">
        <CompanyBadge />
        <span className="text-xs text-muted-foreground">Paso {step} de 2</span>
      </div>

      <Progress value={(step / 2) * 100} className="h-1.5" />

      <div className="flex gap-2">
        {steps.map((s) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div
              key={s.id}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition-colors",
                active && "border-primary bg-primary/5 text-primary",
                done && "border-green-300 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
                !active && !done && "text-muted-foreground"
              )}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              {s.label}
            </div>
          );
        })}
      </div>

      <RoleNotice variant="register" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitError && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="space-y-1.5">
              <Label htmlFor="company_name">Nombre de la empresa</Label>
              <Input
                id="company_name"
                placeholder="Mi Empresa SAS"
                className="h-11 rounded-xl"
                {...register("company_name")}
              />
              {errors.company_name && (
                <p className="text-xs text-destructive">{errors.company_name.message}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nit">NIT</Label>
                <Input id="nit" placeholder="900123456-1" className="h-11 rounded-xl" {...register("nit")} />
                {errors.nit && <p className="text-xs text-destructive">{errors.nit.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Sector</Label>
                <Controller
                  control={control}
                  name="sector"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectores.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.sector && <p className="text-xs text-destructive">{errors.sector.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tamaño de la empresa</Label>
              <Controller
                control={control}
                name="size"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Seleccionar tamaño" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pequena">Pequeña (&lt; 50 empleados)</SelectItem>
                      <SelectItem value="mediana">Mediana (50–200 empleados)</SelectItem>
                      <SelectItem value="grande">Grande (&gt; 200 empleados)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.size && <p className="text-xs text-destructive">{errors.size.message}</p>}
            </div>
            <Button type="button" className="w-full h-11 rounded-xl" onClick={goStep2}>
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Registrando: <strong className="text-foreground">{values.company_name || "—"}</strong>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact_name">Tu nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contact_name"
                  placeholder="Ana García"
                  className="pl-10 h-11 rounded-xl"
                  {...register("contact_name")}
                />
              </div>
              {errors.contact_name && (
                <p className="text-xs text-destructive">{errors.contact_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Correo corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="contacto@empresa.com"
                  className="pl-10 h-11 rounded-xl"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-10 h-11 rounded-xl"
                    {...register("password")}
                  />
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm_password">Confirmar</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm_password"
                    type="password"
                    className="pl-10 h-11 rounded-xl"
                    {...register("confirm_password")}
                  />
                </div>
                {errors.confirm_password && (
                  <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Atrás
              </Button>
              <Button type="submit" className="flex-1 h-11 rounded-xl" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear cuenta empresa
              </Button>
            </div>
          </div>
        )}
      </form>

      {step === 1 && <OAuthButtons />}
    </AuthLayout>
  );
}
