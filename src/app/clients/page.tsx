"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ExternalLink,
  LayoutDashboard,
  Search,
  X,
} from "lucide-react";
import { HealthDot, ClientStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading";
import type { ClientWithHealth } from "@/types";
import { formatDistanceToNow, isValid } from "date-fns";
import { es } from "date-fns/locale";

/** Convierte un valor de fecha de la API a Date, con fallback seguro */
function safeDate(v: unknown): Date {
  if (!v) return new Date();
  const d = new Date(v as string);
  return isValid(d) ? d : new Date();
}

/** formatDistanceToNow seguro — nunca crashea */
function safeTimeAgo(date: Date): string {
  try {
    if (!isValid(date)) return "—";
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  } catch {
    return "—";
  }
}

export default function ClientsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<ClientWithHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "demo" | "suspended" | "trial" | "pending_review" | "changes_requested">("all");
  const [nicheFilter, setNicheFilter] = useState<string>("all");
  const [deployFilter, setDeployFilter] = useState<"all" | "ok" | "issue">("all");

  useEffect(() => {
    // Esperar a que la sesión cargue antes de decidir
    if (authStatus === "loading") return;
    if (session?.user?.role !== "owner") {
      router.push("/sales");
      return;
    }
    fetchClients();
  }, [session, authStatus, router]);

  async function fetchClients() {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data.map((c: ClientWithHealth) => ({
          ...c,
          businessName: c.businessName || "",
          niche: c.niche || "",
          clientId: c.clientId || "",
          deployUrl: c.deployUrl || "",
          activationDate: safeDate(c.activationDate),
          lastIncident: c.lastIncident
            ? { ...c.lastIncident, createdAt: safeDate(c.lastIncident.createdAt) }
            : undefined,
        })));
      }
    } catch (err) {
      console.error("[clients] Error fetching:", err);
    }
    setLoading(false);
  }

  const searchLower = search.toLowerCase();
  const niches = Array.from(new Set(clients.map((c) => c.niche).filter(Boolean))).sort();
  const filtered = clients.filter((c) => {
    if (statusFilter !== "all" && (c.status || "active") !== statusFilter) return false;
    if (nicheFilter !== "all" && (c.niche || "") !== nicheFilter) return false;
    if (deployFilter === "ok" && c.deployStatus && c.deployStatus !== "ready") return false;
    if (deployFilter === "issue" && (!c.deployStatus || c.deployStatus === "ready")) return false;
    if (searchLower) {
      const hay = `${c.businessName || ""} ${c.niche || ""} ${c.clientId || ""} ${c.adminEmail || ""}`.toLowerCase();
      if (!hay.includes(searchLower)) return false;
    }
    return true;
  });
  const filtersActive = statusFilter !== "all" || nicheFilter !== "all" || deployFilter !== "all" || !!searchLower;
  const counts = {
    active: clients.filter((c) => (c.status || "active") === "active").length,
    demo: clients.filter((c) => c.status === "demo").length,
    suspended: clients.filter((c) => c.status === "suspended").length,
    trial: clients.filter((c) => c.status === "trial").length,
    pending_review: clients.filter((c) => c.status === "pending_review").length,
    changes_requested: clients.filter((c) => c.status === "changes_requested").length,
    issues: clients.filter((c) => c.deployStatus && c.deployStatus !== "ready").length,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-text">Clientes</h1>
          <p className="text-xs text-text-muted">{clients.length} clientes registrados</p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus size={14} />
          Nuevo cliente
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar por nombre, nicho, ID o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-card py-2 pl-9 pr-9 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted hover:bg-bg-hover hover:text-text"
            aria-label="Limpiar busqueda"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterGroup
          label="Estado"
          options={[
            { key: "all", label: "Todos" },
            {
              key: "pending_review",
              label: `Pendientes${counts.pending_review ? ` (${counts.pending_review})` : ""}`,
              highlight: counts.pending_review > 0,
            },
            {
              key: "changes_requested",
              label: `Cambios pedidos${counts.changes_requested ? ` (${counts.changes_requested})` : ""}`,
              highlight: counts.changes_requested > 0,
            },
            { key: "active", label: `Activos${counts.active ? ` (${counts.active})` : ""}` },
            { key: "demo", label: `Demo${counts.demo ? ` (${counts.demo})` : ""}` },
            { key: "suspended", label: `Suspendidos${counts.suspended ? ` (${counts.suspended})` : ""}` },
            { key: "trial", label: `Trial${counts.trial ? ` (${counts.trial})` : ""}` },
          ]}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as typeof statusFilter)}
        />
        {niches.length > 1 && (
          <FilterGroup
            label="Nicho"
            options={[
              { key: "all", label: "Todos" },
              ...niches.map((n) => ({ key: n, label: n })),
            ]}
            value={nicheFilter}
            onChange={setNicheFilter}
          />
        )}
        <FilterGroup
          label="Deploy"
          options={[
            { key: "all", label: "Todos" },
            { key: "ok", label: "OK" },
            { key: "issue", label: `Con problemas${counts.issues ? ` (${counts.issues})` : ""}` },
          ]}
          value={deployFilter}
          onChange={(v) => setDeployFilter(v as typeof deployFilter)}
        />
        {filtersActive && (
          <button
            type="button"
            onClick={() => { setSearch(""); setStatusFilter("all"); setNicheFilter("all"); setDeployFilter("all"); }}
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-border bg-bg-card px-2 py-1 text-[10px] text-text-muted hover:text-text"
          >
            <X size={10} /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={LayoutDashboard}
          title="Sin clientes"
          description="Agregá tu primer cliente para empezar"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-card text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <th className="w-12 px-4 py-3">Estado</th>
                <th className="min-w-[120px] px-4 py-3">Negocio</th>
                <th className="hidden px-4 py-3 md:table-cell">Nicho</th>
                <th className="hidden px-4 py-3 lg:table-cell">URL</th>
                <th className="hidden whitespace-nowrap px-4 py-3 md:table-cell">Activación</th>
                <th className="hidden whitespace-nowrap px-4 py-3 lg:table-cell">Último incidente</th>
                <th className="w-20 px-4 py-3">Plan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-bg-hover"
                >
                  <td className="w-12 px-4 py-3">
                    <HealthDot status={client.healthStatus} />
                  </td>
                  <td className="min-w-[120px] px-4 py-3">
                    <span className="font-medium text-text">{client.businessName || "—"}</span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="whitespace-nowrap text-text-secondary">{client.niche || "—"}</span>
                  </td>
                  <td className="hidden max-w-[200px] truncate px-4 py-3 lg:table-cell">
                    {client.deployUrl ? (
                      <a
                        href={client.deployUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-mono text-xs text-text-muted transition-colors hover:text-accent"
                      >
                        {(() => { try { return new URL(client.deployUrl).hostname; } catch { return client.deployUrl; } })()}
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-text-muted md:table-cell">
                    {safeTimeAgo(client.activationDate)}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 lg:table-cell">
                    {client.lastIncident ? (
                      <span className="text-xs text-warning">
                        {client.lastIncident.severity} — {safeTimeAgo(client.lastIncident.createdAt)}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </td>
                  <td className="w-20 px-4 py-3">
                    <ClientStatusBadge status={client.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: string; label: string; highlight?: boolean }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card p-1">
      <span className="px-1.5 text-[10px] uppercase tracking-wider text-text-muted/70">{label}</span>
      {options.map((opt) => {
        const active = value === opt.key;
        const cls = active
          ? "bg-accent text-white"
          : opt.highlight
            ? "bg-orange-500/10 text-orange-300 ring-1 ring-orange-500/30 hover:bg-orange-500/20"
            : "text-text-secondary hover:bg-bg-hover hover:text-text";
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${cls}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
