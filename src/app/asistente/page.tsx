"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Send,
  Copy,
  Check,
  Trash2,
  Bot,
  User,
  Sparkles,
} from "lucide-react";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  copied?: boolean;
}

export default function AsistentePage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (authStatus === "loading") return;
    if (session?.user?.role !== "owner") {
      router.push("/clients");
    }
  }, [session, authStatus, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    const assistantMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    const newMessages = [...messages, userMsg];
    setMessages([...newMessages, assistantMsg]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/sales-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error" }));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: `Error: ${err.error || "No se pudo generar respuesta"}` }
              : m
          )
        );
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setStreaming(false);
        return;
      }

      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              accumulated += `\n\nError: ${parsed.error}`;
            } else if (parsed.text) {
              accumulated += parsed.text;
            }
          } catch {
            // skip malformed chunks
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: accumulated } : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: "Error de conexion. Intenta de nuevo." }
            : m
        )
      );
    }

    setStreaming(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleCopy(msg: ChatMsg) {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  }

  function handleClear() {
    setMessages([]);
    setInput("");
  }

  if (authStatus === "loading") {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col lg:h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-to">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-text">
              Asistente de ventas
            </h1>
            <p className="text-xs text-text-muted">
              Pega el mensaje del prospecto y obtene una respuesta lista para copiar
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text"
          >
            <Trash2 size={14} />
            Limpiar
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted">
              <Bot size={28} className="text-accent" />
            </div>
            <div className="max-w-sm">
              <p className="text-sm font-medium text-text">
                Pega lo que te escribio el prospecto
              </p>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">
                El asistente responde con conocimiento completo de Arzac Studio,
                en el idioma del prospecto. Copia la respuesta con un click.
              </p>
            </div>
            <div className="mt-2 grid gap-2 text-left">
              {[
                "כמה עולה אתר?",
                "What do you include?",
                "Cuanto tarda hacer la web?",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setInput(example)}
                  className="rounded-lg border border-border bg-bg-card px-4 py-2.5 text-left text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-muted">
                    <Bot size={14} className="text-accent" />
                  </div>
                )}
                <div
                  className={`group relative max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-accent text-white"
                      : "bg-bg-card text-text border border-border"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content || (
                      <span className="inline-flex items-center gap-1.5 text-text-muted">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent [animation-delay:150ms]" />
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent [animation-delay:300ms]" />
                      </span>
                    )}
                  </div>
                  {msg.role === "assistant" && msg.content && (
                    <button
                      onClick={() => handleCopy(msg)}
                      className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-bg-card text-text-muted opacity-0 shadow-sm transition-all hover:text-text group-hover:opacity-100"
                      title="Copiar respuesta"
                    >
                      {copiedId === msg.id ? (
                        <Check size={13} className="text-success" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg-elevated">
                    <User size={14} className="text-text-secondary" />
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 pb-4 pt-3 lg:px-6">
        <div className="mx-auto flex max-w-2xl items-end gap-3">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pega el mensaje del prospecto..."
              rows={1}
              className="w-full resize-none rounded-xl border border-border bg-bg-card px-4 py-3 pr-12 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              style={{
                minHeight: "48px",
                maxHeight: "160px",
                height: "auto",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-2xl text-center text-[10px] text-text-muted">
          Respuestas generadas por IA. Verifica antes de enviar al prospecto.
        </p>
      </div>
    </div>
  );
}
