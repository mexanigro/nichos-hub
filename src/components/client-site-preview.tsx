"use client";

import { useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  RefreshCw,
  Loader2,
  Globe,
  AlertCircle,
  Monitor,
  Smartphone,
  Clock,
  EyeOff,
  ShieldAlert,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type Viewport = "desktop" | "mobile";

interface ClientSitePreviewProps {
  clientId: string;
  deployUrl?: string | null;
  deployStatus?: string;
  status?: string;
  /**
   * Bumped by the parent each time config/content is saved. Triggers a 30s delayed
   * auto-refresh of the iframe to catch the Vercel rebuild + CDN cache flush.
   */
  saveTick?: number;
  /** Last successful deploy timestamp, ISO. */
  lastDeployAt?: string | null;
  className?: string;
}

const MOBILE_WIDTH_PX = 390;
const AUTO_REFRESH_DELAY_MS = 30_000;
const LOAD_TIMEOUT_MS = 15_000;

export function ClientSitePreview({
  clientId,
  deployUrl,
  deployStatus,
  status,
  saveTick = 0,
  lastDeployAt,
  className = "",
}: ClientSitePreviewProps) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [reloadKey, setReloadKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [pendingRefresh, setPendingRefresh] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const hasDeploy = Boolean(deployUrl) && deployStatus !== "building";
  const isBuilding = deployStatus === "building";
  const isPendingReview = status === "pending_review";
  const isPendingProvision = status === "pending_provision";

  // Auto-refresh ~30s after parent signals a save (rebuild + CDN cache window).
  useEffect(() => {
    if (saveTick === 0 || !hasDeploy) return;
    setPendingRefresh(true);
    const t = setTimeout(() => {
      setReloadKey((k) => k + 1);
      setPendingRefresh(false);
    }, AUTO_REFRESH_DELAY_MS);
    return () => clearTimeout(t);
  }, [saveTick, hasDeploy]);

  // Detect frame-busting / X-Frame-Options block — iframe should fire onLoad
  // within a few seconds; if it never does, assume blocked.
  useEffect(() => {
    if (!hasDeploy) return;
    setIframeLoading(true);
    setIframeBlocked(false);
    const t = setTimeout(() => {
      setIframeLoading((stillLoading) => {
        if (stillLoading) setIframeBlocked(true);
        return stillLoading;
      });
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [reloadKey, deployUrl, hasDeploy]);

  function handleManualRefresh() {
    setReloadKey((k) => k + 1);
    setPendingRefresh(false);
  }

  return (
    <div
      className={`flex flex-col rounded-xl border border-border bg-bg-card ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Globe size={12} className="shrink-0 text-text-muted" />
          <span className="truncate text-[11px] font-medium text-text">
            Vista previa
          </span>
          {pendingRefresh && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-1.5 py-0.5 text-[9px] font-medium text-accent">
              <Loader2 size={9} className="animate-spin" />
              Esperando rebuild…
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Viewport toggle */}
          {hasDeploy && (
            <div className="flex overflow-hidden rounded-md border border-border">
              <button
                onClick={() => setViewport("desktop")}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] transition-colors ${
                  viewport === "desktop"
                    ? "bg-bg-elevated text-text"
                    : "text-text-muted hover:text-text"
                }`}
                title="Vista desktop"
                aria-pressed={viewport === "desktop"}
              >
                <Monitor size={10} />
              </button>
              <button
                onClick={() => setViewport("mobile")}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] transition-colors ${
                  viewport === "mobile"
                    ? "bg-bg-elevated text-text"
                    : "text-text-muted hover:text-text"
                }`}
                title="Vista mobile"
                aria-pressed={viewport === "mobile"}
              >
                <Smartphone size={10} />
              </button>
            </div>
          )}
          {hasDeploy && (
            <button
              onClick={handleManualRefresh}
              className="rounded-md border border-border p-1 text-text-muted transition-colors hover:bg-bg-hover hover:text-text"
              title="Refrescar ahora"
              aria-label="Refrescar preview"
            >
              <RefreshCw size={11} />
            </button>
          )}
          {deployUrl && (
            <a
              href={deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-1 text-[10px] text-text-muted transition-colors hover:bg-bg-hover hover:text-text"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="relative flex-1 overflow-hidden bg-[#09090b]">
        {/* Empty / blocked / building states */}
        {!deployUrl && isPendingReview && (
          <PreviewMessage
            icon={Clock}
            title="Esperando aprobación"
            body="El sitio del cliente se publica cuando aprobás la revisión."
          />
        )}
        {!deployUrl && isPendingProvision && (
          <PreviewMessage
            icon={Clock}
            title="Pago sin onboarding"
            body="El cliente todavía no completó el wizard. No hay deploy aún."
          />
        )}
        {!deployUrl && !isPendingReview && !isPendingProvision && (
          <PreviewMessage
            icon={AlertCircle}
            title="Sin deploy"
            body="Este cliente no tiene un sitio publicado todavía."
          />
        )}

        {deployUrl && isBuilding && (
          <PreviewMessage
            icon={Loader2}
            iconAnimate
            title="Deploy en progreso"
            body="Vercel está construyendo. La preview se cargará cuando termine."
          />
        )}

        {hasDeploy && (
          <>
            {/* Mobile frame wrapper: center, fixed width */}
            <div
              className={
                viewport === "mobile"
                  ? "flex h-full w-full items-start justify-center overflow-auto py-4"
                  : "h-full w-full"
              }
            >
              <div
                className={
                  viewport === "mobile"
                    ? "h-full overflow-hidden rounded-2xl border border-border shadow-2xl"
                    : "h-full w-full"
                }
                style={
                  viewport === "mobile"
                    ? { width: MOBILE_WIDTH_PX, maxWidth: "100%" }
                    : undefined
                }
              >
                <iframe
                  key={reloadKey}
                  ref={iframeRef}
                  src={deployUrl!}
                  className="h-full w-full border-0 bg-white"
                  style={
                    viewport === "mobile"
                      ? { height: "100%", minHeight: 640 }
                      : undefined
                  }
                  title={`Vista previa del sitio de ${clientId}`}
                  loading="lazy"
                  // sandbox kept permissive — the preview should mirror what real
                  // visitors see (booking widget, analytics, embedded chat).
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
                  referrerPolicy="no-referrer"
                  onLoad={() => {
                    setIframeLoading(false);
                    setIframeBlocked(false);
                  }}
                />
              </div>
            </div>

            {/* Loading overlay */}
            {iframeLoading && !iframeBlocked && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#09090b]/60 backdrop-blur-sm">
                <div className="flex items-center gap-2 rounded-lg bg-bg-card px-3 py-1.5 text-[11px] text-text-secondary">
                  <Loader2 size={12} className="animate-spin" />
                  Cargando sitio…
                </div>
              </div>
            )}

            {/* X-Frame-Options / CSP block fallback */}
            {iframeBlocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg-card p-6 text-center">
                <ShieldAlert size={20} className="text-warning" />
                <p className="max-w-sm text-xs font-medium text-text">
                  El navegador bloqueó la vista previa embebida
                </p>
                <p className="max-w-sm text-[10px] text-text-muted">
                  Probablemente el sitio del cliente envía un X-Frame-Options o
                  CSP restrictivo. Abrilo en una pestaña nueva.
                </p>
                {deployUrl && (
                  <a
                    href={deployUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/20"
                  >
                    <ExternalLink size={11} />
                    Abrir sitio
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-1.5">
        <div className="min-w-0 truncate text-[10px] text-text-muted">
          {deployUrl ? (
            <span className="font-mono">{deployUrl}</span>
          ) : (
            <span>Sin URL</span>
          )}
        </div>
        {lastDeployAt && (
          <div className="flex items-center gap-1 text-[10px] text-text-muted">
            <Clock size={9} />
            <span>
              Actualizado{" "}
              {(() => {
                try {
                  return formatDistanceToNow(new Date(lastDeployAt), {
                    addSuffix: true,
                    locale: es,
                  });
                } catch {
                  return "—";
                }
              })()}
            </span>
          </div>
        )}
        {isPendingReview && deployUrl && (
          <div className="flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
            <EyeOff size={9} />
            Cambios pending hasta aprobar
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewMessage({
  icon: Icon,
  title,
  body,
  iconAnimate,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  body: string;
  iconAnimate?: boolean;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
      <Icon
        size={20}
        className={`text-text-muted ${iconAnimate ? "animate-spin" : ""}`}
      />
      <p className="text-xs font-medium text-text">{title}</p>
      <p className="max-w-xs text-[10px] text-text-muted">{body}</p>
    </div>
  );
}
