// P-02 — evalúa la respuesta del cron de cobros en el runner de Actions. Uso: node check-cron.mjs <http_code> <archivo-json>
// Falla (exit 1) si HTTP ≠ 200 o si failed > 0 (D-P2-3). No imprime secretos ni datos de tarjeta: sólo el resumen.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function evaluateCronResponse(httpCode, bodyText) {
  if (String(httpCode) !== "200") return { ok: false, message: `HTTP ${httpCode} — el cron no respondió 200` };
  let body;
  try { body = JSON.parse(bodyText); } catch { return { ok: false, message: "HTTP 200 pero la respuesta no es JSON" }; }
  const charged = Number(body.charged ?? 0), failed = Number(body.failed ?? 0), skipped = Number(body.skipped ?? 0), processed = Number(body.processed ?? 0);
  const reasons = Array.isArray(body.reasons) ? body.reasons.join(", ") : "";
  const message = `processed=${processed} charged=${charged} failed=${failed} skipped=${skipped}${reasons ? ` reasons=[${reasons}]` : ""}`;
  return { ok: failed === 0, message };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [code, file] = process.argv.slice(2);
  let text = "";
  try { text = readFileSync(file, "utf8"); } catch { text = ""; }
  const r = evaluateCronResponse(code, text);
  console.log(r.message);
  process.exit(r.ok ? 0 : 1);
}
