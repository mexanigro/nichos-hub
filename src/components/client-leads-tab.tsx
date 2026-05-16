"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, Clock, Eye, Archive, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  source: "web" | "chat" | "manual";
  status: "new" | "read" | "replied" | "archived";
  createdAt: string;
}

const STATUS_STYLES: Record<Lead["status"], { label: string; className: string }> = {
  new: { label: "Nuevo", className: "bg-accent-muted text-accent" },
  read: { label: "Leído", className: "bg-bg-elevated text-text-secondary" },
  replied: { label: "Respondido", className: "bg-success-muted text-success" },
  archived: { label: "Archivado", className: "bg-bg-elevated text-text-muted" },
};

export function ClientLeadsTab({ clientId }: { clientId: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "read" | "replied">("all");

  useEffect(() => {
    fetch(`/api/leads/${clientId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLeads(data);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  const filtered = filter === "all" ? leads : leads.filter((l) => l.status === filter);
  const newCount = leads.filter((l) => l.status === "new").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox size={14} className="text-accent" />
          <h3 className="text-sm font-semibold text-text">
            Leads del formulario de contacto
          </h3>
          {newCount > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
              {newCount} nuevo{newCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-[11px] text-text-muted">{leads.length} total</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-1">
        {(["all", "new", "read", "replied"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
              filter === f
                ? "bg-accent text-white"
                : "text-text-secondary hover:bg-bg-hover hover:text-text"
            }`}
          >
            {f === "all" ? "Todos" : f === "new" ? "Nuevos" : f === "read" ? "Leídos" : "Respondidos"}
          </button>
        ))}
      </div>

      {/* Lead list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-card py-12 text-center">
          <Inbox size={24} className="mx-auto mb-2 text-text-muted" />
          <p className="text-xs text-text-muted">
            {filter === "all"
              ? "Este cliente aún no tiene leads del formulario de contacto"
              : `No hay leads con estado "${filter}"`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => (
            <div
              key={lead.id}
              className="rounded-xl border border-border bg-bg-card p-4 transition-colors hover:border-border-hover"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text">{lead.name}</span>
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLES[lead.status].className}`}>
                      {STATUS_STYLES[lead.status].label}
                    </span>
                  </div>
                  {lead.subject && (
                    <p className="mt-0.5 text-[11px] font-medium text-text-secondary">{lead.subject}</p>
                  )}
                </div>
                <span className="flex shrink-0 items-center gap-1 text-[10px] text-text-muted">
                  <Clock size={10} />
                  {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: es })}
                </span>
              </div>

              <p className="mb-2 text-xs leading-relaxed text-text-secondary">{lead.message}</p>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <Mail size={10} />
                  {lead.email}
                </span>
                {lead.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone size={10} />
                    {lead.phone}
                  </span>
                )}
                <span className="rounded bg-bg-elevated px-1.5 py-0.5 text-[10px]">
                  {lead.source}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
