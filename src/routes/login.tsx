import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { AuthLayout } from "@/components/auth/auth-layout";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { RoleNotice } from "@/components/auth/role-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const schema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(4, "Mínimo 4 caracteres"),
});
type FormValues = z.infer<typeof schema>;

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  if (user) return null;

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await login(values.email, values.password);
      toast.success("¡Bienvenido a CAVALTEC!");
      navigate({ to: "/dashboard", replace: true });
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Error de autenticación");
    }
  };

  return (
    <AuthLayout
      variant="login"
      title="Inicia sesión"
      subtitle="Ingresa con tu cuenta de empresa, administrador o auditor"
      footer={
        <span>
          ¿Tu empresa aún no está registrada?{" "}
          <Link to="/registro" className="text-primary font-semibold hover:underline">
            Crear cuenta empresa
          </Link>
        </span>
      }
    >
      <RoleNotice variant="login" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitError && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="tu@empresa.com"
              className="pl-10 h-11 rounded-xl"
              {...register("email")}
            />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="pl-10 h-11 rounded-xl"
              {...register("password")}
            />
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          <div className="text-right">
            <Link to="/recuperar-clave" className="text-xs text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full h-11 rounded-xl text-base" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="mr-2 h-4 w-4" />
          )}
          Ingresar
        </Button>
      </form>

      <OAuthButtons />
    </AuthLayout>
  );
}
