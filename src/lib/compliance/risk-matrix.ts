import { preguntasDiagnostico } from "@/lib/diagnostico";

export type RiskLevel = "critico" | "alto" | "medio" | "bajo";

export type RiskItem = {
  id: string;
  title: string;
  category: string;
  impact: number;
  likelihood: number;
  score: number;
  level: RiskLevel;
  questionNumber?: number;
};

const CATEGORY_MAP: Record<number, { category: string; impact: number; likelihood: number }> = {
  1: { category: "Política de datos personales", impact: 5, likelihood: 4 },
  2: { category: "Política de datos personales", impact: 4, likelihood: 3 },
  3: { category: "Política de datos personales", impact: 4, likelihood: 3 },
  4: { category: "Política de datos personales", impact: 4, likelihood: 3 },
  5: { category: "Política de datos personales", impact: 4, likelihood: 3 },
  6: { category: "Privacidad desde el diseño", impact: 4, likelihood: 3 },
  7: { category: "Privacidad desde el diseño", impact: 4, likelihood: 3 },
  8: { category: "Privacidad desde el diseño", impact: 4, likelihood: 3 },
  9: { category: "Gobernanza", impact: 5, likelihood: 4 },
  10: { category: "Gobernanza", impact: 4, likelihood: 3 },
  11: { category: "Gobernanza", impact: 3, likelihood: 2 },
};

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 20) return "critico";
  if (score >= 15) return "alto";
  if (score >= 9) return "medio";
  return "bajo";
}

export function buildRiskMatrixFromBrechas(brechas: string[]): RiskItem[] {
  const items: RiskItem[] = [];

  for (const pregunta of preguntasDiagnostico) {
    const isGap = brechas.some((b) => b.toLowerCase().includes(pregunta.texto.slice(4, 20).toLowerCase().split(" ")[0]) ||
      brechas.includes(pregunta.texto));
    if (!isGap) continue;

    const meta = CATEGORY_MAP[pregunta.id] ?? { category: "General", impact: 3, likelihood: 3 };
    const score = meta.impact * meta.likelihood;
    items.push({
      id: `q-${pregunta.id}`,
      title: pregunta.texto,
      category: meta.category,
      impact: meta.impact,
      likelihood: meta.likelihood,
      score,
      level: riskLevelFromScore(score),
      questionNumber: pregunta.id,
    });
  }

  for (const brecha of brechas) {
    const matched = items.some((i) => i.title === brecha);
    if (!matched) {
      items.push({
        id: `gap-${items.length}`,
        title: brecha,
        category: "Incumplimiento detectado",
        impact: 4,
        likelihood: 3,
        score: 12,
        level: "medio",
      });
    }
  }

  return items.sort((a, b) => b.score - a.score);
}

export function riskLevelColor(level: RiskLevel): string {
  switch (level) {
    case "critico":
      return "bg-red-600 text-white";
    case "alto":
      return "bg-orange-500 text-white";
    case "medio":
      return "bg-yellow-500 text-black";
    default:
      return "bg-green-500 text-white";
  }
}

export function riskLevelLabel(level: RiskLevel): string {
  switch (level) {
    case "critico":
      return "Crítico";
    case "alto":
      return "Alto";
    case "medio":
      return "Medio";
    default:
      return "Bajo";
  }
}

export function matrixCellLabel(impact: number, likelihood: number): RiskLevel {
  return riskLevelFromScore(impact * likelihood);
}
