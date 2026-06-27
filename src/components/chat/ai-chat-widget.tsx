import { useEffect, useMemo, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Loader2, MessageSquarePlus, Paperclip, Send, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  createChatSessionId,
  sendChatMessage,
  type ChatAttachment,
  type ChatMessage,
} from "@/lib/api/chatbot";
import { useAuth } from "@/lib/auth";
import { isCompanyUser } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SESSION_KEY = "cavaltec.chat.sessionId";
const ROBOT_EMOJI = "🤖";

function readSessionId(): string {
  const stored = window.localStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const id = createChatSessionId();
  window.localStorage.setItem(SESSION_KEY, id);
  return id;
}

function welcomeMessage(userName: string): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: `Hola${userName ? `, ${userName.split(" ")[0]}` : ""}. Soy el asistente IA de CAVALTEC. Pregúntame sobre Ley 1581, tu puntaje o el plan de cumplimiento.`,
    createdAt: Date.now(),
  };
}

function suggestedPrompts(role: string | undefined): string[] {
  if (role === "admin" || role === "auditor") {
    return ["Empresas con bajo cumplimiento", "Resumen del último diagnóstico"];
  }
  if (isCompanyUser(role ?? "company")) {
    return ["Mi último puntaje", "¿Qué debo mejorar?"];
  }
  return ["¿Qué es la Ley 1581?", "Interpretar mi puntaje"];
}

function AttachmentList({ items }: { items: ChatAttachment[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-1.5 space-y-1">
      {items.map((file) => (
        <div
          key={`${file.name}-${file.url ?? "local"}`}
          className="flex items-center gap-1.5 rounded-md border bg-background/80 px-2 py-1 text-[11px]"
        >
          <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
          {file.url ? (
            <a href={file.url} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">
              {file.name}
            </a>
          ) : (
            <span className="truncate">{file.name}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-1.5", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-sm" aria-hidden>
          {ROBOT_EMOJI}
        </span>
      )}
      <div
        className={cn(
          "max-w-[88%] rounded-xl px-2.5 py-2 text-xs leading-relaxed",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm border bg-card text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.attachments?.length ? <AttachmentList items={message.attachments} /> : null}
      </div>
    </div>
  );
}

export function AiChatWidget() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(readSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    user ? [welcomeMessage(user.name)] : []
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const prompts = useMemo(() => suggestedPrompts(user?.role), [user?.role]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container || !open) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => textareaRef.current?.focus(), 100);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!user) return null;

  const startNewChat = () => {
    if (loading) return;
    const newId = createChatSessionId();
    window.localStorage.setItem(SESSION_KEY, newId);
    setSessionId(newId);
    setMessages([welcomeMessage(user.name)]);
    setInput("");
    toast.success("Nueva conversación iniciada");
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const reply = await sendChatMessage({
        message: trimmed,
        history: messages.filter((m) => m.id !== "welcome"),
        sessionId,
        user,
        pathname,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: reply.content,
          attachments: reply.attachments,
          createdAt: Date.now(),
        },
      ]);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Error desconocido";
      toast.error(detail);
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: `No pude completar la solicitud: ${detail}`,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Cerrar chat"
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Asistente CAVALTEC"
          className="fixed bottom-[5.25rem] right-3 z-50 flex h-[min(70vh,480px)] w-[min(calc(100vw-1.25rem),320px)] flex-col overflow-hidden rounded-xl border border-border/80 bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 sm:right-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center gap-2 border-b bg-gradient-to-r from-primary/10 to-transparent px-3 py-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-lg leading-none">
              {ROBOT_EMOJI}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">Asistente CAVALTEC</p>
              <p className="truncate text-[10px] text-muted-foreground">Ley 1581 · Cumplimiento</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={startNewChat}
              disabled={loading}
              aria-label="Nueva conversación"
              title="Nueva conversación"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div
            ref={messagesRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2.5 [scrollbar-gutter:stable]"
          >
            <div className="space-y-2.5 pr-0.5">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {loading && (
                <div className="flex gap-1.5">
                  <span className="text-sm">{ROBOT_EMOJI}</span>
                  <div className="rounded-xl rounded-bl-sm border bg-card px-2.5 py-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Pensando…
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {messages.length <= 1 && (
            <div className="shrink-0 border-t bg-muted/20 px-3 py-2">
              <p className="mb-1.5 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                Sugerencias
              </p>
              <div className="flex flex-wrap gap-1">
                {prompts.map((prompt) => (
                  <Badge
                    key={prompt}
                    variant="secondary"
                    className="cursor-pointer px-2 py-0.5 text-[10px] font-normal hover:bg-primary/10 hover:text-primary"
                    onClick={() => void send(prompt)}
                  >
                    {prompt}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="shrink-0 border-t p-2">
            <div className="flex items-end gap-1.5">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe aquí…"
                rows={1}
                disabled={loading}
                className="min-h-[36px] max-h-16 resize-none rounded-lg border-border/80 bg-background text-xs"
              />
              <Button
                type="button"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-lg"
                disabled={loading || !input.trim()}
                onClick={() => void send(input)}
                aria-label="Enviar mensaje"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label={open ? "Cerrar asistente IA" : "Abrir asistente IA"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-4 right-3 z-50 flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full text-[1.75rem] leading-none transition-transform sm:right-5",
          open
            ? "bg-muted text-foreground shadow-md hover:scale-95"
            : "chat-fab bg-gradient-to-br from-primary via-primary to-teal-600 text-white hover:scale-105"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <span className="select-none">{ROBOT_EMOJI}</span>}
      </button>
    </>
  );
}
