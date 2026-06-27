export type ComplianceLevel = "alto" | "medio" | "bajo";

export type ComplianceScore = {
  percentage: number;
  level: ComplianceLevel;
  label: "Cumple" | "Parcial" | "No cumple";
  color: string;
};

export function scoreToLevel(puntaje: number): ComplianceLevel {
  if (puntaje >= 80) return "alto";
  if (puntaje >= 60) return "medio";
  return "bajo";
}

export function scoreToLabel(puntaje: number): ComplianceScore["label"] {
  if (puntaje >= 80) return "Cumple";
  if (puntaje >= 60) return "Parcial";
  return "No cumple";
}

export function buildComplianceScore(puntaje: number): ComplianceScore {
  const level = scoreToLevel(puntaje);
  return {
    percentage: Math.round(puntaje),
    level,
    label: scoreToLabel(puntaje),
    color: level === "alto" ? "#16a34a" : level === "medio" ? "#ca8a04" : "#dc2626",
  };
}

export function levelLabel(level: ComplianceLevel): string {
  return level === "alto" ? "Alto" : level === "medio" ? "Medio" : "Bajo";
}
