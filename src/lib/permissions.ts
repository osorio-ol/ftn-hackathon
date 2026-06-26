import type { User } from "@/lib/auth";

export type Role = User["role"];

/** Usuarios de empresa (registro o rol legacy evaluador) */
export function isCompanyUser(role: Role): boolean {
  return role === "company" || role === "evaluador";
}

const routeRoles: Record<string, Role[]> = {
  "/dashboard": ["admin", "company", "evaluador", "auditor"],
  "/cuestionario": ["admin", "company", "evaluador"],
  "/empresas": ["admin", "auditor"],
  "/historial": ["admin", "company", "evaluador", "auditor"],
  "/reportes": ["admin", "company", "evaluador", "auditor"],
};

export function canAccessRoute(role: Role, path: string): boolean {
  const allowed = routeRoles[path];
  return allowed ? allowed.includes(role) : true;
}

export function navItemsForRole(role: Role) {
  const companyRoles: Role[] = ["company", "evaluador"];
  const all = [
    { title: "Dashboard", url: "/dashboard", roles: ["admin", ...companyRoles, "auditor"] as Role[] },
    { title: "Autodiagnóstico", url: "/cuestionario", roles: ["admin", ...companyRoles] as Role[] },
    { title: "Empresas", url: "/empresas", roles: ["admin", "auditor"] as Role[] },
    { title: "Historial", url: "/historial", roles: ["admin", ...companyRoles, "auditor"] as Role[] },
    { title: "Reportes", url: "/reportes", roles: ["admin", ...companyRoles, "auditor"] as Role[] },
  ];
  return all.filter((item) => item.roles.includes(role));
}

export function roleLabel(role: Role): string {
  if (role === "company" || role === "evaluador") return "Empresa";
  return role;
}
