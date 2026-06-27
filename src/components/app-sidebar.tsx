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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">CAVALTEC</span>
            <span className="text-xs text-muted-foreground">Ley 1581</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = icons[item.title as keyof typeof icons] ?? LayoutDashboard;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={path === item.url || path.startsWith(`${item.url}/`)}>
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
      <SidebarFooter>
        <div className="flex flex-col gap-2 px-2 pb-2">
          {user && (
            <div className="rounded-md border bg-muted/40 px-2 py-1.5 text-xs space-y-1">
              <div className="font-medium truncate">{user.name}</div>
              {user.company_name && (
                <div className="text-muted-foreground truncate">{user.company_name}</div>
              )}
              <Badge variant="outline" className="capitalize text-[10px]">
                {roleLabel(user.role)}
              </Badge>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={logout} className="justify-start">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
