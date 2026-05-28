/**
 * Verifica el estado del dominio arzac.studio en Resend y reporta DNS records faltantes.
 *
 * NO modifica nada — solo consulta la API.
 *
 * Requiere en .env.local:
 *   RESEND_API_KEY=re_xxx
 *
 * Uso:
 *   node scripts/check-resend-domain.mjs
 *   node scripts/check-resend-domain.mjs --json   (output JSON crudo para pipes)
 *   node scripts/check-resend-domain.mjs --domain otro.com
 *
 * Exit codes:
 *   0 → dominio verificado o consulta OK con estado pending/not_added (info útil).
 *   1 → error (API key faltante, fallo de red, error 4xx/5xx).
 */

import { readFileSync } from "node:fs";

const DEFAULT_DOMAIN = "arzac.studio";

function loadEnvLocal() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      const key = m[1];
      if (process.env[key]) continue;
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {
    // No .env.local — asumimos env del shell.
  }
}

function parseArgs(argv) {
  const args = { json: false, domain: DEFAULT_DOMAIN };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") args.json = true;
    else if (a === "--domain") args.domain = argv[++i] || DEFAULT_DOMAIN;
  }
  return args;
}

async function resendFetch(path, apiKey) {
  const res = await fetch(`https://api.resend.com${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

/**
 * Mapeo de status de Resend → categorías de display.
 *   verified         → verified
 *   pending          → pending (algunos records ya OK, otros no)
 *   not_started      → pending (recién creado)
 *   failed           → pending (con error — sigue siendo "no listo")
 *   temporary_failure → pending
 *   (no encontrado)  → not_added
 */
function bucketStatus(rawStatus) {
  if (rawStatus === "verified") return "verified";
  if (!rawStatus) return "unknown";
  return "pending";
}

function providerHints(record) {
  // Resend devuelve el name relativo al dominio (ej: "send", "resend._domainkey", "" para apex).
  // En Cloudflare/Namecheap/GoDaddy el host se pega tal cual; solo el apex se representa con "@".
  const rawName = record.name || "";
  const host = rawName === "" || rawName === "@" ? "@" : rawName;
  const hints = [];
  if (record.type === "TXT") {
    hints.push("Cloudflare: Type=TXT, Name=" + host + ", Content=el value sin comillas externas.");
    hints.push("Namecheap/GoDaddy: TXT Record con Host=" + host + " y Value=el value (acepta espacios).");
  } else if (record.type === "CNAME") {
    hints.push("Cloudflare: Type=CNAME, Name=" + host + ", Target=" + record.value + ", Proxy=OFF (gris).");
    hints.push("Namecheap/GoDaddy: CNAME con Host=" + host + " apuntando al target. NO proxiar.");
  } else if (record.type === "MX") {
    hints.push("Cloudflare/Namecheap/GoDaddy: MX con Host=" + host + ", Priority=" + (record.priority ?? 10) + " y Value=" + record.value);
  }
  return hints;
}

function formatRecord(record, i) {
  const lines = [];
  lines.push(`  ${i + 1}. [${record.type}] ${record.purpose || record.record || ""}  — status: ${record.status}`);
  lines.push(`     Name  (Host):  ${record.name}`);
  lines.push(`     Value (Content): ${record.value}`);
  if (record.priority != null) lines.push(`     Priority:        ${record.priority}`);
  if (record.ttl) lines.push(`     TTL:             ${record.ttl}`);
  for (const h of providerHints(record)) {
    lines.push(`     · ${h}`);
  }
  return lines.join("\n");
}

async function main() {
  loadEnvLocal();
  const args = parseArgs(process.argv);
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("ERROR: RESEND_API_KEY no esta configurado en .env.local ni en el env del shell.");
    process.exit(1);
  }

  if (args.json) {
    // Modo machine-readable: imprime un JSON único al final.
    const out = { domain: args.domain, status: "unknown", records: [], errors: [] };
    try {
      const list = await resendFetch("/domains", apiKey);
      if (!list.ok) {
        out.errors.push({ at: "/domains", status: list.status, data: list.data });
        console.log(JSON.stringify(out, null, 2));
        process.exit(1);
      }
      const match = (list.data?.data || []).find(
        (d) => (d.name || "").toLowerCase() === args.domain.toLowerCase()
      );
      if (!match) {
        out.status = "not_added";
        console.log(JSON.stringify(out, null, 2));
        process.exit(0);
      }
      const detail = await resendFetch(`/domains/${match.id}`, apiKey);
      if (!detail.ok) {
        out.errors.push({ at: `/domains/${match.id}`, status: detail.status, data: detail.data });
        console.log(JSON.stringify(out, null, 2));
        process.exit(1);
      }
      out.status = bucketStatus(detail.data?.status);
      out.records = (detail.data?.records || []).map((r) => ({
        type: r.type,
        name: r.name,
        value: r.value,
        status: r.status,
        priority: r.priority ?? null,
        ttl: r.ttl ?? null,
        record: r.record ?? null,
      }));
      out.id = match.id;
      out.region = detail.data?.region;
      console.log(JSON.stringify(out, null, 2));
      process.exit(0);
    } catch (e) {
      out.errors.push({ at: "exception", message: e instanceof Error ? e.message : String(e) });
      console.log(JSON.stringify(out, null, 2));
      process.exit(1);
    }
  }

  console.log(`Consultando Resend por el dominio "${args.domain}"…`);

  const list = await resendFetch("/domains", apiKey);
  if (!list.ok) {
    console.error(`ERROR: GET /domains fallo (HTTP ${list.status}).`);
    console.error(JSON.stringify(list.data, null, 2));
    process.exit(1);
  }

  const domains = list.data?.data || [];
  const match = domains.find(
    (d) => (d.name || "").toLowerCase() === args.domain.toLowerCase()
  );

  if (!match) {
    console.log("");
    console.log(`❌ El dominio "${args.domain}" NO esta agregado en Resend.`);
    console.log("");
    console.log("Pasos para agregarlo:");
    console.log("  1. Entrar a https://resend.com/domains");
    console.log(`  2. Click "Add Domain" y pegar: ${args.domain}`);
    console.log("  3. Seleccionar region (recomendado: eu-west-1 si la mayoria de destinatarios estan en EU/IL).");
    console.log("  4. Resend muestra los DNS records a publicar (SPF, DKIM, DMARC).");
    console.log("  5. Volver a correr este script para confirmar que estan publicados y verificados.");
    console.log("");
    console.log("Ver outputs/dns-arzac-studio-setup.md para la guia completa.");
    process.exit(0);
  }

  const detail = await resendFetch(`/domains/${match.id}`, apiKey);
  if (!detail.ok) {
    console.error(`ERROR: GET /domains/${match.id} fallo (HTTP ${detail.status}).`);
    console.error(JSON.stringify(detail.data, null, 2));
    process.exit(1);
  }

  const status = detail.data?.status;
  const records = detail.data?.records || [];
  const bucket = bucketStatus(status);

  console.log("");
  console.log(`Dominio: ${match.name}`);
  console.log(`ID:      ${match.id}`);
  console.log(`Region:  ${detail.data?.region || "(desconocida)"}`);
  console.log(`Status:  ${status} (${bucket})`);
  console.log("");

  if (bucket === "verified") {
    console.log("✅ Listo, podes activar EMAIL_PROVIDER=resend en produccion.");
    console.log("");
    console.log("Records publicados (informativo):");
    records.forEach((r, i) => console.log(formatRecord(r, i)));
    process.exit(0);
  }

  const pending = records.filter((r) => r.status !== "verified");
  const verified = records.filter((r) => r.status === "verified");

  console.log(`⏳ Pendiente. ${pending.length}/${records.length} records DNS falta(n) verificar.`);
  console.log("");

  if (verified.length > 0) {
    console.log(`Ya verificados (${verified.length}):`);
    verified.forEach((r, i) => console.log(`  ${i + 1}. [${r.type}] ${r.name} → OK`));
    console.log("");
  }

  if (pending.length > 0) {
    console.log(`Records que FALTAN publicar/propagar (${pending.length}):`);
    pending.forEach((r, i) => console.log(formatRecord(r, i)));
    console.log("");
    console.log("Una vez publicados, Resend tarda 5-30 min en verificar.");
    console.log("Re-correr este script para confirmar.");
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("ERROR inesperado:", e);
  process.exit(1);
});
