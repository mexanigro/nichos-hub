"use client";

import { useState } from "react";
import { Globe, Loader2, ChevronDown, AlertTriangle } from "lucide-react";
import {
  type ClientLanguage,
  VALID_CLIENT_LANGUAGES,
  CLIENT_LANGUAGE_LABELS_ES,
  normalizeClientLanguage,
} from "@/lib/client-language";

/**
 * Banner persistente arriba de los tabs Config y Contenido. Muestra el idioma
 * actual del negocio y permite cambiarlo con confirm. El idioma controla:
 *   - placeholders de los inputs del dashboard (este repo),
 *   - locale inicial del wizard de onboarding y del template,
 *   - el output language del LLM en /api/generate-content.
 *
 * Cambiar el idioma NO traduce los textos existentes — sólo afecta lo que
 * Liam escriba desde ahora y la generación con IA.
 */
export function ClientLanguageBanner({
  clientId,
  language,
  onChange,
}: {
  clientId: string;
  language: ClientLanguage;
  onChange?: (next: ClientLanguage) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<ClientLanguage | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const current = normalizeClientLanguage(language);
  const currentLabel = CLIENT_LANGUAGE_LABELS_ES[current];

  async function applyChange(next: ClientLanguage) {
    setSaving(true);
    setError(null);
    // Optimistic update: pasamos el nuevo idioma al parent antes de la network.
    const previous = current;
    onChange?.(next);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setPending(null);
      setToast(
        `Idioma actualizado. Los placeholders y la generación con IA ahora usan ${CLIENT_LANGUAGE_LABELS_ES[next]} (${next}).`,
      );
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      // Revert optimistic update.
      onChange?.(previous);
      setError(err instanceof Error ? err.message : "Error al cambiar idioma");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sticky top-0 z-30 -mx-1 mb-4 space-y-2 bg-bg/95 pb-2 pt-1 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-bg-card px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Globe size={13} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-text">
              Idioma del negocio: {currentLabel}{" "}
              <code className="ml-1 rounded bg-bg-elevated px-1 py-0.5 font-mono text-[10px] text-text-muted">
                {current}
              </code>
            </p>
            <p className="text-[10px] text-text-muted">
              Controla placeholders, wizard del cliente y generación con IA. No
              traduce textos ya cargados.
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:border-accent hover:text-text"
          >
            Cambiar idioma
            <ChevronDown size={11} />
          </button>
          {open && (
            <>
              {/* Click-away */}
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <div className="absolute end-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-bg-card shadow-lg">
                {VALID_CLIENT_LANGUAGES.map((code) => {
                  const isCurrent = code === current;
                  return (
                    <button
                      key={code}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => {
                        setOpen(false);
                        if (!isCurrent) setPending(code);
                      }}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[11px] transition-colors ${
                        isCurrent
                          ? "bg-accent/10 text-accent"
                          : "text-text-secondary hover:bg-bg-elevated hover:text-text"
                      }`}
                    >
                      <span>{CLIENT_LANGUAGE_LABELS_ES[code]}</span>
                      <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[9px] text-text-muted">
                        {code}
                      </code>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Warning no-bloqueante */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-[10px] text-amber-300/90">
        <AlertTriangle size={11} className="mt-0.5 shrink-0" />
        <span>
          Si pegás texto en otro idioma dentro de los campos del cliente, va a
          verse roto en el sitio. Cambiá el idioma primero y reescribí el
          contenido a mano (o usá &quot;Generar con IA&quot;).
        </span>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
          {error}
        </div>
      )}
      {toast && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-[11px] text-green-400">
          {toast}
        </div>
      )}

      {pending && (
        <ConfirmLanguageChangeModal
          current={current}
          next={pending}
          saving={saving}
          onCancel={() => {
            if (!saving) setPending(null);
          }}
          onConfirm={() => applyChange(pending)}
        />
      )}
    </div>
  );
}

function ConfirmLanguageChangeModal({
  current,
  next,
  saving,
  onCancel,
  onConfirm,
}: {
  current: ClientLanguage;
  next: ClientLanguage;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-bg-card p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-text">Cambiar idioma del negocio</h3>
        <p className="mt-2 text-[12px] text-text-secondary">
          ¿Cambiar idioma de{" "}
          <strong className="text-text">
            {CLIENT_LANGUAGE_LABELS_ES[current]} ({current})
          </strong>{" "}
          a{" "}
          <strong className="text-text">
            {CLIENT_LANGUAGE_LABELS_ES[next]} ({next})
          </strong>
          ?
        </p>
        <p className="mt-2 text-[11px] text-amber-300/90">
          Esto NO traduce los campos automáticamente. Sólo cambia los
          placeholders del dashboard y el idioma del agente IA. El contenido
          actual queda como está.
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            className="rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:text-text disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {saving && <Loader2 size={11} className="animate-spin" />}
            {saving ? "Cambiando..." : "Confirmar cambio"}
          </button>
        </div>
      </div>
    </div>
  );
}
