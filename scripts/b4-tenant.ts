/**
 * BLOQUE-04 · tenant de prueba `test-b4-peluqueria` (autorización de Liam 2026-09-17).
 * Escribe/archiva los tres documentos directamente en Firestore (base del .env.local):
 * sin provision, sin Vercel, sin token de cobro ni nextChargeAt.
 *
 *   node scripts/b4-tenant.ts create  [--id <id>] [--fixture <ruta.json>] → hub_clients (demo) + clients + config (he)
 *   node scripts/b4-tenant.ts archive [--id <id>]                         → status archived en hub_clients y clients
 *   node scripts/b4-tenant.ts show    [--id <id>]                         → imprime los tres documentos
 *
 * VERDAD-05 (2026-09-21, D-16): `--id` sólo con prefijo `test-b4-peluqueria` (se comprueba antes de tocar Firestore; otro id → exit 2);
 * sin `--id` sigue siendo test-b4-peluqueria. Con `--fixture`, `create` escribe config/{id} desde ese JSON (más hub_clients demo y
 * clients, sin token de cobro ni nextChargeAt) y si el id de prueba ya existe lo recrea (recrear.mjs lo reescribe cada vez); el tenant
 * base no se recrea por fixture y sin `--fixture` sigue negándose a sobrescribir.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { buildProvisionDocs } from "../src/lib/provisioning.ts";

const PREFIJO = "test-b4-peluqueria";
const argv = process.argv.slice(3);
const arg = (n: string) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };
const CLIENT_ID = arg("id") ?? PREFIJO;
const FIXTURE = arg("fixture");
if (!CLIENT_ID.startsWith("test-b4-peluqueria")) { console.error(`b4-tenant: id «${CLIENT_ID}» rechazado: sólo ids con prefijo «${PREFIJO}» (D-16); no se tocó Firestore`); process.exit(2); }
if (FIXTURE && CLIENT_ID === PREFIJO) { console.error(`b4-tenant: el tenant base ${PREFIJO} no se recrea por --fixture (D-16); no se tocó Firestore`); process.exit(2); }

for (const line of readFileSync(resolve(import.meta.dirname, "../.env.local"), "utf-8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[t.slice(0, i).trim()] = v;
}
let key = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
if (/^["'`]/.test(key) && key[0] === key[key.length - 1]) key = key.slice(1, -1);
initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: key }) });
const db = process.env.FIREBASE_DATABASE_ID ? getFirestore(process.env.FIREBASE_DATABASE_ID) : getFirestore();
db.settings({ preferRest: true });

const refs = {
  hub: db.collection("hub_clients").doc(CLIENT_ID),
  client: db.collection("clients").doc(CLIENT_ID),
  config: db.collection("config").doc(CLIENT_ID),
};
const stamp = () => new Date().toISOString();
const mode = process.argv[2];

if (mode === "create" && FIXTURE) {
  // VERDAD-05 recrear.mjs (b): el fixture ES config/{id}; hub_clients y clients salen de buildProvisionDocs con los datos del fixture.
  const fx = JSON.parse(readFileSync(resolve(FIXTURE), "utf-8")) as Record<string, unknown>;
  const brand = (fx.brand ?? {}) as Record<string, string>;
  const business = (fx.business ?? {}) as Record<string, string>;
  const contact = (fx.contact ?? {}) as Record<string, string>;
  const existia = (await Promise.all(Object.values(refs).map((r) => r.get()))).some((s) => s.exists);
  const docs = buildProvisionDocs({
    businessName: brand.name ?? CLIENT_ID,
    niche: "peluqueria",
    mode: business.mode === "solo" ? "solo" : "team",
    slug: CLIENT_ID,
    domain: `${CLIENT_ID}.arzac.studio`,
    language: "he",
    phone: contact.phone ?? "03-612-4477",
    email: "website@arzac.studio",
    address: contact.address ?? "",
    tagline: brand.tagline ?? "",
    description: `VERDAD-05 recreación desde fixture ${FIXTURE.replace(/^.*[\/]/, "")}`,
  });
  const config = { ...docs.config, ...fx, business: { ...(docs.config.business as Record<string, unknown>), ...((fx.business as Record<string, unknown>) ?? {}) } };
  const hub = { ...docs.hubClient, notes: `VERDAD-05 tenant de recreación (${stamp()}) — sin Vercel, sin cobro; se reescribe en cada recrear.mjs; archivar al cerrar el bloque 4.` };
  await refs.hub.set(hub);
  await refs.client.set(docs.client);
  await refs.config.set(config);
  console.log(`${existia ? "recreado" : "creado"} ${CLIENT_ID} · ${stamp()} · config keys=${Object.keys(config).length} · business.type=${String((config.business as { type: string }).type)}`);
} else if (mode === "create") {
  const existing = await Promise.all(Object.values(refs).map((r) => r.get()));
  if (existing.some((s) => s.exists)) throw new Error(`${CLIENT_ID} ya existe en Firestore; no se sobrescribe`);
  const docs = buildProvisionDocs({
    businessName: "סטודיו בדיקה B4",
    niche: "peluqueria",
    mode: "team",
    slug: CLIENT_ID,
    domain: `${CLIENT_ID}.arzac.studio`,
    language: "he",
    phone: "03-612-4477",
    email: "website@arzac.studio",
    address: "רחוב ביאליק 24, רמת גן",
    tagline: "תספורת, צבע ופן — בדיקת בלוק 4",
    description: "תוכן לקוח בעברית לבדיקת שכבת התרגומים (BLOQUE-04 · 4.2).",
  });
  // Texto propio del cliente en hebreo (distinto del preset) para probar he→en→he.
  const config: Record<string, unknown> = {
    ...docs.config,
    hero: {
      titlePrefix: "הסטודיו",
      titleHighlight: "של בדיקה B4",
      titleSuffix: "ברמת גן",
      subtitle: "טקסט לקוח בעברית: תספורת, צבע ופן. קובעים תור אונליין או שולחים תמונה בוואטסאפ.",
      ctaPrimary: "לקביעת תור",
      ctaSecondary: "ייעוץ בוואטסאפ",
    },
  };
  const hub: Record<string, unknown> = { ...docs.hubClient, notes: "BLOQUE-04 tenant de prueba — sin Vercel, sin cobro; archivar al cerrar el bloque 4." };
  await refs.hub.set(hub);
  await refs.client.set(docs.client);
  await refs.config.set(config);
  console.log(`creado ${CLIENT_ID} · ${stamp()} · hub_clients.status=${String(hub.status)} clients.status=${String(docs.client.status)} config.business.type=${(config.business as { type: string }).type}`);
} else if (mode === "archive") {
  const at = stamp();
  await refs.hub.update({ status: "archived", archivedAt: FieldValue.serverTimestamp(), notes: `BLOQUE-04 tenant de prueba — archivado ${at}` });
  await refs.client.update({ status: "archived" });
  console.log(`archivado ${CLIENT_ID} · ${at}`);
} else if (mode === "keys") {
  const s = await refs.config.get();
  const d = (s.data() ?? {}) as Record<string, unknown>;
  console.log("config keys:", Object.keys(d).sort().join(", "));
  console.log("translations:", JSON.stringify(d.translations ?? null));
  console.log("hero:", JSON.stringify(d.hero ?? null));
} else if (mode === "show") {
  for (const [k, r] of Object.entries(refs)) {
    const s = await r.get();
    console.log(`\n## ${k} (${s.exists ? "existe" : "no existe"})`);
    if (s.exists) console.log(JSON.stringify(s.data(), null, 1)); // CONEXION-02: entero (antes recortado a 1600)
  }
} else {
  console.error("uso: node scripts/b4-tenant.ts create|archive|show|keys [--id test-b4-peluqueria-a] [--fixture <ruta.json>]");
  process.exit(1);
}
