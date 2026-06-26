import { Building2, Info, Shield, UserCog } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type RoleNoticeProps = {
  variant: "login" | "register";
};

export function RoleNotice({ variant }: RoleNoticeProps) {
  if (variant === "register") {
    return (
      <Alert className="border-primary/20 bg-primary/5">
        <Building2 className="h-4 w-4 text-primary" />
        <AlertDescription className="text-xs leading-relaxed text-muted-foreground ml-2">
          <strong className="text-foreground">Registro solo para empresas.</strong> Al crear tu cuenta
          obtendrás un perfil <span className="font-medium text-primary">Empresa</span> con acceso al
          autodiagnóstico. Los perfiles de{" "}
          <span className="font-medium">Administrador</span> y <span className="font-medium">Auditor</span>{" "}
          los asigna un administrador de la plataforma.
        </AlertDescription>
      </Alert>
    );
  }
}

export function CompanyBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
      <Shield className="h-3.5 w-3.5" />
      Cuenta tipo Empresa
    </span>
  );
}
