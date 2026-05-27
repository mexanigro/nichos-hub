/**
 * Migración H1 — provider_messages.kind: "changes_request" → "changes_requested".
 *
 * Background: el writer en /api/clients/changes-request/route.ts grababa
 * `kind: "changes_request"` (sin "d"), mientras que hub_status_history grababa
 * `kind: "changes_requested"` para el mismo evento. Quedamos con dos naming
 * distintos para la misma cosa. Este script alinea los docs viejos al nuevo
 * naming (con "d") para que cualquier consumidor pueda filtrar por un único
 * kind canónico.
 *
 * Sólo toca el campo `kind`. NO toca otros campos del doc.
 *
 * Usage:
 *   node scripts/migrate-changes-request-kind.mjs            # dry-run
 *   node scripts/migrate-changes-request-kind.mjs --apply    # write
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ── env bootstrap (same pattern as backfill-client-languages.mjs) ──
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

const apply = process.argv.includes("--apply");

const LEGACY_KIND = "changes_request";
const CANONICAL_KIND = "changes_requested";

async function main() {
  console.log(
    `migrate-changes-request-kind.mjs — mode: ${apply ? "APPLY" : "DRY-RUN"}`,
  );
  console.log(`source: provider_messages.kind === "${LEGACY_KIND}"`);
  console.log(`target: provider_messages.kind  =  "${CANONICAL_KIND}"`);
  console.log("");

  const snap = await db
    .collection("provider_messages")
    .where("kind", "==", LEGACY_KIND)
    .get();

  console.log(`scanning… found ${snap.size} legacy doc${snap.size === 1 ? "" : "s"}`);

  if (snap.empty) {
    console.log("nothing to migrate. exit clean.");
    return;
  }

  for (const doc of snap.docs) {
    const data = doc.data() ?? {};
    console.log(
      `  ${doc.id}  clientId=${JSON.stringify(data.clientId ?? "—")}  createdAt=${
        data.createdAt?.toDate?.()?.toISOString?.() ?? "—"
      }`,
    );
  }

  if (!apply) {
    console.log(`\nDry-run only. Re-run with --apply to update kind.`);
    return;
  }

  // Firestore batch: hasta 500 writes por batch. provider_messages no va a
  // tener miles de docs viejos con este kind (es el envío de Liam pidiendo
  // cambios), así que un solo batch alcanza. Si en el futuro hay más, hay que
  // chunkearlo.
  const batch = db.batch();
  for (const doc of snap.docs) {
    batch.update(doc.ref, { kind: CANONICAL_KIND });
  }
  await batch.commit();

  // Verify
  const verifySnap = await db
    .collection("provider_messages")
    .where("kind", "==", LEGACY_KIND)
    .get();
  console.log(
    `\n✓ applied ${snap.size} update${snap.size === 1 ? "" : "s"}. remaining legacy docs: ${verifySnap.size}`,
  );
  if (verifySnap.size > 0) {
    console.log("  (MISMATCH — re-run to retry)");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
