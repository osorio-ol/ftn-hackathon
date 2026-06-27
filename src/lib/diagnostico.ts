export type RespuestaValor = "si" | "no";

export type BloqueId = "politica" | "privacidad" | "gobernanza";

export type BloqueDiagnostico = {
  id: BloqueId;
  titulo: string;
  pesoMax: number;
};

export type PreguntaDiagnostico = {
  id: number;
  texto: string;
  bloque: BloqueId;
  /** Peso sobre 100. null = no suma (pregunta compuerta o complementaria). */
  peso: number | null;
  esComplementaria?: boolean;
  condicional?: { preguntaId: number; respuesta: RespuestaValor };
  ayudaLegal: string;
  ayudaPractica: string;
};

export const bloquesDiagnostico: BloqueDiagnostico[] = [
  { id: "politica", titulo: "Política de datos personales", pesoMax: 40 },
  { id: "privacidad", titulo: "Privacidad desde el diseño", pesoMax: 36 },
  { id: "gobernanza", titulo: "Gobernanza", pesoMax: 24 },
];

export const preguntasDiagnostico: PreguntaDiagnostico[] = [
  {
    id: 1,
    texto: "¿Cuenta con una política de tratamiento de datos personales?",
    bloque: "politica",
    peso: null,
    ayudaLegal:
      "El responsable del tratamiento debe adoptar una política de tratamiento de datos personales conforme a la Ley 1581.",
    ayudaPractica:
      "Si responde Sí, evaluará los criterios de documentación, finalidades y derechos de los titulares.",
  },
  {
    id: 2,
    texto: "¿La política está documentada y publicada en medio de fácil acceso?",
    bloque: "politica",
    peso: 10,
    condicional: { preguntaId: 1, respuesta: "si" },
    ayudaLegal:
      "La política debe estar disponible para consulta de titulares y terceros interesados.",
    ayudaPractica:
      "Verifique sitio web, intranet, avisos de privacidad o canales físicos de acceso.",
  },
  {
    id: 3,
    texto: "¿Define las finalidades del tratamiento de datos?",
    bloque: "politica",
    peso: 10,
    condicional: { preguntaId: 1, respuesta: "si" },
    ayudaLegal:
      "Toda base de datos debe tener finalidades legítimas, explícitas y determinadas.",
    ayudaPractica:
      "Revise que la política describa para qué se usan los datos en cada proceso.",
  },
  {
    id: 4,
    texto: "¿Incluye los derechos de los titulares?",
    bloque: "politica",
    peso: 10,
    condicional: { preguntaId: 1, respuesta: "si" },
    ayudaLegal:
      "Los titulares tienen derecho a conocer, actualizar, rectificar y suprimir sus datos, entre otros.",
    ayudaPractica:
      "Confirme que la política menciona los derechos reconocidos por la ley.",
  },
  {
    id: 5,
    texto: "¿Menciona cómo ejercer los derechos de los titulares?",
    bloque: "politica",
    peso: 10,
    condicional: { preguntaId: 1, respuesta: "si" },
    ayudaLegal:
      "Debe existir un mecanismo claro para presentar consultas, reclamos y solicitudes.",
    ayudaPractica:
      "Busque correos, formularios o procedimientos con plazos de respuesta definidos.",
  },
  {
    id: 6,
    texto: "¿Incorpora evaluaciones de impacto (Privacy Impact Assessments)?",
    bloque: "privacidad",
    peso: 12,
    ayudaLegal:
      "Las evaluaciones de impacto permiten identificar riesgos antes de implementar tratamientos.",
    ayudaPractica:
      "Revise si existen EIPD o análisis de riesgo para nuevos proyectos o sistemas.",
  },
  {
    id: 7,
    texto: "¿Aplica técnicas de minimización de datos?",
    bloque: "privacidad",
    peso: 12,
    ayudaLegal:
      "Solo deben tratarse datos adecuados, pertinentes y no excesivos respecto a la finalidad.",
    ayudaPractica:
      "Evalúe formularios, bases de datos y retención para evitar datos innecesarios.",
  },
  {
    id: 8,
    texto: "¿Configura sus sistemas para recopilar el mínimo de datos por defecto?",
    bloque: "privacidad",
    peso: 12,
    ayudaLegal:
      "Privacy by default exige que la configuración inicial limite la recolección al mínimo necesario.",
    ayudaPractica:
      "Verifique que apps y formularios no pidan más datos de los estrictamente requeridos.",
  },
  {
    id: 9,
    texto: "¿Cuenta con un sistema de administración de riesgos?",
    bloque: "gobernanza",
    peso: 16,
    ayudaLegal:
      "La gestión de riesgos de privacidad es parte de la gobernanza del tratamiento de datos.",
    ayudaPractica:
      "Busque matriz de riesgos, planes de tratamiento o revisiones periódicas documentadas.",
  },
  {
    id: 10,
    texto: "¿Cuenta con un oficial de protección de datos personales?",
    bloque: "gobernanza",
    peso: 8,
    ayudaLegal:
      "Según el tamaño y riesgo del tratamiento, puede requerirse un delegado u oficial de protección.",
    ayudaPractica:
      "Identifique si existe un responsable designado para privacidad y cumplimiento.",
  },
  {
    id: 11,
    texto: "¿Está designado formalmente?",
    bloque: "gobernanza",
    peso: null,
    esComplementaria: true,
    condicional: { preguntaId: 10, respuesta: "si" },
    ayudaLegal:
      "La designación formal del oficial debe constar en acta, contrato o documento interno.",
    ayudaPractica:
      "Pregunta complementaria: no suma al puntaje, pero ayuda a validar la formalización.",
  },
];

