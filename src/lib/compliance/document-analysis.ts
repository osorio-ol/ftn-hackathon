export type PolicyRequirement = {
  id: string;
  label: string;
  keywords: string[];
  weight: number;
};

export const POLICY_MINIMUM_REQUIREMENTS: PolicyRequirement[] = [
  {
    id: "identificacion",
    label: "Identificación del responsable del tratamiento",
    keywords: ["responsable", "razón social", "nit", "identificación"],
    weight: 15,
  },
  {
    id: "finalidad",
    label: "Finalidades del tratamiento de datos",
    keywords: ["finalidad", "finalidades", "propósito", "uso de los datos"],
    weight: 15,
  },
  {
    id: "derechos",
    label: "Derechos de los titulares (conocer, actualizar, rectificar, suprimir)",
    keywords: ["derecho", "titular", "rectificar", "suprimir", "actualizar", "conocer"],
    weight: 20,
  },
  {
    id: "canales",
    label: "Canales para consultas y reclamos",
    keywords: ["consulta", "reclamo", "correo", "contacto", "canal"],
    weight: 15,
  },
  {
    id: "plazos",
    label: "Plazos de respuesta (10 días consultas, 15 días reclamos)",
    keywords: ["10 días", "15 días", "días hábiles", "plazo"],
    weight: 10,
  },
  {
    id: "seguridad",
    label: "Medidas de seguridad de la información",
    keywords: ["seguridad", "protección", "confidencial", "acceso"],
    weight: 10,
  },
  {
    id: "vigencia",
    label: "Vigencia y actualización de la política",
    keywords: ["vigencia", "actualización", "revisión", "anual"],
    weight: 5,
  },
  {
    id: "ley1581",
    label: "Referencia normativa (Ley 1581 / Habeas Data)",
    keywords: ["1581", "habeas data", "decreto 1377", "sic"],
    weight: 10,
  },
];

export type RequirementResult = PolicyRequirement & {
  met: boolean;
  evidence?: string;
};

export type DocumentAnalysisResult = {
  fileName: string;
  analyzedAt: string;
  score: number;
  level: "cumple" | "parcial" | "no_cumple";
  requirements: RequirementResult[];
  summary: string;
  gaps: string[];
};

function findEvidence(text: string, keywords: string[]): string | undefined {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    const idx = lower.indexOf(kw.toLowerCase());
    if (idx >= 0) {
      const start = Math.max(0, idx - 30);
      const end = Math.min(text.length, idx + kw.length + 50);
      return `…${text.slice(start, end).replace(/\s+/g, " ").trim()}…`;
    }
  }
  return undefined;
}

export function analyzePolicyDocument(fileName: string, text: string): DocumentAnalysisResult {
  const normalized = text.toLowerCase();
  let earned = 0;
  let total = 0;
  const gaps: string[] = [];

  const requirements: RequirementResult[] = POLICY_MINIMUM_REQUIREMENTS.map((req) => {
    total += req.weight;
    const met = req.keywords.some((kw) => normalized.includes(kw.toLowerCase()));
    if (met) earned += req.weight;
    else gaps.push(req.label);
    return {
      ...req,
      met,
      evidence: met ? findEvidence(text, req.keywords) : undefined,
    };
  });

  const score = total > 0 ? Math.round((earned / total) * 100) : 0;
  const level = score >= 80 ? "cumple" : score >= 60 ? "parcial" : "no_cumple";

  const summary =
    level === "cumple"
      ? "El documento cumple con la mayoría de los requisitos mínimos de una política de tratamiento conforme a la Ley 1581."
      : level === "parcial"
        ? "El documento aborda algunos requisitos pero presenta brechas importantes que deben corregirse."
        : "El documento no cumple los requisitos mínimos. Se recomienda usar la plantilla generada por la plataforma.";

  return {
    fileName,
    analyzedAt: new Date().toISOString(),
    score,
    level,
    requirements,
    summary,
    gaps,
  };
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsText(file);
  });
}
