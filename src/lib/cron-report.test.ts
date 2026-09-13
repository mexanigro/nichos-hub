/**
 * P-02 (Capa A, p02-cron-v1) — el cron de cobros tiene disparador (GitHub Actions) y su respuesta se evalúa.
 * RED sobre 8c62ee8: no existe .github/workflows/cardcom-charges.yml (H-N11-2: cronSchedule null en Railway, nadie
 * llama al endpoint) y la respuesta del endpoint no distingue skipped (no_token) de failed.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { summarizeChargeResults } from "./cron-report.ts";
// El evaluador vive en .github/scripts (lo ejecuta el runner de Actions sin TypeScript); se importa tal cual.
import { evaluateCronResponse } from "../../.github/scripts/check-cron.mjs";

test("summarizeChargeResults: charged / skipped (sin token) / failed y reasons sin datos de tarjeta", () => {
  const s = summarizeChargeResults([
    { clientId: "a", ok: true, transactionId: "tx1" },
    { clientId: "b", ok: false, reason: "no_token" },
    { clientId: "c", ok: false, reason: "no_token_expiry" },
    { clientId: "d", ok: false, reason: "declined" },
  ]);
  assert.deepEqual(s, { charged: 1, failed: 1, skipped: 2, reasons: ["b:no_token", "c:no_token_expiry", "d:declined"] });
  assert.equal(JSON.stringify(s).includes("tx1"), false);
});

test("evaluateCronResponse: 200 con failed 0 → ok", () => {
  const r = evaluateCronResponse("200", JSON.stringify({ ok: true, processed: 2, charged: 0, failed: 0, skipped: 2, reasons: ["a:no_token", "b:no_token"] }));
  assert.equal(r.ok, true);
  assert.match(r.message, /charged=0 failed=0 skipped=2/);
});

test("evaluateCronResponse: 200 con failed 1 → NO ok (D-P2-3)", () => {
  const r = evaluateCronResponse("200", JSON.stringify({ ok: true, processed: 1, charged: 0, failed: 1, skipped: 0, reasons: ["a:declined"] }));
  assert.equal(r.ok, false);
  assert.match(r.message, /failed=1/);
});

test("evaluateCronResponse: HTTP ≠ 200 → NO ok; JSON inválido → NO ok", () => {
  assert.equal(evaluateCronResponse("401", JSON.stringify({ error: "unauthorized" })).ok, false);
  assert.equal(evaluateCronResponse("500", "").ok, false);
  assert.equal(evaluateCronResponse("200", "<html>").ok, false);
});

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
test("cableado: workflow con schedule 06:00 UTC + dispatch, timeout 5 min, un solo curl con el secreto y el evaluador", () => {
  const p = ROOT + ".github/workflows/cardcom-charges.yml";
  assert.ok(existsSync(p), "no existe .github/workflows/cardcom-charges.yml — el cron no tiene disparador");
  const y = readFileSync(p, "utf8");
  assert.match(y, /schedule:/);
  assert.match(y, /cron:\s*["']0 6 \* \* \*["']/, "D-P2-1: 06:00 UTC diario");
  assert.match(y, /workflow_dispatch:/);
  assert.match(y, /timeout-minutes:\s*5\b/);
  assert.equal((y.match(/\bcurl\b/g) ?? []).length, 1, "un solo curl");
  assert.match(y, /secrets\.CRON_SECRET/);
  assert.match(y, /https:\/\/arzac\.studio\/api\/cron\/cardcom-charges/);
  assert.match(y, /check-cron\.mjs/);
});

test("cableado: el endpoint responde con el resumen (summarizeChargeResults)", () => {
  const src = readFileSync(ROOT + "src/app/api/cron/cardcom-charges/route.ts", "utf8");
  assert.ok(src.includes("summarizeChargeResults("), "el cron no reporta charged/failed/skipped/reasons");
});
