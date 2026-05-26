"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  AlertCircle,
  ClipboardCheck,
  ExternalLink,
  MessageSquareWarning,
  Rocket,
  RotateCcw,
  X,
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { getDefaultTheme } from "@/lib/niche-defaults";

/**
 * PendingReviewBanner — visible solo cuando hub_clients.status === "pending_review".
 *
 * Fetcha config/{clientId} via /api/config para armar la checklist visual. La
 * checklist es advisory: solo bloquea la aprobación si faltan los críticos
 * (adminEmail y brand.name no placeholder). El resto se muestra para que Liam
 * decida si quiere igual aprobar o pedir cambios.
 *
 * Dos acciones:
 *   - "Aprobar y publicar"  → PUT /api/clients/provision con status=active.
 *   - "Solicitar cambios"   → POST /api/clients/changes-request con un mensaje.
 */

type ConfigSnapshot = Record<string, unknown>;

interface ChecklistItem {
  key: string;
  label: string;
  ok: boolean;
  critical: boolean;
  hint?: string;
}

function get<T = unknown>(obj: unknown, path: string): T | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  let cur: unknown = obj;
  for (const k of path.split(".")) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur as T | undefined;
}

function isUrlish(v: unknown): v is string {
  return typeof v === "string" && /^(https?:\/\/|\/)/i.test(v.trim());
}

// E.164-ish: opcional +, 7-15 dígitos. Tolera espacios/guiones porque el cliente
// puede escribir el número raw.
const PHONE_RE = /^\+?[\d\s\-()]{7,20}$/;

function buildChecklist(
  config: ConfigSnapshot | null,
  client: {
    adminEmail?: string;
    businessName?: string;
    niche?: string;
  },
): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // adminEmail — crítico
  const adminEmail = client.adminEmail?.trim() || "";
  items.push({
    key: "adminEmail",
    label: "Admin email del dueño",
    ok: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail),
    critical: true,
    hint: "Es el email que se autentica para entrar al CRM del cliente.",
  });

  // brand.name — crítico
  const brandName = (get<string>(config, "brand.name") ?? client.businessName ?? "").trim();
  const validBrand =
    !!brandName && !/^sin\s*nombre$/i.test(brandName);
  items.push({
    key: "brand.name",
    label: "Nombre del negocio",
    ok: validBrand,
    critical: true,
    hint: validBrand ? brandName : "Está vacío o quedó como 'Sin nombre' (placeholder).",
  });

  // brand.logo
  const logo = get<string>(config, "brand.logo");
  items.push({
    key: "brand.logo",
    label: "Logo",
    ok: isUrlish(logo),
    critical: false,
  });

  // services
  const services = get<unknown[]>(config, "services");
  const visibleServices = get<unknown[]>(config, "visibleServices");
  const svcCount = (Array.isArray(services) ? services.length : 0) ||
    (Array.isArray(visibleServices) ? visibleServices.length : 0);
  items.push({
    key: "services",
    label: "Servicios",
    ok: svcCount >= 1,
    critical: false,
    hint: svcCount > 0 ? `${svcCount} servicio${svcCount === 1 ? "" : "s"}` : undefined,
  });

  // hours — al menos 3 días con shape válido
  const hours = get<Record<string, unknown>>(config, "hours");
  let openDays = 0;
  if (hours && typeof hours === "object") {
    for (const day of ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]) {
      const v = hours[day];
      if (v && typeof v === "object") {
        const r = v as { start?: unknown; end?: unknown };
        if (typeof r.start === "string" && typeof r.end === "string" && r.start && r.end) {
          openDays++;
        }
      }
    }
  }
  items.push({
    key: "hours",
    label: "Horarios cargados",
    ok: openDays >= 3,
    critical: false,
    hint: openDays > 0 ? `${openDays} día${openDays === 1 ? "" : "s"} con horario` : "Ningún día con horario",
  });

  // theme accent custom
  const defaultTheme = client.niche ? getDefaultTheme(client.niche) : "";
  const activeTheme = get<string>(config, "activeTheme");
  const accentOverride = get<string>(config, "themeOverrides.accentColor");
  const themeIsCustom =
    (typeof accentOverride === "string" && !!accentOverride.trim()) ||
    (typeof activeTheme === "string" && activeTheme.trim() !== defaultTheme);
  items.push({
    key: "theme",
    label: "Theme/accent personalizado",
    ok: themeIsCustom,
    critical: false,
    hint: themeIsCustom ? undefined : "Está usando el default del nicho.",
  });

  // contact.phone
  const phone = get<string>(config, "contact.phone");
  items.push({
    key: "contact.phone",
    label: "Teléfono de contacto",
    ok: typeof phone === "string" && PHONE_RE.test(phone.trim()),
    critical: false,
  });

  // hero.backgroundImage
  const hero = get<string>(config, "hero.backgroundImage");
  items.push({
    key: "hero",
    label: "Imagen de hero",
    ok: isUrlish(hero),
    critical: false,
  });

  // gallery >= 3
  const gallery = get<unknown[]>(config, "gallery");
  const galleryCount = Array.isArray(gallery) ? gallery.length : 0;
  items.push({
    key: "gallery",
    label: "Galería (≥ 3 imágenes)",
    ok: galleryCount >= 3,
    critical: false,
    hint: `${galleryCount} imagen${galleryCount === 1 ? "" : "es"}`,
  });

  return items;
}

