export type ActionPriority = "critica" | "alta" | "media" | "baja";
export type ActionStatus = "pendiente" | "en_progreso" | "completada";

export type ActionItem = {
  id: string;
  title: string;
  description: string;
  priority: ActionPriority;
  impact: number;
  urgency: number;
  sortScore: number;
  category: string;
};

const PRIORITY_ORDER: Record<ActionPriority, number> = {
  critica: 4,
  alta: 3,
  media: 2,
  baja: 1,
};

function parsePriority(text: string): ActionPriority {
  const lower = text.toLowerCase();
  if (lower.includes("crít") || lower.includes("crit") || lower.includes("[alta]")) return "alta";
  if (lower.includes("urgent") || lower.includes("inmediat")) return "critica";
  if (lower.includes("[media]") || lower.includes("medio")) return "media";
  if (lower.includes("[baja]")) return "baja";
  return "media";
}

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("política") || lower.includes("politica")) return "Documentación";
  if (lower.includes("autoriz")) return "Autorización";
  if (lower.includes("capacit")) return "Capacitación";
  if (lower.includes("seguridad")) return "Seguridad";
  if (lower.includes("registro") || lower.includes("sic")) return "Regulatorio";
  if (lower.includes("consulta") || lower.includes("reclamo")) return "Atención al titular";
  return "Cumplimiento general";
}

function impactUrgency(priority: ActionPriority): { impact: number; urgency: number } {
  switch (priority) {
    case "critica":
      return { impact: 5, urgency: 5 };
    case "alta":
      return { impact: 5, urgency: 4 };
    case "media":
      return { impact: 3, urgency: 3 };
    default:
      return { impact: 2, urgency: 2 };
  }
}

export function buildActionPlan(recomendaciones: string[], brechas: string[] = []): ActionItem[] {
  const items: ActionItem[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < recomendaciones.length; i++) {
    const raw = recomendaciones[i].trim();
    if (!raw || seen.has(raw)) continue;
    seen.add(raw);

    const priority = parsePriority(raw);
    const { impact, urgency } = impactUrgency(priority);
    const title = raw.replace(/^\[(Alta|Media|Baja|Crítica|Critica)\]\s*/i, "").split("—")[0].trim();

    items.push({
      id: `action-${i}`,
      title: title || raw,
      description: raw,
      priority,
      impact,
      urgency,
      sortScore: impact * urgency + PRIORITY_ORDER[priority],
      category: inferCategory(raw),
    });
  }

  for (let i = 0; i < brechas.length; i++) {
    const brecha = brechas[i];
    const key = `gap-action-${i}`;
    if (seen.has(brecha)) continue;
    const { impact, urgency } = impactUrgency("alta");
    items.push({
      id: key,
      title: `Corregir: ${brecha}`,
      description: `Atender el incumplimiento identificado: ${brecha}`,
      priority: "alta",
      impact,
      urgency,
      sortScore: impact * urgency + PRIORITY_ORDER.alta,
      category: inferCategory(brecha),
    });
  }

  return items.sort((a, b) => b.sortScore - a.sortScore);
}

export function priorityLabel(p: ActionPriority): string {
  return p === "critica" ? "Crítica" : p === "alta" ? "Alta" : p === "media" ? "Media" : "Baja";
}

export function priorityColor(p: ActionPriority): string {
  switch (p) {
    case "critica":
      return "bg-red-600";
    case "alta":
      return "bg-orange-500";
    case "media":
      return "bg-yellow-500";
    default:
      return "bg-slate-400";
  }
}

export function actionProgress(items: ActionItem[], status: Record<string, string>): number {
  if (items.length === 0) return 0;
  const done = items.filter((i) => status[i.id] === "completada").length;
  return Math.round((done / items.length) * 100);
}
