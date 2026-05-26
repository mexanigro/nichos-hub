"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Mail,
  Phone,
  Clock,
  Inbox,
  Search,
  Loader2,
  Archive,
  Check,
  Eye,
  Download,
  X,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

type LeadStatus = "new" | "read" | "replied" | "archived";
type LeadSource = "web" | "chat" | "manual" | "whatsapp";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  source: LeadSource;
  status: LeadStatus;
  customerId?: string;
  repliedAt?: string | null;
  createdAt: string | null;
}

interface LeadsResponse {
  leads: Lead[];
  nextCursor: string | null;
  pageSize: number;
}

const STATUS_STYLES: Record<LeadStatus, { label: string; className: string }> = {
  new:      { label: "Nuevo",      className: "bg-accent/15 text-accent" },
  read:     { label: "Leido",      className: "bg-bg-elevated text-text-secondary" },
  replied:  { label: "Respondido", className: "bg-success/15 text-success" },
  archived: { label: "Archivado",  className: "bg-bg-elevated text-text-muted" },
};

const SOURCE_LABELS: Record<LeadSource, string> = {
  web: "Web",
  chat: "Chat",
  manual: "Manual",
  whatsapp: "WhatsApp",
};

const FILTERS: { key: LeadStatus | "all"; label: string }[] = [
  { key: "all",      label: "Todos" },
  { key: "new",      label: "Nuevos" },
  { key: "read",     label: "Leidos" },
  { key: "replied",  label: "Respondidos" },
  { key: "archived", label: "Archivados" },
];

