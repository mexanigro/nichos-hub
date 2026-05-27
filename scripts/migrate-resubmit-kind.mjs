/**
 * Migración H2 — config_history.kind: "resubmit" → "customer_resubmit".
 *
 * Background: el writer en /api/onboarding/client-info/route.ts grababa
 * `kind: "resubmit"` en config_history, pero hub_status_history para el
 * mismo evento usaba `kind: "customer_resubmit"` (más explícito sobre el
 * actor). Alineamos al naming más explícito.
 *
 * config_history es subcolección — recorremos cada `config_history/{clientId}`
 * y entries adentro. Si el config_history del cliente no existe, lo saltamos.
 *
 * Sólo toca el campo `kind`. NO toca otros campos del doc.
 *
 * Usage:
 *   node scripts/migrate-resubmit-kind.mjs            # dry-run
 *   node scripts/migrate-resubmit-kind.mjs --apply    # write
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

const LEGACY_KIND = "resubmit";
const CANONICAL_KIND = "customer_resubmit";

async function main() {
  console.log(
    `migrate-resubmit-kind.mjs — mode: ${apply ? "APPLY" : "DRY-RUN"}`,
  );
  console.log(`source: config_history/{clientId}/entries.kind === "${LEGACY_KIND}"`);
  console.log(`target: config_history/{clientId}/entries.kind  =  "${CANONICAL_KIND}"`);
  console.log("");

  // collectionGroup permite escanear todas las subcolecciones "entries" sin
  // listar primero cada parent doc. Mucho más barato que listar
  // config_history -> recorrer ids -> consultar entries en cada uno.
  const snap = await db
    .collectionGroup("entries")
    .where("kind", "==", LEGACY_KIND)
    .get();

  // Filtramos a sólo entries dentro de config_history (collectionGroup matchea
  // CUALQUIER subcolección llamada "entries" — hub_status_history también
  // tiene una; pero su naming nunca fue "resubmit", así que el filtro es
  // estricto y no debería traer ruido. Por las dudas validamos por path.).
  const relevant = snap.docs.filter((d) =>
    d.ref.path.startsWith("config_history/"),
  );

  console.log(
    `scanning… found ${relevant.size ?? relevant.length} legacy doc${(relevant.length === 1) ? "" : "s"} in config_history`,
  );

  if (relevant.length === 0) {
    console.log("nothing to migrate. exit clean.");
    return;
  }

  for (const doc of relevant) {
    const data = doc.data() ?? {};
    console.log(
      `  ${doc.ref.path}  changedBy=${JSON.stringify(data.changedBy ?? "—")}  changedAt=${
        data.changedAt?.toDate?.()?.toISOString?.() ?? "—"
      }`,
    );
  }

  if (!apply) {
    console.log(`\nDry-run only. Re-run with --apply to update kind.`);
    return;
  }

  // Firestore batch: hasta 500 writes por batch. config_history es de baja
  // cardinalidad (un evento por resubmit del cliente, no por interacción).
  // Si en el futuro hace falta, chunkear cada 500.
  const batch = db.batch();
  for (const doc of relevant) {
    batch.update(doc.ref, { kind: CANONICAL_KIND });
  }
  await batch.commit();

  // Verify
  const verifySnap = await db
    .collectionGroup("entries")
    .where("kind", "==", LEGACY_KIND)
    .get();
  const remaining = verifySnap.docs.filter((d) =>
    d.ref.path.startsWith("config_history/"),
  );
  console.log(
    `\n✓ applied ${relevant.length} update${relevant.length === 1 ? "" : "s"}. remaining legacy docs: ${remaining.length}`,
  );
  if (remaining.length > 0) {
    console.log("  (MISMATCH — re-run to retry)");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
