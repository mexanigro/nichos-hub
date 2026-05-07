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
import type { ClientWithHealth } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function ClientsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<ClientWithHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== "owner") {
      router.push("/sales");
      return;
    }
    fetchClients();
  }, [session, router]);

  async function fetchClients() {
    const res = await fetch("/api/clients");
    if (res.ok) {
      const data = await res.json();
      setClients(data.map((c: ClientWithHealth) => ({
        ...c,
        activationDate: new Date(c.activationDate),
        lastIncident: c.lastIncident
          ? { ...c.lastIncident, createdAt: new Date(c.lastIncident.createdAt) }
          : undefined,
      })));
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form);

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowForm(false);
      fetchClients();
    }
  }

  const filtered = clients.filter(
    (c) =>
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      c.niche.toLowerCase().includes(search.toLowerCase()) ||
      c.clientId.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-lg font-semibold tracking-tight text-text">Clientes</h1>
          <p className="text-xs text-text-muted">{clients.length} clientes registrados</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus size={14} />
          Agregar cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar por nombre, nicho o ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-card py-2 pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
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
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-card text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Negocio</th>
                <th className="hidden px-4 py-3 md:table-cell">Nicho</th>
                <th className="hidden px-4 py-3 lg:table-cell">URL</th>
                <th className="hidden px-4 py-3 md:table-cell">Activación</th>
                <th className="hidden px-4 py-3 lg:table-cell">Último incidente</th>
                <th className="px-4 py-3">Plan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-bg-hover"
                >
                  <td className="px-4 py-3">
                    <HealthDot status={client.healthStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-text">{client.businessName}</span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="text-text-secondary">{client.niche}</span>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <a
                      href={client.deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 font-mono text-xs text-text-muted transition-colors hover:text-accent"
                    >
                      {new URL(client.deployUrl).hostname}
                      <ExternalLink size={10} />
                    </a>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-text-muted md:table-cell">
                    {formatDistanceToNow(client.activationDate, { addSuffix: true, locale: es })}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    {client.lastIncident ? (
                      <span className="text-xs text-warning">
                        {client.lastIncident.severity} — {formatDistanceToNow(client.lastIncident.createdAt, { addSuffix: true, locale: es })}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ClientStatusBadge status={client.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Client Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">Nuevo cliente</h2>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-text-muted">Nombre del negocio *</label>
                  <input name="businessName" required className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-text-muted">Nicho *</label>
                  <select name="niche" required className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text focus:border-accent focus:outline-none">
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
                <label className="mb-1 block text-[11px] font-medium text-text-muted">URL del deploy *</label>
                <input name="deployUrl" type="url" required placeholder="https://..." className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-text-muted">Client ID *</label>
                  <input name="clientId" required placeholder="demo-barber" className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm font-mono text-text placeholder:text-text-muted focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-text-muted">Admin email</label>
                  <input name="adminEmail" type="email" className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-text-muted">Vercel Project ID</label>
                <input name="vercelProjectId" className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm font-mono text-text focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-text-muted">Notas</label>
                <textarea name="notes" rows={2} className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text focus:border-accent focus:outline-none resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-3 py-2 text-xs font-medium text-text-secondary hover:text-text">
                  Cancelar
                </button>
                <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover">
                  Crear cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
