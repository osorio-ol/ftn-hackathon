import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Contenedor de página con espaciado cómodo; el scroll lo maneja el layout principal */
export function AppViewport({ children, className }: Props) {
  return <div className={cn("app-page-content", className)}>{children}</div>;
}
