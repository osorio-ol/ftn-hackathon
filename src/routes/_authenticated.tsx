import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AiChatWidget } from "@/components/chat/ai-chat-widget";
import { useAuth } from "@/lib/auth";
import { warmDiagnosticoHelpCache } from "@/lib/api/diagnostico-help";
import { canAccessRoute, roleLabel } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

const titles: Record<string, string> = {
  "/dashboard": "Dashboard ejecutivo",
  "/empresas": "Empresas",
  "/cuestionario": "Autodiagnóstico Ley 1581",
  "/diagnosticos": "Diagnósticos",
  "/historial": "Historial de evaluaciones",
  "/reportes": "Reportes",
  "/perfil": "Perfil de empresa",
  "/admin": "Administración",
  "/recomendaciones": "Recomendaciones IA",
  "/cumplimiento": "Centro de cumplimiento",
};

function AuthLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user && !canAccessRoute(user.role, pathname)) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, pathname, navigate]);

  useEffect(() => {
    if (user) warmDiagnosticoHelpCache(user);
  }, [user?.id]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 app-shell-bg">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6 animate-pulse" />
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Cargando CAVALTEC…</p>
      </div>
    );
  }

  const pageTitle =
    Object.entries(titles).find(([k]) => pathname === k || pathname.startsWith(`${k}/`))?.[1] ??
    "CAVALTEC";

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden app-shell-bg">
        <AppSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="z-30 flex h-11 shrink-0 items-center gap-2 border-b border-border/80 bg-background/85 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
            <SidebarTrigger className="-ml-1" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-semibold tracking-tight">{pageTitle}</h1>
              {user.company_name && (
                <p className="truncate text-[11px] text-muted-foreground sm:hidden">
                  {user.company_name}
                </p>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {user.company_name && (
                <span className="max-w-[180px] truncate text-xs text-muted-foreground">
                  {user.company_name}
                </span>
              )}
              <Badge variant="secondary" className="font-normal text-[10px] capitalize">
                {roleLabel(user.role)}
              </Badge>
            </div>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              title={user.email}
            >
              {initials}
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 md:p-4 lg:p-5">
            <Outlet />
          </main>
        </div>
      </div>
      <AiChatWidget />
    </SidebarProvider>
  );
}
