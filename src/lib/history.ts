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
  const contenido = {
    titulo: "Informe de Autodiagnóstico Ley 1581 — Fase de Diseño",
    empresa: item.empresa,
    responsable: item.responsable,
    fecha: item.fecha,
    nivel_cumplimiento: `${item.puntaje}%`,
    estado: item.estado,
    cumplimiento_por_bloque: item.porBloque,
    brechas: item.brechas,
    recomendaciones: item.recomendaciones,
  };
  const blob = new Blob([JSON.stringify(contenido, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte-${item.empresa.replace(/\s+/g, "-").toLowerCase()}-${item.fecha.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
