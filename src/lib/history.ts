import { downloadReportePdf } from "@/lib/pdf-report";

export type HistorialItem = {
  id: string;
  empresa: string;
  responsable: string;
  fecha: string;
  puntaje: number;
  estado: "Cumple" | "Parcial" | "No cumple";
  brechas: string[];
  recomendaciones: string[];
  porBloque: Record<string, number>;
  companyId?: number;
  assessmentId?: number;
  aiReport?: Record<string, unknown>;
};

const KEY = "cavaltec.evaluaciones";

export function getHistorial(companyId?: number): HistorialItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const items: HistorialItem[] = JSON.parse(raw);
    if (companyId == null) return items;
    return items.filter((i) => i.companyId === companyId || !i.companyId);
  } catch {
    return [];
  }
}

export function saveEvaluacion(item: Omit<HistorialItem, "id" | "fecha">): HistorialItem {
  const entry: HistorialItem = {
    ...item,
    id: `EV-${Date.now()}`,
    fecha: new Date().toISOString(),
  };
  const current = getHistorial();
  current.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(current.slice(0, 50)));
  return entry;
}

export function downloadReporte(item: HistorialItem) {
  downloadReportePdf(item);
}
