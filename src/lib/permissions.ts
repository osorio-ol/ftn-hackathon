import type { User } from "@/lib/auth";

export type Role = User["role"];

export function isCompanyUser(role: Role): boolean {
  return role === "company" || role === "evaluador";
}

const routeRoles: Record<string, Role[]> = {
  "/dashboard": ["admin", "company", "evaluador", "auditor"],
  "/cuestionario": ["admin", "company", "evaluador"],
  "/diagnosticos": ["admin", "company", "evaluador", "auditor"],
  "/empresas": ["admin", "auditor"],
  "/historial": ["admin", "company", "evaluador", "auditor"],
  "/reportes": ["admin", "company", "evaluador", "auditor"],
  "/perfil": ["admin", "company", "evaluador"],
  "/admin": ["admin"],
  "/recomendaciones": ["admin", "company", "evaluador", "auditor"],
  "/cumplimiento": ["admin", "company", "evaluador", "auditor"],
};

export function canAccessRoute(role: Role, path: string): boolean {
  const base = Object.keys(routeRoles).find((r) => path === r || path.startsWith(`${r}/`));
  if (!base) return true;
  return routeRoles[base]?.includes(role) ?? true;
}

export function navItemsForRole(role: Role) {
  const companyRoles: Role[] = ["company", "evaluador"];
  const all = [
    { title: "Dashboard", url: "/dashboard", roles: ["admin", ...companyRoles, "auditor"] as Role[] },
    { title: "Autodiagnóstico", url: "/cuestionario", roles: ["admin", ...companyRoles] as Role[] },
    { title: "Diagnósticos", url: "/diagnosticos", roles: ["admin", ...companyRoles, "auditor"] as Role[] },
    { title: "Empresas", url: "/empresas", roles: ["admin", "auditor"] as Role[] },
    { title: "Historial", url: "/historial", roles: ["admin", ...companyRoles, "auditor"] as Role[] },
    { title: "Reportes", url: "/reportes", roles: ["admin", ...companyRoles, "auditor"] as Role[] },
    { title: "Perfil empresa", url: "/perfil", roles: ["admin", ...companyRoles] as Role[] },
    { title: "Administración", url: "/admin", roles: ["admin"] as Role[] },
  ];
  return all.filter((item) => item.roles.includes(role));
}

export function roleLabel(role: Role): string {
  if (role === "company" || role === "evaluador") return "Empresa";
  if (role === "auditor") return "Auditor";
  if (role === "admin") return "Administrador";
  return role;
}

