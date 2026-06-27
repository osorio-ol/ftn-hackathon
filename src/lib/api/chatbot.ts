import { ApiError, apiRequest } from "@/lib/api/client";
import type { User } from "@/lib/auth";

const CHAT_TIMEOUT_MS = 120_000;

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
  createdAt: number;
};

export type ChatAttachment = {
  name: string;
  url?: string;
  type?: string;
};

export type SendChatMessageInput = {
  message: string;
  history: ChatMessage[];
  sessionId: string;
  user: User;
  pathname?: string;
};

export type ChatbotReply = {
  content: string;
  attachments?: ChatAttachment[];
};

function parseAttachments(value: unknown): ChatAttachment[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const o = entry as Record<string, unknown>;
      const name = typeof o.name === "string" ? o.name : typeof o.title === "string" ? o.title : null;
      if (!name) return null;
      return {
        name,
        url: typeof o.url === "string" ? o.url : typeof o.link === "string" ? o.link : undefined,
        type: typeof o.type === "string" ? o.type : undefined,
      };
    })
    .filter((x): x is ChatAttachment => x != null);
  return items.length ? items : undefined;
}

function extractText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = extractText(item);
      if (text) return text;
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;

  const o = value as Record<string, unknown>;
  for (const key of ["reply", "message", "response", "output", "text", "answer", "content"]) {
    const text = extractText(o[key]);
    if (text) return text;
  }

  if (Array.isArray(o.data) && o.data[0] && typeof o.data[0] === "object") {
    const nested = extractText((o.data[0] as Record<string, unknown>).json ?? o.data[0]);
    if (nested) return nested;
  }

  if (o.json && typeof o.json === "object") {
    return extractText(o.json);
  }

  return null;
}

function parseChatbotResponse(data: unknown): ChatbotReply {
  const normalized = Array.isArray(data) && data[0] ? data[0] : data;
  const content = extractText(normalized);
  if (!content) {
    throw new ApiError("La IA no devolvió una respuesta válida.", 502);
  }

  const root =
    normalized && typeof normalized === "object"
      ? (normalized as Record<string, unknown>)
      : {};
  const nested =
    root.json && typeof root.json === "object" ? (root.json as Record<string, unknown>) : root;

  const attachments =
    parseAttachments(nested.attachments) ??
    parseAttachments(nested.documents) ??
    parseAttachments(nested.files);

  return { content, attachments };
}

export async function sendChatMessage(input: SendChatMessageInput): Promise<ChatbotReply> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

  const history = input.history.slice(-12).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const data = await apiRequest<unknown>("/api/v1/chat", {
      method: "POST",
      body: {
        message: input.message,
        session_id: input.sessionId,
        history,
        context: {
          pathname: input.pathname ?? "",
        },
      },
      signal: controller.signal,
    });
    return parseChatbotResponse(data);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("La respuesta tardó demasiado. Intenta de nuevo.", 408);
    }
    throw new ApiError(
      "No se pudo contactar al asistente IA. Verifica que el backend esté en marcha.",
      0
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function createChatSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
