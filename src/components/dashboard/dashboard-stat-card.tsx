import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "danger";
  onClick: () => void;
};

const accentStyles = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export function DashboardStatCard({
  label,
  value,
  description,
  icon: Icon,
  accent = "primary",
  onClick,
}: Props) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "stat-card group cursor-pointer shadow-sm transition-all duration-200",
        "hover:shadow-md hover:border-primary/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      )}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            accentStyles[accent]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">{description}</p>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </CardContent>
    </Card>
  );
}
