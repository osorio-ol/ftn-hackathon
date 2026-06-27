import { sendChatMessage, type ChatContext } from "@/lib/api/chatbot";
import type { User } from "@/lib/auth";
import { getBloque, preguntasDiagnostico, type PreguntaDiagnostico } from "@/lib/diagnostico";

export type DiagnosticoHelpType = "significado" | "evaluacion";

const HELP_TYPES: DiagnosticoHelpType[] = ["significado", "evaluacion"];
const CACHE_VERSION = "v1";
const STORAGE_PREFIX = `ds-diagnostico-help-${CACHE_VERSION}:`;
const PREFETCH_CONCURRENCY = 2;

const memoryCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();
const prefetchQueue: Array<() => Promise<void>> = [];
let prefetchRunning = false;

export function helpCacheKey(questionId: number, type: DiagnosticoHelpType): string {
  return `${questionId}:${type}`;
}

export function getCachedDiagnosticoHelp(
  questionId: number,
  type: DiagnosticoHelpType
): string | null {
  const key = helpCacheKey(questionId, type);
  const mem = memoryCache.get(key);
  if (mem) return mem;

  if (typeof localStorage === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (stored) {
      memoryCache.set(key, stored);
      return stored;
    }
  } catch {
    /* quota / private mode */
  }
  return null;
}

export function setCachedDiagnosticoHelp(
  questionId: number,
  type: DiagnosticoHelpType,
  content: string
): void {
  const key = helpCacheKey(questionId, type);
  memoryCache.set(key, content);
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, content);
  } catch {
    /* quota */
  }
}

export function isDiagnosticoHelpCached(questionId: number, type: DiagnosticoHelpType): boolean {
  return getCachedDiagnosticoHelp(questionId, type) != null;
}

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

export async function getDiagnosticoHelp(
  pregunta: PreguntaDiagnostico,
  type: DiagnosticoHelpType,
  user: User,
  options?: { force?: boolean }
): Promise<{ content: string; fromCache: boolean }> {
  const key = helpCacheKey(pregunta.id, type);

  if (!options?.force) {
    const cached = getCachedDiagnosticoHelp(pregunta.id, type);
    if (cached) return { content: cached, fromCache: true };
  }

  const pending = inflight.get(key);
  if (pending && !options?.force) {
    const content = await pending;
    return { content, fromCache: false };
  }

  const promise = (async () => {
    const content = await fetchDiagnosticoHelp(pregunta, type, user);
    setCachedDiagnosticoHelp(pregunta.id, type, content);
    return content;
  })();

  inflight.set(key, promise);
  try {
    const content = await promise;
    return { content, fromCache: false };
  } finally {
    if (inflight.get(key) === promise) inflight.delete(key);
  }
}

function getPreguntaById(questionId: number): PreguntaDiagnostico | undefined {
  return preguntasDiagnostico.find((p) => p.id === questionId);
}

function enqueuePrefetch(task: () => Promise<void>): void {
  prefetchQueue.push(task);
  void drainPrefetchQueue();
}

async function drainPrefetchQueue(): Promise<void> {
  if (prefetchRunning) return;
  prefetchRunning = true;
  try {
    while (prefetchQueue.length > 0) {
      const batch = prefetchQueue.splice(0, PREFETCH_CONCURRENCY);
      await Promise.all(batch.map((task) => task().catch(() => undefined)));
    }
  } finally {
    prefetchRunning = false;
    if (prefetchQueue.length > 0) void drainPrefetchQueue();
  }
}

export function schedulePrefetchDiagnosticoHelp(
  questionIds: number[],
  user: User,
  types: DiagnosticoHelpType[] = HELP_TYPES
): void {
  for (const questionId of questionIds) {
    const pregunta = getPreguntaById(questionId);
    if (!pregunta) continue;

    for (const type of types) {
      const key = helpCacheKey(questionId, type);
      if (getCachedDiagnosticoHelp(questionId, type) || inflight.has(key)) continue;

      enqueuePrefetch(async () => {
        await getDiagnosticoHelp(pregunta, type, user);
      });
    }
  }
}

/** Precarga las siguientes preguntas del flujo activo. */
export function prefetchUpcomingFlowHelp(
  flowQuestionIds: number[],
  currentQuestionId: number,
  user: User
): void {
  const idx = flowQuestionIds.indexOf(currentQuestionId);
  if (idx < 0) return;
  schedulePrefetchDiagnosticoHelp(flowQuestionIds.slice(idx, idx + 4), user);
}

/** Precarga en segundo plano (solo faltantes en caché). */
export function warmDiagnosticoHelpCache(user: User, questionIds?: number[]): void {
  const ids = questionIds ?? preguntasDiagnostico.map((p) => p.id);
  const run = () => schedulePrefetchDiagnosticoHelp(ids, user);

  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(run, { timeout: 8_000 });
  } else {
    setTimeout(run, 300);
  }
}
