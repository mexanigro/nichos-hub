/**
 * One-shot data fix: corrects placeholder/broken values in `config/{clientId}`
 * for six known clients (one real + five demos).
 *
 * Background: a sequence of hub bugs (brand-package parser placeholder, demo
 * seeder using Liam's personal contacts, broken gallery shape, etc.) left
 * stale data in Firestore. The hub bugs themselves are out of scope here —
 * this script only patches the live data so the dashboard + deployed sites
 * stop showing obvious wrong values.
 *
 * Each fix is a deep-merge over `config/{clientId}`. After applying the
 * patch we re-run the same `normalizeConfigShape` the API uses on PUT, so
 * the result matches what the editor would have written.
 *
 * The script writes an audit entry per modified client to
 * `config_history/{clientId}/entries` with
 *   changedBy: "migration-script"
 *   kind:      "data_fix"
 *   reason:    "fix-client-configs.mjs (2026-05-26)"
 * so the change is traceable from the dashboard.
 *
 * Usage:
 *   node scripts/fix-client-configs.mjs                  # dry-run, all clients
 *   node scripts/fix-client-configs.mjs --apply          # write all
 *   node scripts/fix-client-configs.mjs <clientId>       # dry-run, one client
 *   node scripts/fix-client-configs.mjs <clientId> --apply
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// ── env bootstrap (same pattern as inspect-config.mjs / migrate-config-shape.mjs) ──
const envPath = resolve(import.meta.dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx < 0) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
}

let cleanKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
if (/^["'`]/.test(cleanKey) && cleanKey[0] === cleanKey[cleanKey.length - 1]) {
  cleanKey = cleanKey.slice(1, -1);
}
cleanKey = cleanKey.replace(/\\n/g, "\n").replace(/\\\n/g, "\n");

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: cleanKey,
  }),
});

const databaseId = process.env.FIREBASE_DATABASE_ID;
const db = databaseId ? getFirestore(databaseId) : getFirestore();
try { db.settings({ preferRest: true }); } catch {}

// ── normalizeConfigShape — mirror of src/app/api/config/[clientId]/route.ts ──

function normalizeImageArray(value) {
  if (!Array.isArray(value)) return undefined;
  const out = [];
  for (const item of value) {
    if (typeof item === "string") {
      if (item) out.push(item);
    } else if (item && typeof item === "object") {
      const candidate = item.src ?? item.url ?? item.href;
      if (typeof candidate === "string" && candidate) out.push(candidate);
    }
  }
  return out;
}

function normalizeConfigShape(data) {
  const out = { ...data };

  if (out.brand && typeof out.brand === "object" && !Array.isArray(out.brand)) {
    const brand = { ...out.brand };
    if ("favicon" in brand) brand.favicon = null;
    out.brand = brand;
  }
  if ("_unused" in out) out._unused = null;

  const flatGallery = normalizeImageArray(out.gallery);
  if (flatGallery !== undefined) out.gallery = flatGallery;

  if (out.sections && typeof out.sections === "object" && !Array.isArray(out.sections)) {
    const sections = { ...out.sections };
    if (sections.services && typeof sections.services === "object") {
      const services = { ...sections.services };
      const flat = normalizeImageArray(services.images);
      if (flat !== undefined) services.images = flat;
      sections.services = services;
    }
    if (sections.instagram && typeof sections.instagram === "object") {
      const instagram = { ...sections.instagram };
      const flat = normalizeImageArray(instagram.images);
      if (flat !== undefined) instagram.images = flat;
      sections.instagram = instagram;
    }
    out.sections = sections;
  }

  if (Array.isArray(out.staff)) {
    out.staff = out.staff.map((m) => {
      if (!m || typeof m !== "object") return m;
      const next = { ...m };
      const flat = normalizeImageArray(next.portfolio);
      if (flat !== undefined) next.portfolio = flat;
      return next;
    });
  }

  if (out.owner && typeof out.owner === "object") {
    const owner = { ...out.owner };
    const flat = normalizeImageArray(owner.portfolio);
    if (flat !== undefined) owner.portfolio = flat;
    out.owner = owner;
  }

  return out;
}

// ── deep merge (plain objects only — arrays replace) ──
function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge(target, patch) {
  if (!isPlainObject(patch)) return patch;
  const out = isPlainObject(target) ? { ...target } : {};
  for (const [k, v] of Object.entries(patch)) {
    if (isPlainObject(v)) {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ── diff (mirrors src/lib/config-diff.ts for audit log + dry-run preview) ──
function diffConfig(before, after, basePath = "") {
  const out = [];
  walk(before, after, basePath, out);
  return out;
}
function walk(b, a, path, out) {
  if (isPlainObject(b) && isPlainObject(a)) {
    const keys = Array.from(new Set([...Object.keys(b), ...Object.keys(a)])).sort();
    for (const k of keys) walk(b[k], a[k], path ? `${path}.${k}` : k, out);
    return;
  }
  if ((b === undefined || b === null) && (a === undefined || a === null)) return;
  if (Array.isArray(b) || Array.isArray(a)) {
    if (JSON.stringify(b) !== JSON.stringify(a)) out.push({ path, kind: classify(b, a), before: b, after: a });
    return;
  }
  if (b === a) return;
  if (JSON.stringify(b) === JSON.stringify(a)) return;
  out.push({ path, kind: classify(b, a), before: b, after: a });
}
function classify(b, a) {
  if ((b === undefined || b === null) && !(a === undefined || a === null)) return "added";
  if (!(b === undefined || b === null) && (a === undefined || a === null)) return "removed";
  return "changed";
}
function summarize(v) {
  if (v === null) return "null";
  if (v === undefined) return "—";
  if (typeof v === "string") {
    if (v.length === 0) return '""';
    if (v.length <= 80) return JSON.stringify(v);
    return JSON.stringify(v.slice(0, 77) + "…");
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `[${v.length} item${v.length === 1 ? "" : "s"}]`;
  if (typeof v === "object") {
    const keys = Object.keys(v);
    return `{${keys.length} key${keys.length === 1 ? "" : "s"}}`;
  }
  return String(v);
}

// ── persona templates ──
const ONYX_PERSONA = "Sos el asistente virtual de ONYX & STEEL Barbershop. Respondes consultas sobre servicios, turnos disponibles, ubicación y horarios. No reveles información privada del negocio (otros clientes, datos del staff fuera de lo público). Si te preguntan algo fuera del scope del negocio, redirigí amablemente al tema.";
const NAILS_PERSONA = "Sos el asistente virtual de Uñas de mar. Respondes consultas sobre servicios de manicura, turnos disponibles, ubicación y horarios. No reveles información privada del negocio. Si te preguntan algo fuera del scope, redirigí amablemente al tema.";
const PINTURERIA_PERSONA = "Sos el asistente virtual de Pintureria el paolo. Respondes consultas sobre servicios de pintura y remodelaciones, presupuestos, zonas de cobertura y disponibilidad. No reveles información privada del negocio. Si te preguntan algo fuera del scope, redirigí amablemente al tema.";
const MARTELLIN_PERSONA = "Sos el asistente virtual del estudio de tatuajes Martellin. Respondes consultas sobre estilos disponibles, turnos, cuidados post-tatuaje y ubicación. No reveles información privada del negocio (otros clientes, datos del staff fuera de lo público). Si te preguntan algo fuera del scope, redirigí amablemente al tema.";

// ── per-client patches ──
// Each patch is a partial config object that gets deep-merged over the current
// document, then re-normalized via normalizeConfigShape before writing.
//
// Arrays in patches REPLACE the existing array (Firestore semantics + our
// deepMerge). `null` values request field deletion (replaceNullsWithDelete).
const PATCHES = {
  client_barber_01: {
    brand: {
      name: "ONYX & STEEL",
      aiPersona: ONYX_PERSONA,
    },
    business: {
      legalName: "ONYX & STEEL Barbershop",
      address: "Dirección por confirmar",
      cancellationPolicy: "Política de cancelación por confirmar — contactá a Liam",
    },
    payment: {
      provider: "cardcom",
      currency: "ILS",
    },
    _needsLiamInput: [
      "business.legalName",
      "business.address",
      "business.cancellationPolicy",
    ],
  },

  "demo-cafe-aristano-mpfwjz7c": {
    staff: [],
    contact: {
      phone: "+972 50 123 4501",
      email: "info@cafe-aristano.demo",
    },
  },

  "demo-estetica-prueba-mpfvpl5u": {
    brand: {
      tagline: "Hacemos labios, pómulos, toda la cara, y la piel",
    },
    contact: {
      phone: "+972 50 123 4502",
      email: "info@estetica-prueba.demo",
    },
  },

  "demo-u-as-de-mar-mpfynv07": {
    brand: {
      aiPersona: NAILS_PERSONA,
    },
    contact: {
      phone: "+972 50 123 4504",
      email: "info@unas-de-mar.demo",
      address: {
        street: "Ben Yehuda 88",
        cityStateZip: "Tel Aviv, 6343506",
        district: "Center",
      },
    },
  },

  "demo-pintureria-el-paolo-mpfwkvuh": {
    brand: {
      aiPersona: PINTURERIA_PERSONA,
    },
    contact: {
      phone: "+972 50 123 4503",
      email: "info@pintureria-el-paolo.demo",
      address: {
        street: "HaHistadrut 15",
        cityStateZip: "Petah Tikva, 4951115",
        district: "Industrial",
      },
    },
  },

  "demo-martellin-mpfwij1m": {
    brand: {
      aiPersona: MARTELLIN_PERSONA,
    },
    contact: {
      phone: "+972 50 123 4505",
      email: "info@martellin.demo",
      address: {
        street: "Florentin 22",
        cityStateZip: "Tel Aviv, 6604120",
        district: "Florentin",
      },
    },
  },
};

// ── Firestore set/merge needs `null` → FieldValue.delete() for actual removals.
//    Same helper the API uses (replaceNullsWithDelete).
function replaceNullsWithDelete(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null) {
      out[k] = FieldValue.delete();
    } else if (isPlainObject(v)) {
      out[k] = replaceNullsWithDelete(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ── CLI ──
const args = process.argv.slice(2).filter((a) => a !== "--dry-run"); // --dry-run is default
const apply = process.argv.includes("--apply");
const onlyClientId = args.find((a) => !a.startsWith("--"));

const targetIds = onlyClientId ? [onlyClientId] : Object.keys(PATCHES);
const unknown = targetIds.filter((id) => !PATCHES[id]);
if (unknown.length) {
  console.error(`Unknown clientId(s): ${unknown.join(", ")}`);
  console.error(`Known: ${Object.keys(PATCHES).join(", ")}`);
  process.exit(1);
}

async function processOne(clientId) {
  const ref = db.collection("config").doc(clientId);
  const snap = await ref.get();
  if (!snap.exists) {
    console.log(`\n── ${clientId} ──`);
    console.log(`  SKIP — config/${clientId} does not exist`);
    return { clientId, status: "missing" };
  }
  const before = snap.data() ?? {};
  const patched = deepMerge(before, PATCHES[clientId]);
  const after = normalizeConfigShape(patched);

  // Compute diff against the *current* doc (not against a normalized current),
  // because that's what actually changes on disk.
  const diffs = diffConfig(before, after);

  console.log(`\n── ${clientId} ──`);
  if (diffs.length === 0) {
    console.log(`  no changes needed`);
    return { clientId, status: "noop" };
  }

  for (const d of diffs) {
    console.log(`  [${d.kind}] ${d.path}`);
    console.log(`     before: ${summarize(d.before)}`);
    console.log(`     after:  ${summarize(d.after)}`);
  }

  if (!apply) return { clientId, status: "dryrun", diffs };

  // Build the write payload: every changed top-level key, taken from `after`.
  // Same approach as migrate-config-shape.mjs; keeps the merge surface tight.
  const writePayload = {};
  for (const d of diffs) {
    const root = d.path.split(".")[0];
    writePayload[root] = after[root];
  }
  const cleaned = replaceNullsWithDelete(writePayload);
  await ref.set(cleaned, { merge: true });

  // Audit log entry — same shape the API writes, plus a `kind` + `reason`.
  try {
    const changes = diffs.slice(0, 100).map((d) => ({
      path: d.path,
      kind: d.kind,
      beforeSummary: summarize(d.before),
      afterSummary: summarize(d.after),
    }));
    await db.collection("config_history").doc(clientId).collection("entries").add({
      changedAt: FieldValue.serverTimestamp(),
      changedBy: "migration-script",
      kind: "data_fix",
      reason: "fix-client-configs.mjs (2026-05-26): placeholder cleanup + missing aiPersona + demo contact replacement",
      changeCount: diffs.length,
      truncated: diffs.length > 100,
      changes,
    });
  } catch (err) {
    console.error(`  (audit log write failed for ${clientId}:`, err?.message, ")");
  }

  // Read back to verify the write landed.
  const verifySnap = await ref.get();
  const verify = verifySnap.data() ?? {};
  let mismatches = 0;
  for (const d of diffs) {
    const path = d.path.split(".");
    let cursor = verify;
    let missing = false;
    for (const seg of path) {
      if (cursor && typeof cursor === "object" && seg in cursor) cursor = cursor[seg];
      else { missing = true; break; }
    }
    if (missing) {
      // FieldValue.delete() targets — confirm the field is indeed gone.
      if (d.after === null) continue;
      console.log(`     ⚠ verify: path "${d.path}" is missing after write`);
      mismatches++;
      continue;
    }
    const got = JSON.stringify(cursor);
    const want = JSON.stringify(d.after);
    if (got !== want) {
      console.log(`     ⚠ verify: path "${d.path}" got ${got?.slice(0, 80)} (wanted ${want?.slice(0, 80)})`);
      mismatches++;
    }
  }
  console.log(`  ✓ applied (${diffs.length} change${diffs.length === 1 ? "" : "s"}; verify mismatches: ${mismatches})`);
  return { clientId, status: "applied", diffs, mismatches };
}

async function main() {
  console.log(`fix-client-configs.mjs — mode: ${apply ? "APPLY" : "DRY-RUN"}`);
  console.log(`targets: ${targetIds.join(", ")}\n`);

  const results = [];
  for (const id of targetIds) {
    try {
      const r = await processOne(id);
      results.push(r);
    } catch (err) {
      console.error(`\n${id} — error:`, err);
      results.push({ clientId: id, status: "error", error: String(err?.message || err) });
    }
  }

  console.log(`\n── summary ──`);
  for (const r of results) {
    console.log(`  ${r.clientId}: ${r.status}${r.diffs ? ` (${r.diffs.length} diff${r.diffs.length === 1 ? "" : "s"})` : ""}`);
  }
  if (!apply) console.log(`\nDry-run only. Re-run with --apply to write.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
