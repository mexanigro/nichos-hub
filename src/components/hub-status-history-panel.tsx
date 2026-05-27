"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarX,
  Globe2,
  Loader2,
  MailCheck,
  MailQuestion,
  MessageSquare,
  ShieldCheck,
  User,
  UserCog,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useSession } from "next-auth/react";

/**
 * Timeline de eventos de lifecycle del cliente.
 * Lee `hub_status_history/{clientId}/entries` via GET /api/clients/{id}/status-history.
 *
 * A diferencia de ConfigHistoryPanel (cambios al contenido del config), acá
 * rendereamos eventos categóricos: transiciones de status, desconexión de
 * Calendar, cambios de idioma, mensajes iniciados por Liam, info submitted /
 * resubmit del cliente. Cada kind tiene su propio ícono + texto.
 */

type Entry = {
  id: string;
  kind: string | null;
  changedAt: string | null;
  changedBy: string | null;
  from: string | null;
  to: string | null;
  reason: string | null;
  revokeStatus: number | null;
  channel: string | null;
  messagePreview: string | null;
  hubDocId: string | null;
};

const PAGE_SIZE = 10;

type Actor =
  | { type: "customer"; label: string; description: string }
  | { type: "you"; label: string; description: string }
  | { type: "operator"; label: string; description: string }
  | { type: "system"; label: string; description: string }
  | { type: "unknown"; label: string; description: string };

function classifyActor(changedBy: string | null, ownerEmail?: string | null): Actor {
  if (!changedBy) {
    return { type: "unknown", label: "Sistema", description: "Origen no registrado" };
  }
  if (changedBy === "customer") {
    return { type: "customer", label: "Cliente", description: "Acción iniciada por el cliente" };
  }
  if (changedBy === "migration-script" || changedBy === "system") {
    return { type: "system", label: "Sistema", description: changedBy };
  }
  if (ownerEmail && changedBy.toLowerCase() === ownerEmail.toLowerCase()) {
    return { type: "you", label: "Vos", description: changedBy };
  }
  if (changedBy === "owner") {
    return { type: "you", label: "Vos", description: "Sesión owner" };
  }
  return { type: "operator", label: "Operador", description: changedBy };
}

const ACTOR_STYLES: Record<Actor["type"], { chip: string; icon: typeof User }> = {
  customer: { chip: "border-sky-500/40 bg-sky-500/10 text-sky-300", icon: User },
  you: { chip: "border-accent/40 bg-accent/10 text-accent", icon: UserCog },
  operator: { chip: "border-border bg-bg-elevated text-text-secondary", icon: UserCog },
  system: { chip: "border-border bg-bg-elevated text-text-muted", icon: ShieldCheck },
  unknown: { chip: "border-border bg-bg-elevated text-text-muted", icon: UserCog },
};

const LANGUAGE_NAMES: Record<string, string> = {
  he: "hebreo",
  en: "inglés",
  ru: "ruso",
  ar: "árabe",
  es: "español",
};

function languageLabel(code: string | null | undefined): string {
  if (!code) return "—";
  return LANGUAGE_NAMES[code] ?? code;
}

const STATUS_LABELS: Record<string, string> = {
  pending_provision: "pending_provision",
  pending_review: "pending_review",
  changes_requested: "changes_requested",
  active: "active",
  demo: "demo",
  suspended: "suspended",
};

function statusLabel(code: string | null | undefined): string {
  if (!code) return "—";
  return STATUS_LABELS[code] ?? code;
}

type ResolvedEvent = {
  Icon: typeof Activity;
  iconColor: string;
  title: React.ReactNode;
};

/**
 * Resuelve el shape visual de cada entry según su `kind` (o, cuando no hay
 * kind explícito, según from/to/reason). Si encontramos un kind desconocido,
 * caemos al fallback genérico — el chip queda neutral y se ve el kind crudo.
 *
 * TODO: Si aparece un kind nuevo en hub_status_history, agregarlo acá
 * explícitamente con su ícono y texto en lugar de dejar fallback genérico.
 */