export function getBloque(bloqueId: BloqueId): BloqueDiagnostico {
  return bloquesDiagnostico.find((b) => b.id === bloqueId)!;
}

/** IDs del flujo según ramas respondidas (6, 10 u 11 preguntas). */
export function getIdsDelFlujo(
  respuestas: Record<number, RespuestaValor | undefined>
): number[] {
  const q1 = respuestas[1];
  if (q1 !== "si" && q1 !== "no") return [];

  const ids: number[] = [1];
  if (q1 === "si") ids.push(2, 3, 4, 5);
  ids.push(6, 7, 8, 9, 10);
  if (respuestas[10] === "si") ids.push(11);
  return ids;
}

/** Preguntas visibles en el flujo actual (secuencial, no adelanta bloques). */
export function getPreguntasActivas(
  respuestas: Record<number, RespuestaValor | undefined>
): PreguntaDiagnostico[] {
  const q1 = respuestas[1];
  if (q1 !== "si" && q1 !== "no") {
    return [preguntasDiagnostico[0]];
  }

  return getIdsDelFlujo(respuestas).map(
    (id) => preguntasDiagnostico.find((p) => p.id === id)!
  );
}

/** Elimina respuestas que ya no pertenecen a la rama activa. */
export function pruneRespuestasFueraDeFlujo(
  respuestas: Record<number, RespuestaValor | undefined>
): Record<number, RespuestaValor> {
  const ids = getIdsDelFlujo(respuestas);
  if (!ids.length) {
    const q1 = respuestas[1];
    return q1 ? { 1: q1 } : {};
  }

  const next: Record<number, RespuestaValor> = {};
  for (const id of ids) {
    const value = respuestas[id];
    if (value === "si" || value === "no") next[id] = value;
  }
  return next;
}

/** Limpia respuestas dependientes al cambiar una pregunta compuerta. */
export function clearRespuestasDependientes(
  respuestas: Record<number, RespuestaValor | undefined>,
  preguntaId: number,
  valor: RespuestaValor
): Record<number, RespuestaValor> {
  const next: Record<number, RespuestaValor> = { ...respuestas, [preguntaId]: valor };

  if (preguntaId === 1 && valor === "no") {
    for (const id of [2, 3, 4, 5]) delete next[id];
  }
  if (preguntaId === 10 && valor === "no") {
    delete next[11];
  }

  return pruneRespuestasFueraDeFlujo(next);
}

