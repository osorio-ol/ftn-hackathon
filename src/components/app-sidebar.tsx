import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  FileBarChart2,
  History,
  LogOut,
  ShieldCheck,
  UserCircle,
  Settings,
  ListChecks,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { navItemsForRole, roleLabel } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const icons = {
  Dashboard: LayoutDashboard,
  Empresas: Building2,
  Autodiagnóstico: ClipboardList,
  Diagnósticos: ListChecks,
  Historial: History,
  Reportes: FileBarChart2,
  "Perfil empresa": UserCircle,
  Administración: Settings,
} as const;

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const items = user ? navItemsForRole(user.role) : [];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/80">
      <SidebarHeader className="border-b border-sidebar-border/60">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight">CAVALTEC</span>
            <span className="text-[11px] text-muted-foreground">Ley 1581 · Datos personales</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = icons[item.title as keyof typeof icons] ?? LayoutDashboard;
                const active = path === item.url || path.startsWith(`${item.url}/`);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} className="rounded-lg">
                      <Link to={item.url} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60">
        <div className="flex flex-col gap-2 px-2 py-3">
          {user && (
            <div className="rounded-xl border border-sidebar-border/80 bg-sidebar-accent/50 px-3 py-2.5 text-xs space-y-1.5 group-data-[collapsible=icon]:hidden">
              <div className="font-semibold truncate">{user.name}</div>
              {user.company_name && (
                <div className="text-muted-foreground truncate">{user.company_name}</div>
              )}
              <Badge variant="outline" className="capitalize text-[10px] font-normal">
                {roleLabel(user.role)}
              </Badge>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="justify-start text-muted-foreground hover:text-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span className="group-data-[collapsible=icon]:hidden">Cerrar sesión</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
