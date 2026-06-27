import { buildActionPlan, type ActionItem } from "@/lib/compliance/action-plan";

export type ChecklistItem = {
  id: string;
  label: string;
  category: string;
  source: "recomendacion" | "brecha" | "obligacion";
};

export function buildChecklist(recomendaciones: string[], brechas: string[]): ChecklistItem[] {
  const plan = buildActionPlan(recomendaciones, brechas);
  const items: ChecklistItem[] = plan.map((a) => ({
    id: a.id,
    label: a.title,
    category: a.category,
    source: a.id.startsWith("gap-action") ? "brecha" : "recomendacion",
  }));

  const obligations = [
    { id: "obl-registro-sic", label: "Registro de bases de datos ante la SIC", category: "Regulatorio" },
    { id: "obl-revision-anual", label: "Revisión anual de la política de tratamiento", category: "Mejora continua" },
    { id: "obl-capacitacion", label: "Capacitación anual al personal en protección de datos", category: "Capacitación" },
    { id: "obl-inventario", label: "Inventario actualizado de bases de datos personales", category: "Documentación" },
  ];

  for (const o of obligations) {
    if (!items.some((i) => i.id === o.id)) {
      items.push({ ...o, source: "obligacion" });
    }
  }

  return items;
}

export function checklistProgress(items: ChecklistItem[], completed: Record<string, boolean>): number {
  if (items.length === 0) return 0;
  const done = items.filter((i) => completed[i.id]).length;
  return Math.round((done / items.length) * 100);
}

export function groupChecklistByCategory(items: ChecklistItem[]): Record<string, ChecklistItem[]> {
  return items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    const list = acc[item.category] ?? [];
    list.push(item);
    acc[item.category] = list;
    return acc;
  }, {});
}

export type { ActionItem };
