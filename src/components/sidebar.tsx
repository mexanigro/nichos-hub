"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  Activity,
  DollarSign,
  CreditCard,
  Zap,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

const ownerNav = [
  { href: "/clients", label: "Clientes", icon: LayoutDashboard, badgeKey: "clients" as const },
  { href: "/messages", label: "Mensajes", icon: MessageSquare },
  { href: "/sales", label: "Ventas", icon: TrendingUp },
  { href: "/expenses", label: "Gastos", icon: DollarSign },
  { href: "/api-costs", label: "Costos APIs", icon: Zap },
  { href: "/payments", label: "Pagos", icon: CreditCard },
  { href: "/monitor", label: "Monitor", icon: Activity },
];

const sellerNav = [
  { href: "/sales", label: "Ventas", icon: TrendingUp },
];

type ClientsCounts = {
  pending_review?: number;
  pending_provision?: number;
  changes_requested?: number;
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingClients, setPendingClients] = useState(0);

  const role = session?.user?.role;
  const nav = role === "owner" ? ownerNav : sellerNav;

  // Cuenta total de clientes que requieren atención del owner.
  // Refetch al cambiar de ruta para que el badge se mantenga actualizado.
  useEffect(() => {
    if (role !== "owner") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/clients/counts", { cache: "no-store" });
        if (!res.ok) return;
        const c: ClientsCounts = await res.json();
        if (cancelled) return;
        const total =
          (c.pending_review || 0) +
          (c.pending_provision || 0) +
          (c.changes_requested || 0);
        setPendingClients(total);
      } catch {
        // silencioso — el badge solo desaparece si no se puede contar
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, pathname]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-bg-card px-4 lg:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-1.5 text-text-secondary hover:bg-bg-hover hover:text-text"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-muted">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-text">nichos-hub</span>
        </div>
      </div>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-border bg-bg-card transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-text">nichos-hub</span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {nav.map((item) => {
            const { href, label, icon: Icon } = item;
            const badgeKey = "badgeKey" in item ? item.badgeKey : undefined;
            const active = pathname.startsWith(href);
            const badgeCount =
              badgeKey === "clients" && pendingClients > 0 ? pendingClients : 0;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-accent-muted text-accent"
                    : "text-text-secondary hover:bg-bg-hover hover:text-text"
                }`}
              >
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                {badgeCount > 0 && (
                  <span
                    className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-amber-300 ring-1 ring-amber-500/30"
                    title={`${badgeCount} cliente${badgeCount === 1 ? "" : "s"} requiere${badgeCount === 1 ? "" : "n"} tu atención`}
                  >
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-2 px-3">
            <p className="truncate text-xs font-medium text-text">{session?.user?.name}</p>
            <p className="truncate text-[11px] text-text-muted">{session?.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
