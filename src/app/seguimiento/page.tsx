"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  ExternalLink,
  Calendar,
  Phone,
  Bell,
  Filter,
  X,
} from "lucide-react";
import type {
  ProspectFollowUp,
  ProspectFollowUpStatus,
  ProspectChannel,
} from "@/types";
import {
  ProspectStatusBadge,
  ProspectTimeline,
  getStatusConfig,
} from "@/components/prospect-timeline";

const ALL_STATUSES: { value: ProspectFollowUpStatus; label: string }[] = [
  { value: "web_created", label: "Web creada" },
  { value: "web_sent", label: "Web enviada" },
  { value: "web_viewed", label: "Vio la web" },
  { value: "interested", label: "Interesado" },
  { value: "payment_link_sent", label: "Link de pago enviado" },
  { value: "paid", label: "Pago" },
  { value: "not_interested", label: "No interesado" },
  { value: "follow_up_pending", label: "Follow-up pendiente" },
];

const CHANNELS: { value: ProspectChannel; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "gmail", label: "Gmail" },
];

function daysAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return `Hace ${diff} dias`;
}

function isDueToday(followUpDue?: string): boolean {
  if (!followUpDue) return false;
  return new Date(followUpDue) <= new Date();
}

export default function SeguimientoPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [prospects, setProspects] = useState<ProspectFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProspectFollowUpStatus | "all">("all");
  const [selected, setSelected] = useState<ProspectFollowUp | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);

  // New prospect form
  const [newForm, setNewForm] = useState({
    businessName: "",
    contactName: "",
    contactPhone: "",
    niche: "",
    deployUrl: "",
  });

  // Status change form
  const [statusChangeForm, setStatusChangeForm] = useState({
    status: "" as ProspectFollowUpStatus,
    note: "",
    channel: "" as ProspectChannel | "",
    webSentAt: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authStatus === "loading") return;
    if (session?.user?.role !== "owner") {
      router.push("/clients");
    }
  }, [session, authStatus, router]);

  const fetchProspects = useCallback(async () => {
    try {
      const res = await fetch("/api/prospects/follow-up");
      if (!res.ok) return;
      const data = await res.json();
      setProspects(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === "owner") fetchProspects();
  }, [session, fetchProspects]);

  const filtered = prospects.filter((p) => {
    const matchesSearch =
      !search ||
      p.businessName.toLowerCase().includes(search.toLowerCase()) ||
      p.contactName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = prospects.filter(
    (p) =>
      isDueToday(p.followUpDue) &&
      !["paid", "not_interested"].includes(p.status)
  ).length;

  const activeCount = prospects.filter(
    (p) => !["paid", "not_interested"].includes(p.status)
  ).length;

  async function handleCreate() {
    if (!newForm.businessName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/prospects/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      if (res.ok) {
        setShowNew(false);
        setNewForm({
          businessName: "",
          contactName: "",
          contactPhone: "",
          niche: "",
          deployUrl: "",
        });
        fetchProspects();
      }
    } catch {
      // silent
    }
    setSaving(false);
  }

  async function handleStatusChange() {
    if (!selected || !statusChangeForm.status) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        id: selected.id,
        status: statusChangeForm.status,
        note: statusChangeForm.note || undefined,
      };
      if (statusChangeForm.status === "web_sent") {
        body.channel = statusChangeForm.channel || undefined;
        body.webSentAt = statusChangeForm.webSentAt || undefined;
      }
      const res = await fetch("/api/prospects/follow-up", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowStatusChange(false);
        setStatusChangeForm({
          status: "" as ProspectFollowUpStatus,
          note: "",
          channel: "",
          webSentAt: "",
        });
        setSelected(null);
        fetchProspects();
      }
    } catch {
      // silent
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    try {
      await fetch("/api/prospects/follow-up", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setSelected(null);
      fetchProspects();
    } catch {
      // silent
    }
  }

  async function handleCheckFollowUps() {
    try {
      await fetch("/api/prospects/follow-up/check", { method: "POST" });
      fetchProspects();
    } catch {
      // silent
    }
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pb-12 pt-16 lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-text">
              Seguimiento de prospectos
            </h1>
            <p className="text-xs text-text-muted">
              {activeCount} activos
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                  <Bell size={10} />
                  {pendingCount} requieren follow-up hoy
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCheckFollowUps}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text"
            >
              <Bell size={14} />
              Verificar follow-ups
            </button>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Plus size={14} />
              Nuevo prospecto
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 lg:max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full rounded-lg border border-border bg-bg-card py-2 pl-9 pr-3 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-accent text-white"
                  : "bg-bg-card text-text-secondary hover:text-text border border-border"
              }`}
            >
              Todos
            </button>
            {ALL_STATUSES.filter(
              (s) => !["paid", "not_interested"].includes(s.value)
            ).map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                  statusFilter === s.value
                    ? "bg-accent text-white"
                    : "bg-bg-card text-text-secondary hover:text-text border border-border"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pending follow-ups alert */}
        {pendingCount > 0 && statusFilter === "all" && (
          <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-amber-400">
              <Bell size={14} />
              Prospectos que necesitan accion hoy
            </div>
            <div className="space-y-2">
              {prospects
                .filter(
                  (p) =>
                    isDueToday(p.followUpDue) &&
                    !["paid", "not_interested"].includes(p.status)
                )
                .map((p) => {
                  const sent = p.webSentAt ? new Date(p.webSentAt) : null;
                  const daysSince = sent
                    ? Math.floor(
                        (Date.now() - sent.getTime()) / (1000 * 60 * 60 * 24)
                      )
                    : 0;
                  const isDay7 = daysSince >= 7;

                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg bg-bg-card/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-text">
                          {p.contactName || p.businessName}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {isDay7
                            ? `"La web sigue disponible, te la guardo hasta el viernes"`
                            : `"¿Pudiste ver la seccion de servicios?"`}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelected(p);
                          setShowStatusChange(true);
                          setStatusChangeForm({
                            status: "" as ProspectFollowUpStatus,
                            note: "",
                            channel: "",
                            webSentAt: "",
                          });
                        }}
                        className="shrink-0 rounded-md bg-amber-500/15 px-2.5 py-1 text-[10px] font-medium text-amber-400 transition-colors hover:bg-amber-500/25"
                      >
                        Actualizar estado
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Prospects list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-bg-card py-16 text-center">
            <Filter size={28} className="mb-3 text-text-muted" />
            <p className="text-sm text-text-secondary">
              {prospects.length === 0
                ? "No hay prospectos aun"
                : "Ningun prospecto coincide con los filtros"}
            </p>
            {prospects.length === 0 && (
              <button
                onClick={() => setShowNew(true)}
                className="mt-3 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Agregar primer prospecto
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filtered.map((p) => {
              const config = getStatusConfig(p.status);
              const due = isDueToday(p.followUpDue);

              return (
                <div
                  key={p.id}
                  onClick={() => setSelected(selected?.id === p.id ? null : p)}
                  className={`cursor-pointer rounded-xl border bg-bg-card p-4 transition-all hover:border-border-hover ${
                    selected?.id === p.id
                      ? "border-accent ring-1 ring-accent/20"
                      : due
                        ? "border-amber-500/30"
                        : "border-border"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-text">
                          {p.businessName}
                        </span>
                        {due && (
                          <span className="shrink-0 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
                            HOY
                          </span>
                        )}
                      </div>
                      {p.contactName && (
                        <span className="text-xs text-text-muted">
                          {p.contactName}
                        </span>
                      )}
                    </div>
                    <ProspectStatusBadge status={p.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-text-muted">
                    {p.niche && (
                      <span className="rounded bg-bg-elevated px-1.5 py-0.5">
                        {p.niche}
                      </span>
                    )}
                    {p.webSentVia && (
                      <span className="rounded bg-bg-elevated px-1.5 py-0.5">
                        via {p.webSentVia}
                      </span>
                    )}
                    {p.webSentAt && (
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        Enviada {daysAgo(p.webSentAt)}
                      </span>
                    )}
                    {p.contactPhone && (
                      <span className="flex items-center gap-1">
                        <Phone size={10} />
                        {p.contactPhone}
                      </span>
                    )}
                    {p.deployUrl && (
                      <a
                        href={p.deployUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-accent hover:underline"
                      >
                        <ExternalLink size={10} />
                        Ver web
                      </a>
                    )}
                  </div>

                  {/* Expanded detail */}
                  {selected?.id === p.id && (
                    <div className="mt-4 border-t border-border pt-4">
                      <div className="mb-3 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowStatusChange(true);
                            setStatusChangeForm({
                              status: "" as ProspectFollowUpStatus,
                              note: "",
                              channel: "",
                              webSentAt: "",
                            });
                          }}
                          className="rounded-lg bg-accent px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-accent-hover"
                        >
                          Cambiar estado
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Eliminar este prospecto?")) {
                              handleDelete(p.id);
                            }
                          }}
                          className="rounded-lg border border-danger/30 px-3 py-1.5 text-[11px] font-medium text-danger transition-colors hover:bg-danger-muted"
                        >
                          Eliminar
                        </button>
                      </div>
                      <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                        Timeline
                      </h4>
                      <ProspectTimeline
                        history={p.statusHistory}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Prospect Modal */}
      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowNew(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">
                Nuevo prospecto
              </h2>
              <button
                onClick={() => setShowNew(false)}
                className="rounded-lg p-1 text-text-muted hover:bg-bg-hover hover:text-text"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-text-secondary">
                  Nombre del negocio *
                </label>
                <input
                  type="text"
                  value={newForm.businessName}
                  onChange={(e) =>
                    setNewForm({ ...newForm, businessName: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
                  placeholder="Ej: Barbershop Elite"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-text-secondary">
                    Contacto
                  </label>
                  <input
                    type="text"
                    value={newForm.contactName}
                    onChange={(e) =>
                      setNewForm({ ...newForm, contactName: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-text-secondary">
                    Telefono
                  </label>
                  <input
                    type="text"
                    value={newForm.contactPhone}
                    onChange={(e) =>
                      setNewForm({ ...newForm, contactPhone: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
                    placeholder="+972..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-text-secondary">
                    Nicho
                  </label>
                  <select
                    value={newForm.niche}
                    onChange={(e) =>
                      setNewForm({ ...newForm, niche: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
                  >
                    <option value="">Seleccionar</option>
                    <option value="barberia">Barberia</option>
                    <option value="estetica">Estetica</option>
                    <option value="tattoo">Tattoo</option>
                    <option value="nails">Nails</option>
                    <option value="cafeteria">Cafeteria</option>
                    <option value="remodelaciones">Remodelaciones</option>
                    <option value="empleo">Empleo</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-text-secondary">
                    URL de la web
                  </label>
                  <input
                    type="text"
                    value={newForm.deployUrl}
                    onChange={(e) =>
                      setNewForm({ ...newForm, deployUrl: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowNew(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-text-secondary hover:text-text"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !newForm.businessName.trim()}
                className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
              >
                {saving ? "Guardando..." : "Crear prospecto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusChange && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowStatusChange(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">
                Cambiar estado: {selected.businessName}
              </h2>
              <button
                onClick={() => setShowStatusChange(false)}
                className="rounded-lg p-1 text-text-muted hover:bg-bg-hover hover:text-text"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-text-secondary">
                  Nuevo estado
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() =>
                        setStatusChangeForm({
                          ...statusChangeForm,
                          status: s.value,
                        })
                      }
                      className={`rounded-lg border px-3 py-2 text-left text-[11px] font-medium transition-colors ${
                        statusChangeForm.status === s.value
                          ? "border-accent bg-accent-muted text-accent"
                          : "border-border text-text-secondary hover:border-border-hover hover:text-text"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {statusChangeForm.status === "web_sent" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-text-secondary">
                      Canal
                    </label>
                    <select
                      value={statusChangeForm.channel}
                      onChange={(e) =>
                        setStatusChangeForm({
                          ...statusChangeForm,
                          channel: e.target.value as ProspectChannel,
                        })
                      }
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
                    >
                      <option value="">Seleccionar</option>
                      {CHANNELS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-text-secondary">
                      Fecha de envio
                    </label>
                    <input
                      type="date"
                      value={statusChangeForm.webSentAt}
                      onChange={(e) =>
                        setStatusChangeForm({
                          ...statusChangeForm,
                          webSentAt: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-text-secondary">
                  Nota (opcional)
                </label>
                <textarea
                  value={statusChangeForm.note}
                  onChange={(e) =>
                    setStatusChangeForm({
                      ...statusChangeForm,
                      note: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
                  placeholder="Contexto adicional..."
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowStatusChange(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-text-secondary hover:text-text"
              >
                Cancelar
              </button>
              <button
                onClick={handleStatusChange}
                disabled={saving || !statusChangeForm.status}
                className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
              >
                {saving ? "Guardando..." : "Actualizar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
