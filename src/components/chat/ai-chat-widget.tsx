import { useEffect, useMemo, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Bot, Loader2, Mail, Paperclip, Send, Sparkles, X } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SESSION_KEY = "cavaltec.chat.sessionId";

function getSessionId(): string {
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
    content: `Hola${userName ? `, ${userName.split(" ")[0]}` : ""}. Soy el asistente IA de CAVALTEC. Puedo ayudarte con la Ley 1581, consultar diagnósticos, explicar tu puntaje de cumplimiento o guiarte en el centro de cumplimiento.`,
    createdAt: Date.now(),
  };
}

function suggestedPrompts(role: string | undefined): string[] {
  if (role === "admin" || role === "auditor") {
    return [
      "¿Qué empresas tienen bajo cumplimiento?",
      "Resume el diagnóstico más reciente",
      "¿Cuántas evaluaciones hay registradas?",
    ];
  }
  if (isCompanyUser(role ?? "company")) {
    return [
      "¿Cuál es mi último puntaje de cumplimiento?",
      "¿Qué debo mejorar según mi diagnóstico?",
      "Explícame mis derechos ARCO",
    ];
  }
  return [
    "¿Qué es la Ley 1581?",
    "¿Cómo interpreto mi puntaje?",
    "Ayúdame con recomendaciones de cumplimiento",
  ];
}

function AttachmentList({ items }: { items: ChatAttachment[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-2 space-y-1">
      {items.map((file) => (
        <div
          key={`${file.name}-${file.url ?? "local"}`}
          className="flex items-center gap-2 rounded-lg border bg-background/80 px-2 py-1.5 text-xs"
        >
          <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {file.url ? (
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="truncate text-primary hover:underline"
            >
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
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="h-3.5 w-3.5" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border bg-card text-foreground"
        )}
      >
        {!isUser && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary/80">
            Asistente IA
          </p>
        )}
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
  const [sessionId] = useState(getSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    user ? [welcomeMessage(user.name)] : []
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const prompts = useMemo(() => suggestedPrompts(user?.role), [user?.role]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => textareaRef.current?.focus(), 150);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  if (!user) return null;

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
        <div className="fixed bottom-24 right-4 z-50 flex w-[min(calc(100vw-2rem),420px)] flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 sm:right-6">
          <div className="flex items-center gap-3 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Asistente CAVALTEC</p>
              <p className="truncate text-xs text-muted-foreground">Ley 1581 · Diagnósticos · Cumplimiento</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-[min(52vh,420px)] px-4 py-4">
            <div className="space-y-4 pr-1">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md border bg-card px-3.5 py-2.5 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Pensando…
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {messages.length <= 1 && (
            <div className="border-t bg-muted/20 px-4 py-3">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                Sugerencias
              </p>
              <div className="flex flex-wrap gap-1.5">
                {prompts.map((prompt) => (
                  <Badge
                    key={prompt}
                    variant="secondary"
                    className="cursor-pointer px-2.5 py-1 text-[11px] font-normal hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={() => void send(prompt)}
                  >
                    {prompt}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="border-t p-3.5 bg-muted/10">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta… (Enter para enviar)"
                rows={2}
                disabled={loading}
                className="min-h-[44px] max-h-28 resize-none rounded-xl border-border/80 bg-background text-sm"
              />
              <Button
                type="button"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-xl shadow-sm"
                disabled={loading || !input.trim()}
                onClick={() => void send(input)}
                aria-label="Enviar mensaje"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Mail className="h-3 w-3" />
              Puedes consultar diagnósticos y cumplimiento según tus permisos.
            </p>
          </div>
        </div>
      )}

      <Button
        type="button"
        size="icon"
        aria-label={open ? "Cerrar asistente IA" : "Abrir asistente IA"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-6 right-4 z-50 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105 sm:right-6",
          open
            ? "bg-muted text-foreground hover:bg-muted"
            : "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground hover:shadow-xl"
        )}
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-6 w-6" />}
      </Button>
    </>
  );
}
