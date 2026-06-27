import { ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthLayoutProps = {
  variant: "login" | "register";
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

const features = [
  "Autodiagnóstico Ley 1581 en minutos",
  "Resultado con porcentaje de cumplimiento",
  "Recomendaciones y plan de mejora con IA",
  "Reportes descargables e historial",
];

export function AuthLayout({ variant, title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary via-primary/95 to-[oklch(0.38_0.1_195)] text-primary-foreground p-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">CAVALTEC</p>
            <p className="text-xs text-primary-foreground/80">Protección de datos · Ley 1581</p>
          </div>
        </div>

        <div className="relative space-y-6 max-w-md">
          <h1 className="text-3xl font-bold leading-tight">
            {variant === "register"
              ? "Evalúa el cumplimiento de tu empresa"
              : "Bienvenido de nuevo"}
          </h1>
          <p className="text-primary-foreground/85 text-sm leading-relaxed">
            Plataforma de autodiagnóstico para organizaciones que quieren conocer y mejorar su
            nivel de cumplimiento en protección de datos personales.
          </p>
          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          Empresa retadora CAVALTEC · Hackathon Ley 1581
        </p>
      </div>

      <div className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12 bg-gradient-to-b from-background to-muted/20">
        <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">CAVALTEC</span>
        </div>

        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="space-y-1 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className={cn("rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-sm space-y-5")}>
            {children}
          </div>

          {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