function resolveEvent(entry: Entry): ResolvedEvent {
  const kind = entry.kind;

  if (kind === "calendar_disconnect") {
    return {
      Icon: CalendarX,
      iconColor: "text-amber-300",
      title: <span>Desconectó Google Calendar</span>,
    };
  }

  if (kind === "language_change") {
    return {
      Icon: Globe2,
      iconColor: "text-sky-300",
      title: (
        <span>
          Cambió idioma de{" "}
          <span className="font-medium text-text">{languageLabel(entry.from)}</span>{" "}
          a{" "}
          <span className="font-medium text-text">{languageLabel(entry.to)}</span>
        </span>
      ),
    };
  }

  if (kind === "owner_message_sent") {
    return {
      Icon: MessageSquare,
      iconColor: "text-accent",
      title: (
        <span>
          Mensaje enviado al cliente
          {entry.channel ? <span className="text-text-muted"> · {entry.channel}</span> : null}
        </span>
      ),
    };
  }

  // Sin kind explícito: si hay from/to, lo tratamos como status_change.
  // `reason` discrimina los flows que entran a pending_review:
  //   - "info_submitted"     → primera vez que el cliente completa el wizard
  //   - "customer_resubmit"  → el cliente reenvió después de un changes_requested
  if (entry.from || entry.to) {
    if (entry.reason === "info_submitted") {
      return {
        Icon: UserPlus,
        iconColor: "text-sky-300",
        title: <span>Cliente completó el formulario por primera vez</span>,
      };
    }
    if (entry.reason === "customer_resubmit") {
      return {
        Icon: MailCheck,
        iconColor: "text-sky-300",
        title: (
          <span>
            Cliente reenvió la info con cambios. Estado vuelve a{" "}
            <span className="font-medium text-text">pending_review</span>
          </span>
        ),
      };
    }
    return {
      Icon: ArrowRight,
      iconColor: "text-text-secondary",
      title: (
        <span>
          Estado:{" "}
          <span className="font-medium text-text">{statusLabel(entry.from)}</span>
          <ArrowRight size={10} className="mx-1 inline opacity-50" />
          <span className="font-medium text-text">{statusLabel(entry.to)}</span>
        </span>
      ),
    };
  }

  return {
    Icon: MailQuestion,
    iconColor: "text-text-muted",
    title: (
      <span>
        Evento: <code className="font-mono text-[10px] text-text-secondary">{kind || "sin tipo"}</code>
      </span>
    ),
  };
}

export function HubStatusHistoryPanel({ clientId }: { clientId: string }) {
  const { data: session } = useSession();
  const ownerEmail = session?.user?.email ?? null;
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Pedimos un poco más que PAGE_SIZE para saber si hay más sin obligar
    // a un round-trip extra. Si quedamos cortos, mostramos todo lo que llegó.
    fetch(`/api/clients/${clientId}/status-history?limit=50`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.entries)) setEntries(data.entries);
        else setEntries([]);
        if (data.error) setError(data.error);
      })
      .catch(() => {
        if (!cancelled) {
          setEntries([]);
          setError("No se pudo cargar el historial");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const total = entries?.length ?? 0;
  const visible = showAll ? entries ?? [] : (entries ?? []).slice(0, PAGE_SIZE);
  const hasMore = total > PAGE_SIZE && !showAll;

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-xs font-semibold text-text-muted">
          <Activity size={12} />
          Historial de eventos
        </h3>
        {total > 0 && (
          <span className="rounded bg-bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
            {total}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={14} className="animate-spin text-text-muted" />
        </div>
      ) : !entries || entries.length === 0 ? (
        <p className="py-4 text-center text-xs text-text-muted">
          {error || "Sin eventos registrados todavía."}
        </p>
      ) : (
        <>
          <ol className="max-h-96 space-y-1.5 overflow-y-auto">
            {visible.map((entry) => {
              const actor = classifyActor(entry.changedBy, ownerEmail);
              const actorStyles = ACTOR_STYLES[actor.type];
              const ActorIcon = actorStyles.icon;
              const event = resolveEvent(entry);
              const EventIcon = event.Icon;
              return (
                <li
                  key={entry.id}
                  className="rounded-lg border border-border bg-bg-elevated px-3 py-2"
                >
                  <div className="flex items-start gap-2">
                    <EventIcon size={13} className={`mt-0.5 shrink-0 ${event.iconColor}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${actorStyles.chip}`}
                          title={actor.description}
                        >
                          <ActorIcon size={9} />
                          {actor.label}
                        </span>
                        <span className="text-xs text-text">{event.title}</span>
                        <span
                          className="ml-auto text-[10px] text-text-muted"
                          title={entry.changedAt ?? ""}
                        >
                          {entry.changedAt
                            ? formatDistanceToNow(new Date(entry.changedAt), {
                                addSuffix: true,
                                locale: es,
                              })
                            : "—"}
                        </span>
                      </div>
                      {/* `reason` solo en kinds que NO lo usan como discriminador
                          (los flows customer ya lo consumieron en resolveEvent).
                          Lo mostramos como contexto auxiliar. */}
                      {entry.reason &&
                        entry.reason !== "info_submitted" &&
                        entry.reason !== "customer_resubmit" && (
                          <p className="mt-1 text-[10px] italic text-text-muted">
                            {entry.reason}
                          </p>
                        )}
                      {entry.messagePreview && (
                        <p className="mt-1 line-clamp-2 text-[10px] text-text-secondary">
                          “{entry.messagePreview}”
                        </p>
                      )}
                      {entry.kind === "calendar_disconnect" &&
                        typeof entry.revokeStatus === "number" && (
                          <p className="mt-1 text-[10px] text-text-muted">
                            Revoke HTTP {entry.revokeStatus}
                          </p>
                        )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          {hasMore && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-3 w-full rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text"
            >
              Ver {total - PAGE_SIZE} más
            </button>
          )}
        </>
      )}
    </div>
  );
}
