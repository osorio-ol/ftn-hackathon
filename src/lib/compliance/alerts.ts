export type ComplianceAlert = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  frequency: "mensual" | "trimestral" | "semestral" | "anual";
  severity: "info" | "warning" | "critical";
  category: string;
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildPeriodicAlerts(lastAssessmentDate?: string): ComplianceAlert[] {
  const base = lastAssessmentDate ? new Date(lastAssessmentDate) : new Date();
  const now = new Date();

  const alerts: ComplianceAlert[] = [
    {
      id: "alert-revision-politica",
      title: "Revisión anual de política de tratamiento",
      description: "La Ley 1581 exige mantener actualizada la política de tratamiento de datos personales.",
      dueDate: isoDate(addMonths(base, 12)),
      frequency: "anual",
      severity: "warning",
      category: "Documentación",
    },
    {
      id: "alert-capacitacion",
      title: "Capacitación en protección de datos",
      description: "Programar capacitación periódica al personal que trata datos personales.",
      dueDate: isoDate(addMonths(base, 6)),
      frequency: "semestral",
      severity: "info",
      category: "Capacitación",
    },
    {
      id: "alert-registro-sic",
      title: "Verificar registro en RNBD (SIC)",
      description: "Confirmar que las bases de datos personales estén registradas ante la Superintendencia.",
      dueDate: isoDate(addMonths(base, 3)),
      frequency: "trimestral",
      severity: "critical",
      category: "Regulatorio",
    },
    {
      id: "alert-autodiagnostico",
      title: "Nuevo autodiagnóstico de cumplimiento",
      description: "Realizar evaluación periódica para medir avance en el plan de acción.",
      dueDate: isoDate(addMonths(base, 3)),
      frequency: "trimestral",
      severity: "warning",
      category: "Evaluación",
    },
    {
      id: "alert-seguimiento-reclamos",
      title: "Revisión de consultas y reclamos pendientes",
      description: "Verificar cumplimiento de plazos legales (10 días consultas, 15 días reclamos).",
      dueDate: isoDate(addMonths(now, 1)),
      frequency: "mensual",
      severity: "critical",
      category: "Atención al titular",
    },
  ];

  return alerts.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function activeAlerts(alerts: ComplianceAlert[], dismissed: string[]): ComplianceAlert[] {
  const today = isoDate(new Date());
  return alerts.filter((a) => !dismissed.includes(a.id) && a.dueDate <= addMonths(new Date(), 1).toISOString().slice(0, 10) || a.dueDate <= today || daysUntil(a.dueDate) <= 30);
}

function daysUntil(iso: string): number {
  const target = new Date(iso);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function alertDaysLabel(dueDate: string): string {
  const days = daysUntil(dueDate);
  if (days < 0) return `Vencida hace ${Math.abs(days)} días`;
  if (days === 0) return "Vence hoy";
  if (days <= 7) return `Vence en ${days} días`;
  return `Vence el ${dueDate}`;
}

export function severityColor(severity: ComplianceAlert["severity"]): string {
  switch (severity) {
    case "critical":
      return "border-red-500 bg-red-50 dark:bg-red-950/20";
    case "warning":
      return "border-amber-500 bg-amber-50 dark:bg-amber-950/20";
    default:
      return "border-blue-500 bg-blue-50 dark:bg-blue-950/20";
  }
}
