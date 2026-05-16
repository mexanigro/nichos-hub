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
} from "lucide-react";
import { HealthDot, ClientStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading";
import type { ClientWithHealth } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function ClientsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<ClientWithHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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


  const filtered = clients.filter(
    (c) =>
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      c.niche.toLowerCase().includes(search.toLowerCase()) ||
      c.clientId.toLowerCase().includes(search.toLowerCase())
  );

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
                    <span className="font-medium text-text">{client.businessName}</span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="whitespace-nowrap text-text-secondary">{client.niche}</span>
                  </td>
                  <td className="hidden max-w-[200px] truncate px-4 py-3 lg:table-cell">
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
                  <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-text-muted md:table-cell">
                    {formatDistanceToNow(client.activationDate, { addSuffix: true, locale: es })}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 lg:table-cell">
                    {client.lastIncident ? (
                      <span className="text-xs text-warning">
                        {client.lastIncident.severity} — {formatDistanceToNow(client.lastIncident.createdAt, { addSuffix: true, locale: es })}
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
