/**
 * Verifica que el último lead de /free en hub_leads tenga el shape esperado.
 * Uso: node --experimental-strip-types scripts/verify-free-lead.mjs [email-filter]
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
      // Soporta PRIVATE_KEY con \n literal
      val = val.replace(/\\n/g, "\n");
      process.env[key] = val;
    }
  } catch {}
}

loadEnvLocal();

const { db } = await import("../src/lib/firebase-admin.ts");

const filter = process.argv[2];
const snap = await db.collection("hub_leads").orderBy("createdAt", "desc").limit(5).get();

if (snap.empty) {
  console.log("Sin leads en hub_leads");
  process.exit(0);
}

console.log(`Encontrados ${snap.size} leads recientes:\n`);
for (const doc of snap.docs) {
  const d = doc.data();
  if (filter && !(d.email || "").includes(filter)) continue;
  console.log(`ID: ${doc.id}`);
  console.log(`  email:       ${d.email}`);
  console.log(`  whatsapp:    ${d.whatsapp || "(none)"}`);
  console.log(`  business:    ${d.businessName || "(none)"}`);
  console.log(`  niche:       ${d.niche}`);
  console.log(`  source:      ${d.source}`);
  console.log(`  status:      ${d.status}`);
  console.log(`  createdAt:   ${d.createdAt?.toDate?.()?.toISOString() || d.createdAt}`);
  console.log(`  ip:          ${d.ip || "(none)"}`);
  console.log(`  formData.locale:        ${d.formData?.locale}`);
  console.log(`  formData.businessMode:  ${d.formData?.businessMode}`);
  console.log(`  formData.colors:        ${d.formData?.colors}`);
  console.log(`  formData.logoCreate:    ${d.formData?.logoCreate}`);
  console.log(`  formData.description:   ${(d.formData?.description || "").slice(0, 80)}`);
  console.log("");
}
process.exit(0);
