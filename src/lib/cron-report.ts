// P-02 (Capa A, p02-cron-v1) — resumen de una corrida del cron de cobros para el disparador (GitHub Actions).
// skipped = clientes vencidos sin token (no se intentó cobrar); failed = Cardcom rechazó o excepción. Sin datos de tarjeta.
import type { ChargeResult } from "./recurring-charge.ts";

export type CronSummary = { charged: number; failed: number; skipped: number; reasons: string[] };

const SKIP_REASONS = new Set(["no_token", "no_token_expiry"]);

export function summarizeChargeResults(results: ChargeResult[]): CronSummary {
  const s: CronSummary = { charged: 0, failed: 0, skipped: 0, reasons: [] };
  for (const r of results) {
    if (r.ok) { s.charged++; continue; }
    if (SKIP_REASONS.has(r.reason)) s.skipped++; else s.failed++;
    s.reasons.push(`${r.clientId}:${r.reason}`);
  }
  return s;
}
