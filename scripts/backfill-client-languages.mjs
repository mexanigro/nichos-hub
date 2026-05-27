/**
 * Backfill `language` on existing clients.
 *
 * Background: hasta hace poco hub_clients no persistía `language`, así que los
 * 6 clientes vivos (1 real + 5 demos) tienen el campo vacío. El template y el
 * LLM caen al default "he", lo cual es correcto para Israel pero deja a
 * cualquier cliente que originalmente vino en otro idioma con un mismatch
 * silencioso.
 *
 * Este script lee cada doc de hub_clients sin language y lo backfillea
 * siguiendo esta prioridad:
 *
 *   1. hub_contract_leads.lang (más alta confianza — viene del wizard /free).
 *   2. config/{internalClientId}.language (si el template ya escribió uno).
 *   3. Heurística sobre businessName:
 *        - hebreo (Alef-Tav)        → "he"
 *        - cirílico                 → "ru"
 *        - árabe                    → "ar"
 *   4. Fallback: "he" (mercado real).
 *
 * Escribe en transaction a `hub_clients.language` Y `config/{id}.language`
 * para que dashboard y template estén en sync. Loguea cada cambio en
 * `config_history/{id}/entries` con changedBy="migration-script",
 * kind="language_backfill".
 *
 * NO retraduce contenido. Si el owner cambió el idioma intencionalmente
 * después, hay que reescribir los campos a mano.
 *
 * Usage:
 *   node scripts/backfill-client-languages.mjs                   # dry-run, all
 *   node scripts/backfill-client-languages.mjs --apply           # write
 *   node scripts/backfill-client-languages.mjs --client=<id>     # one client only
 *   node scripts/backfill-client-languages.mjs --client=<id> --apply
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// ── env bootstrap (same pattern as fix-client-configs.mjs) ──
const envPath = resolve(import.meta.dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx < 0) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
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
try {
  db.settings({ preferRest: true });
} catch {}

// ── valid languages (mirror of src/lib/client-language.ts) ──
const VALID_LANGS = ["he", "en", "ru", "ar", "es"];
const DEFAULT_LANG = "he";

function isValid(v) {
  return typeof v === "string" && VALID_LANGS.includes(v);
}

// ── unicode heuristics on businessName ──
// Hebreo: bloque Alef..Tav (U+0590..U+05FF).
// Árabe: bloque árabe (U+0600..U+06FF), suplementario (U+0750..U+077F),
//        formas presentación A (U+FB50..U+FDFF) y B (U+FE70..U+FEFF).
// Cirílico: U+0400..U+04FF y suplemento U+0500..U+052F.
const RE_HEBREW = /[֐-׿]/;
const RE_ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
const RE_CYRILLIC = /[Ѐ-ԯ]/;

function inferFromText(text) {
  if (typeof text !== "string") return null;
  if (RE_HEBREW.test(text)) return "he";
  if (RE_CYRILLIC.test(text)) return "ru";
  if (RE_ARABIC.test(text)) return "ar";
  return null;
}

// ── CLI args ──
const apply = process.argv.includes("--apply");
const clientArg = process.argv.find((a) => a.startsWith("--client="));
const onlyClientId = clientArg ? clientArg.slice("--client=".length) : null;

// ── main flow ──

/**
 * Resuelve el idioma para un cliente sin language. Devuelve { language, reason }.
 *
 * @param {string} hubDocId  doc id en hub_clients
 * @param {object} hubData   payload del doc hub_clients
 */
async function resolveLanguage(hubDocId, hubData) {
  const internalClientId = hubData.clientId || hubDocId;

  // 1. hub_contract_leads.lang — más fiable (viene del wizard del lead).
  if (hubData.leadId) {
    try {
      const leadSnap = await db
        .collection("hub_contract_leads")
        .doc(hubData.leadId)
        .get();
      if (leadSnap.exists) {
        const lead = leadSnap.data() ?? {};
        if (isValid(lead.lang)) {
          return {
            language: lead.lang,
            reason: `hub_contract_leads/${hubData.leadId}.lang="${lead.lang}"`,
          };
        }
      }
    } catch (err) {
      // No bloquear el backfill por un lead corrupto.
      console.warn(
        `  (warning: failed to read lead ${hubData.leadId} for ${hubDocId}:`,
        err?.message,
        ")",
      );
    }
  }

  // 2. config/{internalClientId}.language — el template puede haber escrito uno.
  try {
    const cfgSnap = await db
      .collection("config")
      .doc(internalClientId)
      .get();
    if (cfgSnap.exists) {
      const cfg = cfgSnap.data() ?? {};
      if (isValid(cfg.language)) {
        return {
          language: cfg.language,
          reason: `config/${internalClientId}.language="${cfg.language}"`,
        };
      }
    }
  } catch (err) {
    console.warn(
      `  (warning: failed to read config/${internalClientId}:`,
      err?.message,
      ")",
    );
  }

  // 3. Heurística sobre businessName (y, como redundancia, sobre el doc id).
  const fromName = inferFromText(hubData.businessName);
  if (fromName) {
    return {
      language: fromName,
      reason: `businessName="${hubData.businessName}" → script detection`,
    };
  }

  // 4. Fallback al default (mercado real).
  return {
    language: DEFAULT_LANG,
    reason: `no signal — fallback to default "${DEFAULT_LANG}"`,
  };
}

