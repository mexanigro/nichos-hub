"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  Send,
  MapPin,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Prospect, ProspectStatus, ProspectNote } from "@/types";

const columns: { key: ProspectStatus; label: string; color: string; bgColor: string }[] = [
  { key: "following", label: "En seguimiento", color: "text-accent", bgColor: "bg-accent-muted" },
  { key: "rejected", label: "Rechazado", color: "text-danger", bgColor: "bg-danger-muted" },
  { key: "closed", label: "Cerrado", color: "text-success", bgColor: "bg-success-muted" },
];

export default function SalesPage() {
  const { data: session } = useSession();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [sellers, setSellers] = useState<string[]>([]);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [moving, setMoving] = useState<string | null>(null);
  const [addingNote, setAddingNote] = useState(false);
  const [creating, setCreating] = useState(false);

  const isOwner = session?.user?.role === "owner";

  useEffect(() => {
    fetchProspects();
    if (isOwner) fetchSellers();
  }, [isOwner]);

  async function fetchProspects() {
    const res = await fetch("/api/sales");
    if (res.ok) {
      const data = await res.json();
      setProspects(
        data.map((p: Prospect) => ({
          ...p,
          lastContact: new Date(p.lastContact),
          createdAt: new Date(p.createdAt),
          notes: p.notes.map((n: ProspectNote) => ({
            ...n,
            createdAt: new Date(n.createdAt),
          })),
        }))
      );
    }
    setLoading(false);
  }

  async function fetchSellers() {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setSellers(data.map((u: { email: string }) => u.email));
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form);

    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowForm(false);
      fetchProspects();
    }
    setCreating(false);
  }

  async function moveProspect(id: string, newStatus: ProspectStatus, reason?: string) {
    setMoving(id);
    const body: Record<string, unknown> = { id, status: newStatus };
    if (reason) body.rejectionReason = reason;

    await fetch("/api/sales", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setProspects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: newStatus, rejectionReason: reason || p.rejectionReason } : p
      )
    );
    setRejectionReason("");
    setRejectTarget(null);
    setMoving(null);
  }

  async function addNote(prospectId: string) {
    if (!noteText.trim()) return;
    setAddingNote(true);

    await fetch("/api/sales/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prospectId, text: noteText }),
    });

    setProspects((prev) =>
      prev.map((p) =>
        p.id === prospectId
          ? {
              ...p,
              lastContact: new Date(),
              notes: [
                ...p.notes,
                {
                  text: noteText,
                  author: session?.user?.email || "unknown",
                  createdAt: new Date(),
                },
              ],
            }
          : p
      )
    );
    setNoteText("");
    setAddingNote(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-text">Ventas</h1>
          <p className="text-xs text-text-muted">{prospects.length} prospectos</p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus size={14} />
            Nuevo prospecto
          </button>
        )}
      </div>

      {/* Kanban */}
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map(({ key, label, color, bgColor }) => {
          const colProspects = prospects.filter((p) => p.status === key);
          return (
            <div key={key} className="rounded-xl border border-border bg-bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${bgColor.replace("-muted", "").replace("bg-", "bg-")}`} style={{background: key === "following" ? "#3b82f6" : key === "rejected" ? "#ef4444" : "#22c55e"}} />
                  <span className={`text-xs font-semibold ${color}`}>{label}</span>
                </div>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-bg-elevated px-2 text-[10px] font-bold text-text-muted">
                  {colProspects.length}
                </span>
              </div>

              <div className="space-y-2 p-4">
                {colProspects.length === 0 ? (
                  <p className="py-8 text-center text-[11px] text-text-muted">Sin prospectos</p>
                ) : (
                  colProspects.map((prospect) => {
                    const isExpanded = expandedId === prospect.id;
                    return (
                      <div
                        key={prospect.id}
                        className="rounded-lg border border-border bg-bg-elevated p-4 transition-colors hover:border-border-hover"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-xs font-semibold text-text">
                              {prospect.businessName}
                            </h4>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-text-muted">
                              <span className="inline-flex items-center gap-0.5">
                                <MapPin size={9} />
                                {prospect.city}
                              </span>
                              <span className="rounded-md bg-bg-active px-2 py-0.5 font-medium">
                                {prospect.nicheTarget}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : prospect.id)}
                            className="p-0.5 text-text-muted hover:text-text"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-[10px] text-text-muted">
                          <User size={9} />
                          <span className="truncate">{prospect.assignedSeller || "Sin asignar"}</span>
                          <span className="ml-auto inline-flex items-center gap-0.5">
                            <Clock size={9} />
                            {formatDistanceToNow(prospect.lastContact, { addSuffix: true, locale: es })}
                          </span>
                        </div>

                        {prospect.rejectionReason && key === "rejected" && (
                          <p className="mt-2 rounded-md bg-danger-muted px-2.5 py-1 text-[10px] text-danger">
                            {prospect.rejectionReason}
                          </p>
                        )}

                        {isExpanded && (
                          <div className="mt-3 space-y-2 border-t border-border pt-3">
                            {/* Move buttons */}
                            <div className="flex gap-1">
                              {key !== "following" && (
                                <button
                                  onClick={() => moveProspect(prospect.id, "following")}
                                  disabled={moving === prospect.id}
                                  className="flex items-center gap-1 rounded bg-accent-muted px-2 py-1 text-[10px] font-medium text-accent hover:bg-accent/20 disabled:opacity-50"
                                >
                                  <ArrowLeft size={10} />
                                  Seguimiento
                                </button>
                              )}
                              {key !== "rejected" && (
                                <button
                                  onClick={() => {
                                    setRejectTarget(prospect.id);
                                    setRejectionReason("");
                                  }}
                                  disabled={moving === prospect.id}
                                  className="flex items-center gap-1 rounded bg-danger-muted px-2 py-1 text-[10px] font-medium text-danger hover:bg-danger/20 disabled:opacity-50"
                                >
                                  Rechazar
                                </button>
                              )}
                              {key !== "closed" && (
                                <button
                                  onClick={() => moveProspect(prospect.id, "closed")}
                                  disabled={moving === prospect.id}
                                  className="flex items-center gap-1 rounded bg-success-muted px-2 py-1 text-[10px] font-medium text-success hover:bg-success/20 disabled:opacity-50"
                                >
                                  Cerrar
                                  <ArrowRight size={10} />
                                </button>
                              )}
                            </div>

                            {/* Notes */}
                            {prospect.notes.length > 0 && (
                              <div className="max-h-32 space-y-1 overflow-y-auto">
                                {prospect.notes.map((note, i) => (
                                  <div key={i} className="rounded bg-bg-card p-3">
                                    <p className="text-[11px] text-text-secondary">{note.text}</p>
                                    <p className="mt-0.5 text-[9px] text-text-muted">
                                      {note.author} &middot;{" "}
                                      {formatDistanceToNow(note.createdAt, { addSuffix: true, locale: es })}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add note */}
                            <div className="flex gap-1">
                              <input
                                type="text"
                                placeholder="Agregar nota..."
                                value={expandedId === prospect.id ? noteText : ""}
                                onChange={(e) => setNoteText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") addNote(prospect.id);
                                }}
                                className="flex-1 rounded border border-border bg-bg-card px-2 py-1 text-[11px] text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                              />
                              <button
                                onClick={() => addNote(prospect.id)}
                                disabled={addingNote}
                                className="rounded bg-accent px-2 py-1 text-white hover:bg-accent-hover disabled:opacity-50"
                              >
                                <Send size={10} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rejection Reason Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-bg-card p-6">
            <h2 className="mb-1 text-sm font-semibold text-text">Rechazar prospecto</h2>
            <p className="mb-4 text-xs text-text-muted">Indicá el motivo del rechazo</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Motivo de rechazo..."
              rows={3}
              autoFocus
              className="w-full resize-none rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setRejectTarget(null); setRejectionReason(""); }}
                disabled={moving === rejectTarget}
                className="rounded-lg px-3 py-2 text-xs font-medium text-text-secondary hover:text-text"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (rejectionReason.trim()) {
                    moveProspect(rejectTarget, "rejected", rejectionReason.trim());
                  }
                }}
                disabled={!rejectionReason.trim() || moving === rejectTarget}
                className="rounded-lg bg-danger px-4 py-2 text-xs font-medium text-white hover:bg-danger/80 disabled:opacity-50"
              >
                {moving === rejectTarget ? "Rechazando..." : "Rechazar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Prospect Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">Nuevo prospecto</h2>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-text-muted">Nombre del negocio *</label>
                <input name="businessName" required className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-text-muted">Ciudad *</label>
                  <input name="city" required className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-text-muted">Nicho target *</label>
                  <select name="nicheTarget" required className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text focus:border-accent focus:outline-none">
                    <option value="barberia">Barbería</option>
                    <option value="estetica">Estética</option>
                    <option value="tattoo">Tattoo</option>
                    <option value="nails">Nails</option>
                    <option value="cafeteria">Cafetería</option>
                    <option value="remodelaciones">Remodelaciones</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-text-muted">Vendedor asignado</label>
                {sellers.length > 0 ? (
                  <select name="assignedSeller" className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text focus:border-accent focus:outline-none">
                    <option value="">Sin asignar</option>
                    {sellers.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <input name="assignedSeller" type="email" placeholder="email@vendedor.com" className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none" />
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} disabled={creating} className="rounded-lg px-3 py-2 text-xs font-medium text-text-secondary hover:text-text">
                  Cancelar
                </button>
                <button type="submit" disabled={creating} className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50">
                  {creating ? "Creando..." : "Crear prospecto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