export function calcularPuntaje(respuestas: Record<number, RespuestaValor | undefined>): {
  puntaje: number;
  estado: "Cumple" | "Parcial" | "No cumple";
  brechas: string[];
  respuestasSi: number;
  totalPreguntas: number;
  porBloque: Record<BloqueId, number>;
} {
  const brechas: string[] = [];
  let respuestasSi = 0;
  let totalPreguntas = 0;
  const porBloque: Record<BloqueId, number> = {
    politica: 0,
    privacidad: 0,
    gobernanza: 0,
  };

  const q1 = respuestas[1];
  if (q1 === "no") {
    totalPreguntas += 1;
    brechas.push(preguntasDiagnostico[0].texto);
  } else if (q1 === "si") {
    for (const pregunta of preguntasDiagnostico.filter((p) => p.id >= 2 && p.id <= 5)) {
      totalPreguntas += 1;
      const resp = respuestas[pregunta.id];
      if (resp === "si") {
        porBloque.politica += pregunta.peso ?? 0;
        respuestasSi += 1;
      } else if (resp === "no") {
        brechas.push(pregunta.texto);
      }
    }
  }

  for (const pregunta of preguntasDiagnostico.filter((p) => p.id >= 6 && p.id <= 10)) {
    totalPreguntas += 1;
    const resp = respuestas[pregunta.id];
    if (resp === "si") {
      porBloque[pregunta.bloque] += pregunta.peso ?? 0;
      respuestasSi += 1;
    } else if (resp === "no") {
      brechas.push(pregunta.texto);
    }
  }

  if (respuestas[10] === "si" && respuestas[11] === "no") {
    brechas.push(preguntasDiagnostico[10].texto);
  }

  const puntaje = Math.round(
    porBloque.politica + porBloque.privacidad + porBloque.gobernanza
  );
  const estado = puntaje >= 80 ? "Cumple" : puntaje >= 60 ? "Parcial" : "No cumple";

  return {
    puntaje,
    estado,
    brechas,
    respuestasSi,
    totalPreguntas,
    porBloque,
  };
}

export function generarRecomendaciones(brechas: string[]): string[] {
  const recs = new Set<string>();
  for (const brecha of brechas) {
    const lower = brecha.toLowerCase();
    if (lower.includes("política de tratamiento")) {
      recs.add("Elabore y adopte una política de tratamiento de datos personales alineada con la Ley 1581.");
    }
    if (lower.includes("documentada") || lower.includes("publicada")) {
      recs.add("Documente y publique la política en un medio de fácil acceso (web, intranet o aviso de privacidad).");
    }
    if (lower.includes("finalidades")) {
      recs.add("Defina y documente las finalidades del tratamiento para cada base de datos.");
    }
    if (lower.includes("derechos de los titulares") && !lower.includes("ejercer")) {
      recs.add("Incluya en la política los derechos de los titulares reconocidos por la ley.");
    }
    if (lower.includes("ejercer los derechos")) {
      recs.add("Describa canales y procedimientos para que los titulares ejerzan sus derechos.");
    }
    if (lower.includes("evaluaciones de impacto") || lower.includes("privacy impact")) {
      recs.add("Implemente evaluaciones de impacto en privacidad (EIPD) para tratamientos de alto riesgo.");
    }
    if (lower.includes("minimización")) {
      recs.add("Aplique técnicas de minimización: recolecte solo datos necesarios y elimine el exceso.");
    }
    if (lower.includes("mínimo de datos") || lower.includes("por defecto")) {
      recs.add("Configure formularios y sistemas con recolección mínima de datos por defecto.");
    }
    if (lower.includes("administración de riesgos") || lower.includes("riesgos")) {
      recs.add("Establezca un sistema de administración de riesgos de privacidad con seguimiento periódico.");
    }
    if (lower.includes("oficial de protección")) {
      recs.add("Designe un oficial o responsable de protección de datos personales según la estructura de su organización.");
    }
    if (lower.includes("designado formalmente")) {
      recs.add("Formalice por escrito la designación del oficial de protección de datos.");
    }
  }
  if (recs.size === 0) {
    recs.add("Mantenga auditorías periódicas y actualice controles según cambios normativos.");
  }
  return Array.from(recs);
}