async function processOne(hubDoc) {
  const hubDocId = hubDoc.id;
  const data = hubDoc.data() ?? {};
  const existing = data.language;
  const internalClientId = data.clientId || hubDocId;

  console.log(`\n── ${hubDocId} ──`);
  console.log(`   businessName: ${JSON.stringify(data.businessName ?? "")}`);
  console.log(`   clientId (internal): ${internalClientId}`);
  console.log(`   existing language: ${JSON.stringify(existing)}`);

  if (isValid(existing)) {
    console.log(`   SKIP — already has valid language "${existing}"`);
    return { hubDocId, status: "noop", language: existing };
  }

  const { language, reason } = await resolveLanguage(hubDocId, data);
  console.log(`   resolved: "${language}"  (${reason})`);

  if (!apply) {
    return { hubDocId, status: "dryrun", language, reason };
  }

  const now = FieldValue.serverTimestamp();
  await db.runTransaction(async (tx) => {
    tx.set(
      db.collection("hub_clients").doc(hubDocId),
      { language, updatedAt: now },
      { merge: true },
    );
    tx.set(
      db.collection("config").doc(internalClientId),
      { language },
      { merge: true },
    );
  });

  // Audit log — mismo shape que fix-client-configs.mjs.
  try {
    await db
      .collection("config_history")
      .doc(internalClientId)
      .collection("entries")
      .add({
        changedAt: now,
        changedBy: "migration-script",
        kind: "language_backfill",
        reason: `backfill-client-languages.mjs: ${reason}`,
        changeCount: 1,
        changes: [
          {
            path: "language",
            kind: "added",
            beforeSummary: existing === undefined ? "—" : JSON.stringify(existing),
            afterSummary: JSON.stringify(language),
          },
        ],
      });
  } catch (err) {
    console.error(
      `   (audit log write failed for ${hubDocId}:`,
      err?.message,
      ")",
    );
  }

  // Verify the writes landed.
  const [hubVerify, cfgVerify] = await Promise.all([
    db.collection("hub_clients").doc(hubDocId).get(),
    db.collection("config").doc(internalClientId).get(),
  ]);
  const hubLang = hubVerify.data()?.language;
  const cfgLang = cfgVerify.data()?.language;
  const matches = hubLang === language && cfgLang === language;
  console.log(
    `   ✓ applied   hub_clients.language=${JSON.stringify(hubLang)}  config.language=${JSON.stringify(cfgLang)}  ${matches ? "(match)" : "(MISMATCH)"}`,
  );

  return {
    hubDocId,
    status: matches ? "applied" : "applied-mismatch",
    language,
    reason,
    verify: { hubLang, cfgLang },
  };
}

async function main() {
  console.log(
    `backfill-client-languages.mjs — mode: ${apply ? "APPLY" : "DRY-RUN"}`,
  );
  if (onlyClientId) console.log(`target: ${onlyClientId}`);
  console.log("");

  let docs;
  if (onlyClientId) {
    const snap = await db.collection("hub_clients").doc(onlyClientId).get();
    if (!snap.exists) {
      console.error(`hub_clients/${onlyClientId} does not exist`);
      process.exit(1);
    }
    docs = [snap];
  } else {
    const all = await db.collection("hub_clients").get();
    docs = all.docs;
  }

  console.log(`scanning ${docs.length} hub_clients doc${docs.length === 1 ? "" : "s"}…`);

  const results = [];
  let missing = 0;
  for (const doc of docs) {
    if (!isValid(doc.data()?.language)) missing++;
    try {
      const r = await processOne(doc);
      results.push(r);
    } catch (err) {
      console.error(`\n${doc.id} — error:`, err);
      results.push({
        hubDocId: doc.id,
        status: "error",
        error: String(err?.message || err),
      });
    }
  }

  console.log(`\n── summary ──`);
  console.log(`  total docs scanned:   ${docs.length}`);
  console.log(`  had no valid language: ${missing}`);
  for (const r of results) {
    const tag = r.status.padEnd(18);
    if (r.status === "noop") {
      console.log(`  ${tag} ${r.hubDocId}  (kept "${r.language}")`);
    } else if (r.status === "error") {
      console.log(`  ${tag} ${r.hubDocId}  — ${r.error}`);
    } else {
      console.log(
        `  ${tag} ${r.hubDocId}  → "${r.language}"   (${r.reason})`,
      );
    }
  }

  if (!apply) {
    console.log(`\nDry-run only. Re-run with --apply to write.`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
