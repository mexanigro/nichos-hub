/**
 * Borra leads de hub_leads que matchean un filtro de email.
 * Uso: node --experimental-strip-types scripts/cleanup-test-lead.mjs qa-free-wizard
 *
 * Solo borra docs con source="free-demo" para no tocar nada que no sea del wizard.
 */

import { readFileSync } from "node:fs";

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
      val = val.replace(/\\n/g, "\n");
      process.env[key] = val;
    }
  } catch {}
}

loadEnvLocal();

const filter = process.argv[2];
if (!filter || filter.length < 4) {
  console.error("ERROR: dame un filtro de email de al menos 4 chars");
  process.exit(1);
}

const { db } = await import("../src/lib/firebase-admin.ts");

const snap = await db
  .collection("hub_leads")
  .where("source", "==", "free-demo")
  .get();

let deleted = 0;
for (const doc of snap.docs) {
  const email = doc.data().email || "";
  if (!email.includes(filter)) continue;
  console.log(`Borrando ${doc.id} (${email})`);
  await doc.ref.delete();
  deleted++;
}

console.log(`\n${deleted} lead(s) borrado(s).`);
process.exit(0);
