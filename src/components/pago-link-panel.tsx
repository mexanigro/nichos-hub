"use client";

import { useState } from "react";
import { MONTHLY_AMOUNT } from "@/lib/pricing";

/**
 * Venta en persona: el owner le pasa al cliente el enlace /pago/{clientId}, donde acepta el contrato y paga el
 * primer mes (250, sin alta: Liam, 2026-10-15). Nada se negocia; antes este panel fijaba un alta de 1000–1500.
 */
export function PagoLinkPanel({ tenantId }: { tenantId: string }) {
  const [copied, setCopied] = useState(false);
  const payUrl = typeof window !== "undefined" ? `${window.location.origin}/pago/${tenantId}` : `/pago/${tenantId}`;

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
      <div className="mb-2 font-semibold text-text-muted">Venta en persona · ₪{MONTHLY_AMOUNT}/mes, sin alta</div>
      <div className="flex flex-wrap items-center gap-2">
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
