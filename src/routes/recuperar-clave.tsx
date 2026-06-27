import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { forgotPassword } from "@/lib/api/users";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/recuperar-clave")({
  component: RecuperarClavePage,
});

const schema = z.object({ email: z.string().email("Correo inválido") });
type FormValues = z.infer<typeof schema>;

function RecuperarClavePage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await forgotPassword(values.email);
      toast.success(res.message);
      setSent(true);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al enviar solicitud");
    }
  };

  return (
    <AuthLayout
      variant="login"
      title="Recuperar contraseña"
      subtitle="Te enviaremos instrucciones si el correo está registrado"
      footer={
        <Link to="/login" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" />
          Volver al inicio de sesión
        </Link>
      }
    >
      {sent ? (
        <Alert className="rounded-xl">
          <AlertDescription>
            Si el correo existe en el sistema, recibirás instrucciones para restablecer tu contraseña.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                className="pl-10 h-11 rounded-xl"
                placeholder="tu@empresa.com"
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full h-11 rounded-xl" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar instrucciones
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
