import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AiChatWidget } from "@/components/chat/ai-chat-widget";
import { useAuth } from "@/lib/auth";
import { canAccessRoute, roleLabel } from "@/lib/permissions";
import { Loader2 } from "lucide-react";

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

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/20">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center gap-3 border-b bg-background px-4">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold">
              {Object.entries(titles).find(([k]) => pathname === k || pathname.startsWith(`${k}/`))?.[1] ??
                "CAVALTEC"}
            </h1>
            <div className="ml-auto text-xs text-muted-foreground hidden sm:block">
              {user.company_name ? `${user.company_name} · ` : ""}
              {user.email} · {roleLabel(user.role)}
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <AiChatWidget />
    </SidebarProvider>
  );
}
