"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════
 * Types
 * ═══════════════════════════════════════════════════════════════════════ */

export type PaymentProvider =
  | "none"
  | "stripe"
  | "cardcom"
  | "paypal"
  | "square"
  | "manual";

type ProviderMeta = {
  id: PaymentProvider;
  label: string;
  description: string;
  icon: string;
  fields: CredentialField[];
  docsUrl?: string;
};

type CredentialField = {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
  hint?: string;
};

type PaymentConfig = {
  enabled?: boolean;
  provider?: string;
  mode?: string;
  acceptCash?: boolean;
  depositRequired?: boolean;
  depositAmount?: number;
  currency?: string;
};

/* ═══════════════════════════════════════════════════════════════════════
 * Provider definitions
 * ═══════════════════════════════════════════════════════════════════════ */

const PROVIDERS: ProviderMeta[] = [
  {
    id: "none",
    label: "Sin proveedor",
    description: "Pagos deshabilitados — el cliente no cobra online",
    icon: "🚫",
    fields: [],
  },
  {
    id: "stripe",
    label: "Stripe",
    description: "Tarjetas internacionales, Apple/Google Pay",
    icon: "💳",
    fields: [
      {
        key: "publishableKey",
        label: "Publishable Key",
        placeholder: "pk_live_...",
        hint: "Empieza con pk_live_ o pk_test_",
      },
      {
        key: "secretKey",
        label: "Secret Key",
        placeholder: "sk_live_...",
        secret: true,
        hint: "Empieza con sk_live_ o sk_test_",
      },
    ],
    docsUrl: "https://dashboard.stripe.com/apikeys",
  },
  {
    id: "cardcom",
    label: "Cardcom",
    description: "Proveedor israelí — shekels, tarjetas locales",
    icon: "🇮🇱",
    fields: [
      {
        key: "merchantId",
        label: "Merchant ID",
        placeholder: "Ej: 12345",
      },
      {
        key: "apiKey",
        label: "API Key",
        placeholder: "API key de Cardcom",
        secret: true,
      },
      {
        key: "terminalNumber",
        label: "Terminal Number",
        placeholder: "Numero de terminal",
        hint: "El terminal de la cuenta Cardcom del cliente",
      },
    ],
    docsUrl: "https://secure.cardcom.solutions/Interface/DeveloperCenter.aspx",
  },
  {
    id: "paypal",
    label: "PayPal",
    description: "PayPal checkout — internacional",
    icon: "🅿️",
    fields: [
      {
        key: "clientId",
        label: "Client ID",
        placeholder: "PayPal Client ID",
      },
      {
        key: "clientSecret",
        label: "Client Secret",
        placeholder: "PayPal Client Secret",
        secret: true,
      },
    ],
    docsUrl: "https://developer.paypal.com/dashboard/applications",
  },
  {
    id: "square",
    label: "Square",
    description: "Square payments — POS + online",
    icon: "⬜",
    fields: [
      {
        key: "applicationId",
        label: "Application ID",
        placeholder: "sq0idp-...",
      },
      {
        key: "accessToken",
        label: "Access Token",
        placeholder: "Access token de Square",
        secret: true,
      },
      {
        key: "locationId",
        label: "Location ID",
        placeholder: "ID de la ubicacion",
        hint: "Se encuentra en Square Dashboard > Locations",
      },
    ],
    docsUrl: "https://developer.squareup.com/apps",
  },
  {
    id: "manual",
    label: "Manual",
    description: "Registro manual de pagos — sin cobro automatico",
    icon: "📝",
    fields: [],
  },
];

/* ═══════════════════════════════════════════════════════════════════════
 * Component
 * ═══════════════════════════════════════════════════════════════════════ */

