"use client";

import { useState } from "react";
import { MONTHLY_AMOUNT, SETUP_AMOUNT_DEFAULT, SETUP_AMOUNT_MAX, SETUP_AMOUNT_MIN, isValidSetupAmount } from "@/lib/pricing";

/**
 * Venta en persona (N10 n10-precios-v1, P-3): el owner fija el alta negociada (1000–1500) y cobra
 * desde el enlace /pago/{clientId}. La cuota mensual (250) no se negocia.
 */
export function SetupAmountPanel({
  docId,
  tenantId,
  initial,
  onSaved,
}: {
  docId: string;
  tenantId: string;
  initial?: number;
  onSaved?: (amount: number) => void;
}) {
  const [value, setValue] = useState<string>(String(initial ?? SETUP_AMOUNT_DEFAULT));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const n = Number(value);
  const valid = isValidSetupAmount(n);
  const payUrl = typeof window !== "undefined" ? `${window.location.origin}/pago/${tenantId}` : `/pago/${tenantId}`;

  async function save() {
    if (!valid) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/clients/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupAmount: n }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMsg({ ok: true, text: `Alta guardada: ₪${n.toLocaleString()}` });
      onSaved?.(n);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Error al guardar" });
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(payUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* el enlace queda visible igual */
    }
  }

  return (
    <div className="mb-4 rounded-lg border border-border bg-bg p-3 text-xs">
      <div className="mb-2 font-semibold text-text-muted">Venta en persona</div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-text-secondary" htmlFor="setup-amount">Alta negociada (₪{SETUP_AMOUNT_MIN}–{SETUP_AMOUNT_MAX})</label>
        <input
          id="setup-amount"
          type="number"
          inputMode="numeric"
          min={SETUP_AMOUNT_MIN}
          max={SETUP_AMOUNT_MAX}
          step={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-24 rounded-md border border-border bg-bg-card px-2 py-1 tabular-nums text-text"
        />
        <button
          type="button"
          onClick={save}
          disabled={!valid || saving}
          className="rounded-md bg-accent px-3 py-1 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <span className="text-text-muted">+ ₪{MONTHLY_AMOUNT}/mes (fijo)</span>
      </div>
      {!valid && <p className="mt-1 text-[11px] text-danger">Entero entre {SETUP_AMOUNT_MIN} y {SETUP_AMOUNT_MAX}.</p>}
      {msg && <p className={`mt-1 text-[11px] ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-text-secondary">Enlace de cobro:</span>
        <a href={`/pago/${tenantId}`} target="_blank" rel="noopener noreferrer" className="font-mono text-accent hover:underline">
          /pago/{tenantId}
        </a>
        <button type="button" onClick={copy} className="rounded-md border border-border px-2 py-0.5 text-[11px] text-text-secondary hover:text-text">
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
