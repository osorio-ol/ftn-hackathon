import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/oauth/callback")({
  component: OAuthCallbackPage,
  validateSearch: (search: Record<string, unknown>) => ({
    access_token: typeof search.access_token === "string" ? search.access_token : undefined,
    expires_in:
      typeof search.expires_in === "string"
        ? Number(search.expires_in)
        : typeof search.expires_in === "number"
          ? search.expires_in
          : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
});

function OAuthCallbackPage() {
  const { access_token, expires_in, error } = Route.useSearch();
  const { completeOAuthLogin } = useAuth();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (error) {
      setFailed(true);
      toast.error(decodeURIComponent(error));
      return;
    }
    if (!access_token) {
      setFailed(true);
      toast.error("No se recibió el token de Google.");
      return;
    }

    void completeOAuthLogin(access_token, expires_in ?? 86400)
      .then(() => {
        toast.success("¡Sesión iniciada con Google!");
        navigate({ to: "/dashboard", replace: true });
      })
      .catch((err: unknown) => {
        setFailed(true);
        toast.error(err instanceof Error ? err.message : "Error al completar el inicio de sesión");
      });
  }, [access_token, completeOAuthLogin, error, expires_in, navigate]);

  if (failed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 app-shell-bg">
        <p className="text-sm text-muted-foreground">No se pudo iniciar sesión con Google.</p>
        <Button asChild>
          <Link to="/login">Volver al login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 app-shell-bg">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <ShieldCheck className="h-6 w-6 animate-pulse" />
      </div>
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Completando inicio de sesión con Google…</p>
    </div>
  );
}
