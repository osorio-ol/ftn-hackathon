export type RespuestaValor = "si" | "no";

export type PreguntaDiagnostico = {
  id: number;
  texto: string;
  peso: number;
  ayudaLegal: string;
  ayudaPractica: string;
};

export const preguntasDiagnostico: PreguntaDiagnostico[] = [
  {
    id: 1,
    texto: "¿La empresa obtiene autorización para tratar datos?",
    peso: 12.5,
    ayudaLegal:
      "La Ley 1581 exige autorización previa, expresa e informada del titular antes del tratamiento de datos personales.",
    ayudaPractica:
      "Verifique formularios, checkboxes o contratos donde el titular autorice el uso de sus datos.",
  },
  {
    id: 2,
    texto: "¿Cuenta con una política de tratamiento publicada?",
    peso: 12.5,
    ayudaLegal:
      "El responsable del tratamiento debe adoptar y publicar una política de tratamiento de datos personales.",
    ayudaPractica:
      "Busque el documento en el sitio web, intranet o avisos de privacidad de la organización.",
  },
  {
    id: 3,
    texto: "¿Permite a los titulares ejercer sus derechos?",
    peso: 12.5,
    ayudaLegal:
      "Los titulares tienen derecho a conocer, actualizar, rectificar y suprimir sus datos personales.",
    ayudaPractica:
      "Confirme que existen canales y procedimientos para atender solicitudes de los titulares.",
  },
  {
    id: 4,
    texto: "¿Tiene procedimientos para consultas y reclamos?",
    peso: 12.5,
    ayudaLegal:
      "La ley establece mecanismos para que los titulares presenten consultas y reclamos sobre sus datos.",
    ayudaPractica:
      "Revise si hay un protocolo documentado con plazos de respuesta y responsables asignados.",
  },
  {
    id: 5,
    texto: "¿Aplica medidas de seguridad para proteger los datos?",
    peso: 12.5,
    ayudaLegal:
      "Se requieren medidas técnicas, humanas y administrativas para proteger la información personal.",
    ayudaPractica:
      "Evalúe controles de acceso, cifrado, respaldos y políticas de seguridad de la información.",
  },
  {
    id: 6,
    texto: "¿Capacita a su personal en protección de datos?",
    peso: 12.5,
    ayudaLegal:
      "El personal que trata datos debe conocer las obligaciones legales y las políticas internas.",
    ayudaPractica:
      "Verifique registros de capacitaciones, inducciones o programas de concientización en privacidad.",
  },
  {
    id: 7,
    texto: "¿Conoce y cumple las obligaciones legales sobre tratamiento de datos?",
    peso: 12.5,
    ayudaLegal:
      "El responsable debe cumplir los principios y deberes establecidos en la Ley 1581 y normas complementarias.",
    ayudaPractica:
      "Revise el registro de bases de datos ante la SIC y el cumplimiento de avisos de privacidad.",
  },
  {
    id: 8,
    texto: "¿Realiza seguimiento y mejora continua de sus prácticas de protección de datos?",
    peso: 12.5,
    ayudaLegal:
      "La protección de datos requiere revisión periódica, auditorías y actualización de controles.",
    ayudaPractica:
      "Busque planes de mejora, indicadores de cumplimiento o revisiones anuales de la política.",
  },
];

export function calcularPuntaje(respuestas: Record<number, RespuestaValor | undefined>): {
  puntaje: number;
  estado: "Cumple" | "Parcial" | "No cumple";
  brechas: string[];
  respuestasSi: number;
  totalPreguntas: number;
} {
  const brechas: string[] = [];
  let total = 0;
  let respuestasSi = 0;

  for (const pregunta of preguntasDiagnostico) {
    const resp = respuestas[pregunta.id];
    if (resp === "si") {
      total += pregunta.peso;
      respuestasSi += 1;
    } else if (resp === "no") {
      brechas.push(pregunta.texto);
    }
  }

  const puntaje = Math.round(total);
  const estado = puntaje >= 80 ? "Cumple" : puntaje >= 60 ? "Parcial" : "No cumple";

  return {
    puntaje,
    estado,
    brechas,
    respuestasSi,
    totalPreguntas: preguntasDiagnostico.length,
  };
}

export function generarRecomendaciones(brechas: string[]): string[] {
  const recs = new Set<string>();
  for (const brecha of brechas) {
    const lower = brecha.toLowerCase();
    if (lower.includes("autorización")) {
      recs.add("Implemente mecanismos de autorización previa, expresa e informada en todos los formularios de recolección.");
    }
    if (lower.includes("política")) {
      recs.add("Elabore y publique una política de tratamiento de datos alineada con la Ley 1581.");
    }
    if (lower.includes("derechos") || lower.includes("titulares")) {
      recs.add("Establezca canales claros para que los titulares ejerzan sus derechos de acceso, rectificación y supresión.");
    }
    if (lower.includes("consultas") || lower.includes("reclamos")) {
      recs.add("Documente un procedimiento de consultas y reclamos con plazos y responsables definidos.");
    }
    if (lower.includes("seguridad")) {
      recs.add("Fortalezca las medidas técnicas y administrativas de seguridad de la información.");
    }
    if (lower.includes("capacita")) {
      recs.add("Implemente un programa de capacitación periódica en protección de datos para todo el personal.");
    }
    if (lower.includes("obligaciones") || lower.includes("legales")) {
      recs.add("Realice un diagnóstico de cumplimiento normativo y registre las bases de datos ante la SIC.");
    }
    if (lower.includes("seguimiento") || lower.includes("mejora")) {
      recs.add("Defina un plan de mejora continua con revisiones periódicas del programa de privacidad.");
    }
  }
  if (recs.size === 0) {
    recs.add("Mantenga auditorías periódicas y actualice controles según cambios normativos.");
  }
  return Array.from(recs);
}
