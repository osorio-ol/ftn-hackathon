import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type OAuthButtonsProps = {
  onOAuthSuccess?: (email: string, name: string) => void;
};

export function OAuthButtons({ onOAuthSuccess }: OAuthButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleOAuth = async (provider: "google" | "microsoft") => {
    setLoading(provider);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/oauth/${provider}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.info(data.detail ?? `OAuth con ${provider} próximamente`, {
          description: "Por ahora usa correo y contraseña.",
        });
        return;
      }
      const data = await res.json();
      onOAuthSuccess?.(data.email, data.name);
    } catch {
      toast.error("No se pudo conectar con el proveedor OAuth");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative py-1">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
          o continúa con
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(["google", "microsoft"] as const).map((provider) => (
          <Button
            key={provider}
            type="button"
            variant="outline"
            disabled={!!loading}
            onClick={() => handleOAuth(provider)}
            className="rounded-xl h-10 capitalize"
          >
            {loading === provider ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              provider
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
