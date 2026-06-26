import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  if (user) {
    navigate({ to: "/dashboard", replace: true });
    return null;
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await login(values.email, values.password);
      toast.success("Bienvenido a CAVALTEC");
      navigate({ to: "/dashboard", replace: true });
    } catch (e: any) {
      setSubmitError(e?.message ?? "Error de autenticación");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle>CAVALTEC</CardTitle>
          <CardDescription>Autodiagnóstico Ley 1581 — Inicia sesión</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" placeholder="admin@cavaltec.co" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ingresar
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Demo: cualquier correo válido y contraseña de 4+ caracteres. Usa <code>admin@</code> para rol admin.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}