export function ClientLeadsTab({ clientId }: { clientId: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (cursor: string | null) => {
      const url = cursor
        ? `/api/leads/${clientId}?after=${encodeURIComponent(cursor)}`
        : `/api/leads/${clientId}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al cargar leads");
      }
      const data = (await res.json()) as LeadsResponse;
      return data;
    },
    [clientId],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPage(null)
      .then((data) => {
        if (cancelled) return;
        setLeads(data.leads);
        setNextCursor(data.nextCursor);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const data = await fetchPage(nextCursor);
      setLeads((prev) => [...prev, ...data.leads]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar mas leads");
    } finally {
      setLoadingMore(false);
    }
  }

  async function updateStatus(leadId: string, status: LeadStatus) {
    setUpdatingId(leadId);
    setError("");
    // Optimistic
    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === leadId ? { ...l, status } : l)));
    try {
      const res = await fetch(`/api/leads/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al actualizar el lead");
      }
    } catch (err) {
      setLeads(prev); // revert
      setError(err instanceof Error ? err.message : "Error al actualizar el lead");
    } finally {
      setUpdatingId(null);
    }
  }

  // Filter + search locally over the loaded window.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (filter !== "all" && l.status !== filter) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.phone || "").toLowerCase().includes(q) ||
        (l.subject || "").toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q)
      );
    });
  }, [leads, filter, search]);

  const counts = useMemo(() => {
    const c: Record<LeadStatus, number> = { new: 0, read: 0, replied: 0, archived: 0 };
    for (const l of leads) c[l.status] += 1;
    return c;
  }, [leads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Inbox size={14} className="text-accent" />
          <h3 className="text-sm font-semibold text-text">Leads</h3>
          {counts.new > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
              {counts.new} nuevo{counts.new !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <span>{leads.length} cargados{nextCursor ? "+" : ""}</span>
          <button
            type="button"
            onClick={() => exportLeadsToCsv(visible.length ? visible : leads)}
            disabled={leads.length === 0}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-text-secondary transition-colors hover:bg-bg-hover disabled:opacity-40"
            title="Exportar a CSV"
          >
            <Download size={11} />
            Exportar
          </button>
        </div>
      </div>

      {/* ── Search + Filter ──────────────────────────────────────────── */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email, asunto, mensaje..."
            className="w-full rounded-lg border border-border bg-bg-card py-1.5 pl-8 pr-8 text-xs text-text placeholder:text-text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted hover:bg-bg-hover hover:text-text"
              aria-label="Limpiar busqueda"
            >
              <X size={11} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map(({ key, label }) => {
            const active = filter === key;
            const count = key === "all" ? leads.length : counts[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "bg-accent text-white"
                    : "border border-border bg-bg-card text-text-secondary hover:bg-bg-hover hover:text-text"
                }`}
              >
                {label}
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0 text-[10px] tabular-nums ${
                      active ? "bg-white/20" : "bg-bg-elevated text-text-muted"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────── */}
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] text-red-400">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      {/* ── List ─────────────────────────────────────────────────────── */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-card py-12 text-center">
          <Inbox size={24} className="mx-auto mb-2 text-text-muted" />
          <p className="text-xs text-text-muted">
            {search
              ? `Sin resultados para "${search}"`
              : filter === "all"
                ? "Este cliente todavia no tiene leads del formulario de contacto"
                : `No hay leads con estado "${FILTERS.find((f) => f.key === filter)?.label}"`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              busy={updatingId === lead.id}
              onStatusChange={(s) => updateStatus(lead.id, s)}
            />
          ))}
        </div>
      )}

      {/* ── Load more ────────────────────────────────────────────────── */}
      {nextCursor && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text disabled:opacity-50"
          >
            {loadingMore ? <Loader2 size={12} className="animate-spin" /> : null}
            {loadingMore ? "Cargando..." : "Cargar mas"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Lead card ────────────────────────────────────────────────────── */

function LeadCard({
  lead,
  busy,
  onStatusChange,
}: {
  lead: Lead;
  busy: boolean;
  onStatusChange: (status: LeadStatus) => void;
}) {
  const phoneClean = (lead.phone || "").replace(/[^\d+]/g, "");
  const replyHref = phoneClean ? `https://wa.me/${phoneClean.replace(/^\+/, "")}` : "";
  const mailtoHref = lead.email
    ? `mailto:${lead.email}${lead.subject ? `?subject=${encodeURIComponent(`Re: ${lead.subject}`)}` : ""}`
    : "";

  const isArchived = lead.status === "archived";

  return (
    <div
      className={`rounded-xl border bg-bg-card p-4 transition-colors ${
        isArchived ? "border-border/50 opacity-60" : "border-border hover:border-border-hover"
      } ${lead.status === "new" ? "border-l-2 border-l-accent" : ""}`}
    >
      {/* Top row: name + status + time */}
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-xs font-semibold text-text">{lead.name || "Sin nombre"}</span>
            <span
              className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLES[lead.status].className}`}
            >
              {STATUS_STYLES[lead.status].label}
            </span>
            <span className="shrink-0 rounded bg-bg-elevated px-1.5 py-0.5 text-[10px] text-text-muted">
              {SOURCE_LABELS[lead.source] ?? lead.source}
            </span>
          </div>
          {lead.subject && (
            <p className="mt-0.5 truncate text-[11px] font-medium text-text-secondary">{lead.subject}</p>
          )}
        </div>
        <span className="flex shrink-0 items-center gap-1 text-[10px] text-text-muted" title={lead.createdAt || ""}>
          <Clock size={10} />
          {lead.createdAt
            ? formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: es })
            : "—"}
        </span>
      </div>

      {/* Message */}
      <p className="mb-3 whitespace-pre-wrap text-xs leading-relaxed text-text-secondary">{lead.message}</p>

      {/* Bottom row: contact links + actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {mailtoHref && (
            <a
              href={mailtoHref}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-elevated px-2 py-1 text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
              title={`Responder por email a ${lead.email}`}
            >
              <Mail size={10} />
              <span className="max-w-[180px] truncate font-mono text-[10px]">{lead.email}</span>
            </a>
          )}
          {replyHref && (
            <a
              href={replyHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-green-500/30 bg-green-500/5 px-2 py-1 text-green-400 transition-colors hover:bg-green-500/10"
              title={`WhatsApp ${lead.phone}`}
            >
              <Phone size={10} />
              <span className="font-mono text-[10px]">{lead.phone}</span>
            </a>
          )}
          {!replyHref && lead.phone && (
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-elevated px-2 py-1 text-text-muted">
              <Phone size={10} />
              <span className="font-mono text-[10px]">{lead.phone}</span>
            </span>
          )}
        </div>
        <LeadActions lead={lead} busy={busy} onStatusChange={onStatusChange} />
      </div>

      {/* Footer meta */}
      {lead.repliedAt && (
        <p className="mt-2 text-[10px] text-text-muted">
          Respondido {formatDistanceToNow(new Date(lead.repliedAt), { addSuffix: true, locale: es })}
        </p>
      )}
    </div>
  );
}

/* ─── Actions ──────────────────────────────────────────────────────── */

function LeadActions({
  lead,
  busy,
  onStatusChange,
}: {
  lead: Lead;
  busy: boolean;
  onStatusChange: (status: LeadStatus) => void;
}) {
  const baseBtn =
    "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  if (lead.status === "archived") {
    return (
      <div className="flex items-center gap-1">
        {busy && <Loader2 size={11} className="animate-spin text-text-muted" />}
        <button
          type="button"
          onClick={() => onStatusChange("new")}
          disabled={busy}
          className={`${baseBtn} border-border bg-bg-card text-text-secondary hover:bg-bg-hover hover:text-text`}
          title="Restaurar a Nuevo"
        >
          <Eye size={11} />
          Restaurar
        </button>
      </div>
    );
  }

  // Primary action depends on current status — one CTA per state to keep
  // visual weight low. Secondary actions live in a quieter icon row.
  return (
    <div className="flex items-center gap-1">
      {busy && <Loader2 size={11} className="animate-spin text-text-muted" />}

      {lead.status === "new" && (
        <button
          type="button"
          onClick={() => onStatusChange("read")}
          disabled={busy}
          className={`${baseBtn} border-border bg-bg-card text-text-secondary hover:bg-bg-hover hover:text-text`}
          title="Marcar como leido"
        >
          <Eye size={11} />
          Leido
        </button>
      )}

      {lead.status !== "replied" && (
        <button
          type="button"
          onClick={() => onStatusChange("replied")}
          disabled={busy}
          className={`${baseBtn} border-success/30 bg-success/10 text-success hover:bg-success/15`}
          title="Marcar como respondido"
        >
          <Check size={11} />
          Respondido
        </button>
      )}

      <button
        type="button"
        onClick={() => onStatusChange("archived")}
        disabled={busy}
        className={`${baseBtn} border-border bg-bg-card text-text-muted hover:bg-bg-hover`}
        title="Archivar"
      >
        <Archive size={11} />
      </button>
    </div>
  );
}

/* ─── CSV Export ───────────────────────────────────────────────────── */

function exportLeadsToCsv(leads: Lead[]): void {
  if (leads.length === 0) return;
  const headers = [
    "id",
    "createdAt",
    "name",
    "email",
    "phone",
    "source",
    "status",
    "subject",
    "message",
    "repliedAt",
  ];
  const rows = leads.map((l) => [
    l.id,
    l.createdAt ? format(new Date(l.createdAt), "yyyy-MM-dd HH:mm") : "",
    l.name,
    l.email,
    l.phone || "",
    l.source,
    l.status,
    l.subject || "",
    l.message,
    l.repliedAt ? format(new Date(l.repliedAt), "yyyy-MM-dd HH:mm") : "",
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          // Escape per RFC 4180.
          if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
          return s;
        })
        .join(","),
    )
    .join("\r\n");

  // BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