export function PaymentProviderEditor({
  clientId,
  payment,
  onPaymentChange,
}: {
  clientId: string;
  payment: PaymentConfig | undefined;
  onPaymentChange: (path: string, value: unknown) => void;
}) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [maskedFields, setMaskedFields] = useState<Record<string, string>>({});
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);
  const [credsSaved, setCredsSaved] = useState(false);
  const [credsError, setCredsError] = useState("");
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [credsDirty, setCredsDirty] = useState(false);

  const currentProvider = (payment?.provider as PaymentProvider) || "none";
  const providerMeta = PROVIDERS.find((p) => p.id === currentProvider) ?? PROVIDERS[0];

  const fetchCredentials = useCallback(async () => {
    setLoadingCreds(true);
    setCredsError("");
    try {
      const res = await fetch(`/api/config/${clientId}/payment-credentials`);
      const data = await res.json();
      const creds = (data.credentials as Record<string, string>) || {};

      const masked: Record<string, string> = {};
      const clean: Record<string, string> = {};

      for (const [key, value] of Object.entries(creds)) {
        if (key.endsWith("_masked")) {
          const realKey = key.replace("_masked", "");
          masked[realKey] = value;
        } else {
          clean[key] = value;
        }
      }

      setCredentials(clean);
      setMaskedFields(masked);
      setCredsDirty(false);
    } catch {
      setCredsError("Error al cargar credenciales");
    } finally {
      setLoadingCreds(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (currentProvider !== "none" && currentProvider !== "manual") {
      fetchCredentials();
    }
  }, [currentProvider, fetchCredentials]);

  async function saveCredentials() {
    setSavingCreds(true);
    setCredsError("");
    setCredsSaved(false);
    try {
      const res = await fetch(`/api/config/${clientId}/payment-credentials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: currentProvider, credentials }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al guardar credenciales");
      }
      setCredsSaved(true);
      setCredsDirty(false);
      await fetchCredentials();
      setTimeout(() => setCredsSaved(false), 3000);
    } catch (err) {
      setCredsError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSavingCreds(false);
    }
  }

  function handleProviderChange(nextProvider: PaymentProvider) {
    onPaymentChange("payment.provider", nextProvider);
    setCredentials({});
    setMaskedFields({});
    setCredsDirty(false);
    setCredsError("");
    setCredsSaved(false);
    setVisibleSecrets(new Set());

    if (nextProvider === "none") {
      onPaymentChange("payment.enabled", false);
    } else if (nextProvider !== "manual") {
      onPaymentChange("payment.enabled", true);
    }
  }

  const hasSecrets = providerMeta.fields.some((f) => f.secret);
  const allCredsConfigured =
    providerMeta.fields.length === 0 ||
    providerMeta.fields.every(
      (f) => credentials[f.key]?.trim() || maskedFields[f.key],
    );

  return (
    <div className="space-y-4">
      {/* ── Provider selector ─────────────────────────────────────── */}
      <div>
        <p className="mb-2 text-[11px] font-medium text-text-muted">
          Proveedor de pagos
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PROVIDERS.map((p) => {
            const isSelected = currentProvider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleProviderChange(p.id)}
                className={`group relative rounded-lg border px-3 py-2.5 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-accent/40 bg-accent/8 shadow-[0_0_0_1px_rgba(var(--accent-rgb,180,130,100),0.15)]"
                    : "border-border bg-bg-elevated hover:border-border/80 hover:bg-bg-active"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{p.icon}</span>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`block text-xs font-semibold ${
                        isSelected ? "text-text" : "text-text-secondary"
                      }`}
                    >
                      {p.label}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-text-muted">
                      {p.description}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent">
                      <CheckCircle2
                        size={10}
                        className="text-white"
                        strokeWidth={3}
                      />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Credentials form ──────────────────────────────────────── */}
      {providerMeta.fields.length > 0 && (
        <div className="rounded-lg border border-border bg-bg-card/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={13} className="text-text-muted" />
              <span className="text-[11px] font-semibold text-text-secondary">
                Credenciales de {providerMeta.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {providerMeta.docsUrl && (
                <a
                  href={providerMeta.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-accent hover:underline"
                >
                  Docs
                  <ExternalLink size={9} />
                </a>
              )}
              {allCredsConfigured && !credsDirty && (
                <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">
                  <CheckCircle2 size={10} />
                  Configurado
                </span>
              )}
              {!allCredsConfigured && (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                  <AlertTriangle size={10} />
                  Incompleto
                </span>
              )}
            </div>
          </div>

          {loadingCreds ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={16} className="animate-spin text-text-muted" />
            </div>
          ) : (
            <div className="space-y-3">
              {providerMeta.fields.map((field) => {
                const isSecret = field.secret;
                const hasMasked = Boolean(maskedFields[field.key]);
                const currentValue = credentials[field.key] || "";
                const isVisible = visibleSecrets.has(field.key);

                return (
                  <div key={field.key}>
                    <label className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-text-muted">
                      {field.label}
                      {isSecret && (
                        <Shield size={9} className="text-amber-400/70" />
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={isSecret && !isVisible ? "password" : "text"}
                        value={currentValue}
                        onChange={(e) => {
                          setCredentials((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }));
                          setCredsDirty(true);
                        }}
                        placeholder={
                          hasMasked && !currentValue
                            ? maskedFields[field.key]
                            : field.placeholder
                        }
                        className={`w-full rounded-lg border bg-bg-elevated py-2 pl-3 pr-9 font-mono text-xs text-text outline-none transition-colors focus:border-accent ${
                          hasMasked && !currentValue
                            ? "border-green-500/20 placeholder:text-green-400/50"
                            : "border-border placeholder:text-text-muted/40"
                        }`}
                      />
                      {isSecret && (
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleSecrets((prev) => {
                              const next = new Set(prev);
                              if (next.has(field.key)) next.delete(field.key);
                              else next.add(field.key);
                              return next;
                            })
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted transition-colors hover:text-text"
                        >
                          {isVisible ? (
                            <EyeOff size={13} />
                          ) : (
                            <Eye size={13} />
                          )}
                        </button>
                      )}
                    </div>
                    {field.hint && (
                      <p className="mt-0.5 text-[10px] text-text-muted/70">
                        {field.hint}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Save credentials button */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={saveCredentials}
                  disabled={savingCreds || !credsDirty}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-[11px] font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-40"
                >
                  {savingCreds ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Shield size={12} />
                  )}
                  {savingCreds ? "Guardando..." : "Guardar credenciales"}
                </button>
                {credsSaved && (
                  <span className="text-[11px] text-green-400">
                    Credenciales guardadas
                  </span>
                )}
                {credsError && (
                  <span className="text-[11px] text-red-400">{credsError}</span>
                )}
              </div>

              {hasSecrets && (
                <p className="flex items-start gap-1.5 rounded-md bg-amber-500/5 px-2.5 py-2 text-[10px] leading-relaxed text-amber-300/80">
                  <Shield
                    size={11}
                    className="mt-0.5 shrink-0 text-amber-400/60"
                  />
                  Las credenciales secretas se almacenan en una coleccion separada
                  de Firestore con acceso restringido. No se incluyen en la
                  config publica del cliente.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Payment settings ──────────────────────────────────────── */}
      {currentProvider !== "none" && (
        <div className="space-y-3 rounded-lg border border-border bg-bg-card/50 p-4">
          <div className="flex items-center gap-2">
            <CreditCard size={13} className="text-text-muted" />
            <span className="text-[11px] font-semibold text-text-secondary">
              Configuracion de cobro
            </span>
          </div>

          {/* Enabled toggle */}
          <ToggleRow
            label="Pagos habilitados"
            value={payment?.enabled ?? false}
            onChange={(v) => onPaymentChange("payment.enabled", v)}
          />

          {/* Mode */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text-muted">
                Modo de cobro
              </label>
              <select
                value={payment?.mode || "none"}
                onChange={(e) => onPaymentChange("payment.mode", e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
              >
                <option value="none">Sin cobro online</option>
                <option value="deposit">Seña / Deposito</option>
                <option value="full">Pago completo</option>
                <option value="cash-only">Solo efectivo</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text-muted">
                Moneda
              </label>
              <select
                value={payment?.currency || "ILS"}
                onChange={(e) =>
                  onPaymentChange("payment.currency", e.target.value)
                }
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
              >
                <option value="ILS">ILS — Shekel israelí</option>
                <option value="USD">USD — Dólar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
          </div>

          {/* Accept cash */}
          <ToggleRow
            label="Aceptar pago en efectivo"
            value={payment?.acceptCash ?? false}
            onChange={(v) => onPaymentChange("payment.acceptCash", v)}
          />

          {/* Deposit */}
          <ToggleRow
            label="Requiere seña para reservar"
            value={payment?.depositRequired ?? false}
            onChange={(v) => onPaymentChange("payment.depositRequired", v)}
          />

          {(payment?.depositRequired ||
            payment?.mode === "deposit") && (
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text-muted">
                Monto de seña
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={payment?.depositAmount ?? 0}
                  onChange={(e) =>
                    onPaymentChange(
                      "payment.depositAmount",
                      Number(e.target.value),
                    )
                  }
                  className="w-32 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
                />
                <span className="text-[10px] text-text-muted">
                  {payment?.currency || "ILS"} (agorot/centavos)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual mode hint */}
      {currentProvider === "manual" && (
        <p className="rounded-lg border border-blue-500/15 bg-blue-500/5 px-3 py-2 text-[11px] text-blue-300/80">
          Modo manual: el dueño del negocio registra los pagos a mano.
          No se procesa ningun cobro automatico en la web del cliente.
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 * Subcomponents
 * ═══════════════════════════════════════════════════════════════════════ */

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center gap-2 text-xs text-text-secondary"
    >
      <div
        className={`h-4 w-7 rounded-full transition-colors ${
          value ? "bg-accent" : "bg-bg-active"
        }`}
      >
        <div
          className={`h-4 w-4 rounded-full bg-white transition-transform ${
            value ? "translate-x-3" : "translate-x-0"
          }`}
        />
      </div>
      {label}
    </button>
  );
}
