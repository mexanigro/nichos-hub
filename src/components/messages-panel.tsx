"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Send, Loader2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Messages thread panel for clients/[clientId] Overview.
 *
 * Reads from the parent-provided `messages` array (already fetched server-side
 * via /api/clients/[clientId]). Adds a reply textarea wired to POST
 * /api/messages/reply -- which writes a new provider_messages doc and marks
 * the parent as read.
 *
 * The reply targets the *latest client message* if any exists (because the
 * existing /api/messages/reply endpoint requires parentId). If there's no
 * client message yet, the textarea is disabled with a hint.
 */

type Message = {
  id: string;
  message: string;
  createdAt: string;
  sender: string;
  status: string;
};

export function MessagesPanel({
  clientId,
  businessName,
  messages: initialMessages,
}: {
  clientId: string;
  businessName: string;
  messages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Latest client message (oldest-first iteration is server-side desc, so
  // messages[0] is newest). We need the newest *client* message for parentId.
  const latestClientMessage = useMemo(
    () => messages.find((m) => m.sender === "client"),
    [messages],
  );

  useEffect(() => {
    // Scroll to bottom on first render so the most recent message is visible.
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, []);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    if (!latestClientMessage) {
      setError("Tenes que esperar a que el cliente escriba primero. La API requiere un mensaje padre.");
      return;
    }
    setSending(true);
    setError("");

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      message: text,
      createdAt: new Date().toISOString(),
      sender: "provider",
      status: "new",
    };
    setMessages((prev) => [optimistic, ...prev]);
    setDraft("");

    try {
      const res = await fetch("/api/messages/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: latestClientMessage.id,
          clientId,
          businessName,
          message: text,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al enviar");
      }
      const data = await res.json();
      // Swap the optimistic entry for the real id.
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...m, id: data.id } : m)),
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(text);
      setError(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <MessageSquare size={12} className="text-text-muted" />
        <h3 className="text-xs font-semibold text-text-muted">Mensajes del cliente</h3>
        <span className="ml-auto text-[10px] text-text-muted">{messages.length} total</span>
      </div>

      <div ref={scrollerRef} className="flex max-h-72 flex-col-reverse gap-2 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-text-muted">Sin mensajes todavia.</p>
        ) : (
          messages.map((msg) => {
            const isProvider = msg.sender === "provider";
            return (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-lg border px-3 py-2 ${
                  isProvider
                    ? "ml-auto border-accent/30 bg-accent/10"
                    : "border-border bg-bg-elevated"
                }`}
              >
                <div className="mb-0.5 flex items-center gap-2 text-[10px]">
                  <span
                    className={`font-semibold ${
                      isProvider ? "text-accent" : "text-success"
                    }`}
                  >
                    {isProvider ? "Vos" : "Cliente"}
                  </span>
                  <span className="text-text-muted">
                    {msg.createdAt
                      ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: es })
                      : "—"}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-xs text-text-secondary">{msg.message}</p>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-border px-3 py-2">
        {error && (
          <p className="mb-1.5 flex items-center gap-1 text-[10px] text-red-400">
            <AlertCircle size={10} />
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            placeholder={
              latestClientMessage
                ? "Escribi una respuesta... (Ctrl+Enter para enviar)"
                : "El cliente todavia no inicio una conversacion."
            }
            disabled={sending || !latestClientMessage}
            className="flex-1 resize-none rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text placeholder:text-text-muted/60 focus:border-accent focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !draft.trim() || !latestClientMessage}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
            title="Enviar respuesta"
            aria-label="Enviar respuesta"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
