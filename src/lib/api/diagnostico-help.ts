import { sendChatMessage, type ChatContext } from "@/lib/api/chatbot";
import type { User } from "@/lib/auth";
import { getBloque, type PreguntaDiagnostico } from "@/lib/diagnostico";

export type DiagnosticoHelpType = "significado" | "evaluacion";

function buildHelpMessage(pregunta: PreguntaDiagnostico, type: DiagnosticoHelpType): string {
  const bloque = getBloque(pregunta.bloque).titulo;

  if (type === "significado") {
    return (
      `Estoy en el autodiagnóstico de cumplimiento de la Ley 1581 de 2012 (Colombia). ` +
      `Explica qué significa esta pregunta y por qué es relevante para el cumplimiento: ` +
      `«${pregunta.texto}». Bloque: ${bloque}. ` +
      `Responde en español, claro y breve (máximo 3 párrafos cortos).`
    );
  }

  return (
    `Estoy en el autodiagnóstico de cumplimiento de la Ley 1581 de 2012 (Colombia). ` +
    `Para la pregunta: «${pregunta.texto}» (bloque: ${bloque}), indica criterios concretos ` +
    `para responder Sí o No en una PYME colombiana. Usa viñetas: cuándo responder Sí, ` +
    `cuándo responder No, y qué evidencia o documentos revisar.`
  );
}

function buildHelpContext(
  pregunta: PreguntaDiagnostico,
  type: DiagnosticoHelpType
): ChatContext {
  return {
    pathname: "/cuestionario",
    source: "diagnostico_help",
    help_type: type,
    question_id: pregunta.id,
    question_text: pregunta.texto,
    question_block: getBloque(pregunta.bloque).titulo,
  };
}

export async function fetchDiagnosticoHelp(
  pregunta: PreguntaDiagnostico,
  type: DiagnosticoHelpType,
  user: User
): Promise<string> {
  const reply = await sendChatMessage({
    message: buildHelpMessage(pregunta, type),
    history: [],
    sessionId: `diagnostico-q${pregunta.id}-${type}`,
    user,
    context: buildHelpContext(pregunta, type),
  });
  return reply.content;
}

export function getStaticDiagnosticoHelp(
  pregunta: PreguntaDiagnostico,
  type: DiagnosticoHelpType
): string {
  return type === "significado" ? pregunta.ayudaLegal : pregunta.ayudaPractica;
}