export function PendingReviewBanner({
  hubDocId,
  client,
  onApproved,
  onChangesRequested,
}: {
  hubDocId: string;
  client: {
    businessName: string;
    niche: string;
    clientId: string;
    deployUrl: string;
    adminEmail: string;
    vercelProjectId?: string;
    deployStatus?: string | null;
    reviewRequestedAt?: string | null;
    resubmissionCount?: number;
  };
  onApproved: () => void;
  onChangesRequested: () => void;
}) {
  const [config, setConfig] = useState<ConfigSnapshot | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [approving, setApproving] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [error, setError] = useState("");

  const [requestOpen, setRequestOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/config/${client.clientId}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => { if (!cancelled) setConfig(data || {}); })
      .catch(() => { if (!cancelled) setConfig({}); })
      .finally(() => { if (!cancelled) setLoadingConfig(false); });
    return () => { cancelled = true; };
  }, [client.clientId]);

  const checklist = useMemo(
    () => buildChecklist(config, {
      adminEmail: client.adminEmail,
      businessName: client.businessName,
      niche: client.niche,
    }),
    [config, client.adminEmail, client.businessName, client.niche],
  );

  const criticalMissing = checklist.filter((c) => c.critical && !c.ok);
  const advisoryMissing = checklist.filter((c) => !c.critical && !c.ok);
  const okCount = checklist.filter((c) => c.ok).length;
  const totalCount = checklist.length;

  const canApprove = criticalMissing.length === 0 && !loadingConfig;
  const deployBlocked = client.deployStatus === "building" || client.deployStatus === "error";

  const daysSinceRequest = (() => {
    if (!client.reviewRequestedAt) return null;
    try {
      return formatDistanceToNowStrict(new Date(client.reviewRequestedAt), {
        locale: es,
        addSuffix: false,
      });
    } catch {
      return null;
    }
  })();

  async function handleApprove() {
    setApproving(true);
    setError("");
    try {
      const res = await fetch("/api/clients/provision", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hubDocId, status: "active" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Error al aprobar");
        setApproving(false);
        return;
      }

      // Si no hay deploy todavía, dispararlo (best-effort — el banner de deploy
      // tomará control si esto falla).
      if (!client.vercelProjectId) {
        try {
          await fetch("/api/deploy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientId: client.clientId,
              niche: client.niche,
              hubDocId,
            }),
          });
        } catch {
          // ignorado — la sección de deploy del cliente refleja el estado.
        }
      }
      onApproved();
      setConfirmApprove(false);
    } catch {
      setError("Error de conexión");
    }
    setApproving(false);
  }

  async function handleRequestChanges() {
    const text = draft.trim();
    if (text.length < 5) {
      setRequestError("El mensaje es muy corto");
      return;
    }
    setSending(true);
    setRequestError("");
    try {
      const res = await fetch("/api/clients/changes-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hubDocId, message: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRequestError(data.error || "Error al enviar");
        setSending(false);
        return;
      }
      onChangesRequested();
      setRequestOpen(false);
      setDraft("");
    } catch {
      setRequestError("Error de conexión");
    }
    setSending(false);
  }

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.06] via-bg-card to-bg-card">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 border-b border-orange-500/20 px-4 py-3 sm:px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/15">
          <ClipboardCheck size={15} className="text-orange-300" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
            Cliente pendiente de revisión
            <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-300">
              {client.businessName || client.clientId}
            </span>
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-text-muted">
            <Clock size={11} />
            {daysSinceRequest
              ? `Solicitó publicación hace ${daysSinceRequest}`
              : "El cliente completó la información del sitio."}
            {client.deployUrl && (
              <>
                <span className="mx-1 opacity-30">·</span>
                <a
                  href={client.deployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-orange-300 transition-colors hover:text-orange-200"
                >
                  Ver preview <ExternalLink size={10} />
                </a>
              </>
            )}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[10px] text-text-muted">
          {(client.resubmissionCount ?? 0) > 0 && (
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 tabular-nums ${
                (client.resubmissionCount ?? 0) >= 3
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                  : "border-sky-500/30 bg-sky-500/10 text-sky-300"
              }`}
              title="Veces que el cliente reenvió la información tras un changes_requested previo"
            >
              <RotateCcw size={10} />
              Reenvíos previos: {client.resubmissionCount}
            </span>
          )}
          <span className="rounded-md border border-border bg-bg-card px-2 py-1 tabular-nums">
            {okCount}/{totalCount} checks
          </span>
        </div>
      </div>

      {/* Checklist */}
      <div className="px-4 py-3 sm:px-5">
        {loadingConfig ? (
          <div className="flex items-center gap-2 py-2 text-xs text-text-muted">
            <Loader2 size={12} className="animate-spin" /> Leyendo configuración…
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
            {checklist.map((item) => (
              <li key={item.key} className="flex items-start gap-2 text-[11px]">
                {item.ok ? (
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-success" />
                ) : item.critical ? (
                  <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-400" />
                ) : (
                  <Circle size={13} className="mt-0.5 shrink-0 text-text-muted/60" />
                )}
                <div className="min-w-0">
                  <span
                    className={
                      item.ok
                        ? "text-text"
                        : item.critical
                          ? "font-medium text-red-300"
                          : "text-text-secondary"
                    }
                  >
                    {item.label}
                  </span>
                  {item.hint && (
                    <span className="ml-1 truncate text-[10px] text-text-muted">· {item.hint}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loadingConfig && criticalMissing.length > 0 && (
          <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-[11px] text-red-300">
            <AlertCircle size={11} className="mr-1 inline" />
            Faltan datos críticos. Pedile al cliente que los complete antes de aprobar.
          </p>
        )}
        {!loadingConfig && criticalMissing.length === 0 && advisoryMissing.length > 0 && (
          <p className="mt-3 text-[10px] text-text-muted">
            {advisoryMissing.length} ítems opcionales sin completar — podés aprobar igual o pedir cambios.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-orange-500/15 bg-bg-card/60 px-4 py-3 sm:px-5">
        {error && (
          <span className="mr-auto text-[10px] text-red-400">{error}</span>
        )}
        <button
          type="button"
          onClick={() => setRequestOpen(true)}
          disabled={approving}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-2 text-[11px] font-medium text-text-secondary transition-colors hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-amber-300 disabled:opacity-50"
        >
          <MessageSquareWarning size={12} />
          Solicitar cambios
        </button>
        <button
          type="button"
          onClick={() => setConfirmApprove(true)}
          disabled={!canApprove || approving}
          title={
            !canApprove
              ? "Faltan datos críticos"
              : deployBlocked
                ? "Aprobará igual; el deploy actual sigue su curso"
                : "Aprobar y publicar"
          }
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {approving ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
          Aprobar y publicar
        </button>
      </div>

      {/* Approve confirmation modal */}
      {confirmApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-bg-card p-6">
            <div className="mb-2 flex items-center gap-2">
              <Rocket size={16} className="text-accent" />
              <h2 className="text-sm font-semibold text-text">Aprobar y publicar</h2>
            </div>
            <p className="mb-3 text-xs text-text-muted">
              ¿Aprobar y publicar el sitio de{" "}
              <span className="font-medium text-text">{client.businessName || client.clientId}</span>?
              {" "}Esto va a hacer accesible la URL al público
              {!client.vercelProjectId ? " y dispara el primer deploy." : "."}
            </p>
            {advisoryMissing.length > 0 && (
              <p className="mb-3 rounded-md border border-amber-500/20 bg-amber-500/5 px-2 py-1.5 text-[10px] text-amber-300/90">
                Aviso: {advisoryMissing.length} ítems opcionales sin completar.
              </p>
            )}
            {error && (
              <p className="mb-3 rounded-md bg-danger-muted px-2 py-1.5 text-[11px] text-danger">{error}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmApprove(false)}
                className="rounded-lg px-3 py-2 text-xs font-medium text-text-secondary hover:text-text"
              >
                Cancelar
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {approving ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
                Sí, aprobar y publicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request changes modal */}
      {requestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6">
            <div className="mb-2 flex items-center gap-2">
              <MessageSquareWarning size={16} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-text">Solicitar cambios al cliente</h2>
              <button
                type="button"
                onClick={() => setRequestOpen(false)}
                className="ml-auto rounded-md p-1 text-text-muted hover:bg-bg-hover hover:text-text"
              >
                <X size={14} />
              </button>
            </div>
            <p className="mb-3 text-xs text-text-muted">
              Escribí qué cambios necesitás. El cliente recibe un email con el link al wizard para editar.
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              autoFocus
              placeholder="Ej: El logo se ve borroso, podrías subir uno con más resolución? También me parece que faltan los precios en los servicios."
              className="mb-2 w-full resize-none rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text placeholder:text-text-muted/60 focus:border-amber-500/40 focus:outline-none"
            />
            <div className="mb-3 flex items-center justify-between text-[10px] text-text-muted">
              <span>{draft.length}/4000</span>
              <span>Se manda email + se registra en Mensajes</span>
            </div>
            {requestError && (
              <p className="mb-3 rounded-md bg-danger-muted px-2 py-1.5 text-[11px] text-danger">{requestError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRequestOpen(false)}
                className="rounded-lg px-3 py-2 text-xs font-medium text-text-secondary hover:text-text"
              >
                Cancelar
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={sending || draft.trim().length < 5}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {sending ? <Loader2 size={12} className="animate-spin" /> : <MessageSquareWarning size={12} />}
                Enviar pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
