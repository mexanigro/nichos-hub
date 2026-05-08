"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  HeadphonesIcon,
  MessageCircle,
  Send,
  ArrowLeft,
  Sparkles,
  Loader2,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { ProviderMessage, MessageCategory } from "@/types";

const tabs: { key: MessageCategory | "all"; label: string; icon: typeof Wrench }[] = [
  { key: "all", label: "Todos", icon: MessageCircle },
  { key: "maintenance", label: "Mantenimiento", icon: Wrench },
  { key: "support", label: "Soporte", icon: HeadphonesIcon },
  { key: "conversation", label: "Conversación", icon: MessageCircle },
];

export default function MessagesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<ProviderMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MessageCategory | "all">("all");
  const [selected, setSelected] = useState<ProviderMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [classifying, setClassifying] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<ProviderMessage[]>([]);

  useEffect(() => {
    if (session?.user?.role !== "owner") {
      router.push("/sales");
      return;
    }
    fetchMessages();
  }, [session, router]);

  async function fetchMessages() {
    const res = await fetch("/api/messages");
    if (res.ok) {
      const data = await res.json();
      setMessages(data.map((m: ProviderMessage) => ({
        ...m,
        createdAt: new Date(m.createdAt),
      })));
    }
    setLoading(false);
  }

  async function handleClassify(msgId: string) {
    setClassifying(msgId);
    const res = await fetch("/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msgId }),
    });
    if (res.ok) {
      const result = await res.json();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, category: result.category, categoryReason: result.reason } : m
        )
      );
      if (selected?.id === msgId) {
        setSelected((s) => s ? { ...s, category: result.category, categoryReason: result.reason } : s);
      }
    }
    setClassifying(null);
  }

  async function openMessage(msg: ProviderMessage) {
    setSelected(msg);
    setReplyText("");

    if (msg.status === "new") {
      fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msg.id, status: "read" }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: "read" } : m))
      );
    }

    const res = await fetch(`/api/messages/thread?parentId=${msg.id}&clientId=${msg.clientId}`);
    if (res.ok) {
      const thread = await res.json();
      setThreadMessages(thread.map((t: ProviderMessage) => ({ ...t, createdAt: new Date(t.createdAt) })));
    } else {
      setThreadMessages([]);
    }
  }

  async function handleReply() {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    const res = await fetch("/api/messages/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentId: selected.id,
        clientId: selected.clientId,
        businessName: selected.businessName,
        message: replyText,
      }),
    });
    if (res.ok) {
      const newMsg = await res.json();
      setThreadMessages((prev) => [
        ...prev,
        {
          id: newMsg.id,
          clientId: selected.clientId,
          businessName: selected.businessName,
          message: replyText,
          sender: "provider" as const,
          parentId: selected.id,
          status: "new" as const,
          createdAt: new Date(),
        },
      ]);
      setReplyText("");
    }
    setSending(false);
  }

  const filtered = activeTab === "all" ? messages : messages.filter((m) => m.category === activeTab);
  const unreadCounts = {
    all: messages.filter((m) => m.status === "new").length,
    maintenance: messages.filter((m) => m.category === "maintenance" && m.status === "new").length,
    support: messages.filter((m) => m.category === "support" && m.status === "new").length,
    conversation: messages.filter((m) => m.category === "conversation" && m.status === "new").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (selected) {
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft size={14} />
          Volver a mensajes
        </button>
        <div className="rounded-xl border border-border bg-bg-card">
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-text">{selected.businessName}</h2>
                <p className="text-[11px] text-text-muted">{selected.clientId}</p>
              </div>
              {selected.category ? (
                <span className="rounded-md bg-bg-elevated px-2 py-1 text-[10px] font-semibold text-text-secondary">
                  {selected.category}
                </span>
              ) : (
                <button
                  onClick={() => handleClassify(selected.id)}
                  disabled={classifying === selected.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent-muted px-2.5 py-1.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent/20"
                >
                  {classifying === selected.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  Clasificar
                </button>
              )}
            </div>
          </div>

          {/* Thread */}
          <div className="max-h-96 space-y-3 overflow-y-auto p-4">
            {/* Original message */}
            <div className="rounded-lg bg-bg-elevated p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-accent">Cliente</span>
                <span className="text-[10px] text-text-muted">
                  {formatDistanceToNow(selected.createdAt, { addSuffix: true, locale: es })}
                </span>
              </div>
              <p className="text-sm text-text">{selected.message}</p>
              {selected.categoryReason && (
                <p className="mt-2 text-[10px] text-text-muted italic">IA: {selected.categoryReason}</p>
              )}
            </div>

            {/* Thread replies */}
            {threadMessages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg p-3 ${
                  msg.sender === "provider" ? "ml-6 bg-accent-muted" : "bg-bg-elevated"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className={`text-[10px] font-semibold ${msg.sender === "provider" ? "text-accent" : "text-success"}`}>
                    {msg.sender === "provider" ? "Tú" : "Cliente"}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {formatDistanceToNow(msg.createdAt, { addSuffix: true, locale: es })}
                  </span>
                </div>
                <p className="text-sm text-text">{msg.message}</p>
              </div>
            ))}
          </div>

          {/* Reply */}
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribir respuesta..."
                rows={2}
                className="flex-1 resize-none rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleReply();
                }}
              />
              <button
                onClick={handleReply}
                disabled={sending || !replyText.trim()}
                className="self-end rounded-lg bg-accent px-3 py-2 text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
            <p className="mt-1 text-[10px] text-text-muted">Ctrl+Enter para enviar</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-text">Mensajes</h1>
        <p className="text-xs text-text-muted">{messages.length} mensajes de clientes</p>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-border bg-bg-card p-1 scrollbar-none">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium transition-colors ${
              activeTab === key
                ? "bg-accent-muted text-accent"
                : "text-text-secondary hover:bg-bg-hover hover:text-text"
            }`}
          >
            <Icon size={14} />
            {label}
            {unreadCounts[key] > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {unreadCounts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Message List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Sin mensajes"
          description={activeTab === "all" ? "No hay mensajes de clientes" : `No hay mensajes de ${activeTab}`}
        />
      ) : (
        <div className="space-y-1">
          {filtered.map((msg) => (
            <button
              key={msg.id}
              onClick={() => openMessage(msg)}
              className={`flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-bg-hover ${
                msg.status === "new" ? "bg-bg-card" : "bg-transparent"
              }`}
            >
              {msg.status === "new" && (
                <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />
              )}
              <div className="flex-1 min-w-0">
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="text-xs font-semibold text-text">{msg.businessName}</span>
                  {msg.category && (
                    <span className="rounded bg-bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                      {msg.category}
                    </span>
                  )}
                  {!msg.category && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClassify(msg.id);
                      }}
                      disabled={classifying === msg.id}
                      className="rounded bg-accent-muted px-1.5 py-0.5 text-[10px] font-medium text-accent hover:bg-accent/20"
                    >
                      {classifying === msg.id ? "..." : "Clasificar"}
                    </button>
                  )}
                </div>
                <p className="truncate text-xs text-text-secondary">{msg.message}</p>
              </div>
              <span className="flex-shrink-0 text-[10px] text-text-muted">
                {formatDistanceToNow(msg.createdAt, { addSuffix: true, locale: es })}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
