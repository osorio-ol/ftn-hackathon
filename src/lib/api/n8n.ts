import { ApiError } from "@/lib/api/client";
import { getRecommendationOptional } from "@/lib/api/assessments";

const N8N_WEBHOOK_URL =
  import.meta.env.VITE_N8N_WEBHOOK_URL ??
  "https://smartteam2026.app.n8n.cloud/webhook/generate-recommendations";

const WEBHOOK_TIMEOUT_MS = 90_000;
const POLL_INTERVAL_MS = 2_000;
const POLL_MAX_ATTEMPTS = 8;

export async function triggerN8nRecommendations(assessmentId: number): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessment_id: assessmentId }),
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail = "El servicio de IA no pudo procesar la solicitud.";
      try {
        const data = await res.json();
        if (typeof data.message === "string") detail = data.message;
        else if (typeof data.detail === "string") detail = data.detail;
      } catch {
        /* ignore */
      }
      throw new ApiError(detail, res.status);
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(
        "La generación de recomendaciones tardó demasiado. Intenta consultar el historial más tarde.",
        408
      );
    }
    throw new ApiError(
      "No se pudo contactar el servicio de IA. Verifica tu conexión e intenta de nuevo.",
      0
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchRecommendationWithRetry(assessmentId: number) {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    const rec = await getRecommendationOptional(assessmentId);
    if (rec) return rec;
    if (attempt === POLL_MAX_ATTEMPTS - 1) break;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new ApiError("No se encontró la recomendación generada.", 404);
}

export type GenerateRecommendationsResult = Awaited<
  ReturnType<typeof fetchRecommendationWithRetry>
>;

export async function generateRecommendationsFlow(
  assessmentId: number
): Promise<GenerateRecommendationsResult> {
  await triggerN8nRecommendations(assessmentId);
  return fetchRecommendationWithRetry(assessmentId);
}
