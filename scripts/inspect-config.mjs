/**
 * Read-only inspector for Firestore config/{clientId}.
 *
 * Prints the document and lints the shape against what the master-template
 * expects (gallery: string[], hero.backgroundImage: string, etc).
 *
 * Usage:
 *   node scripts/inspect-config.mjs <clientId>
 *   node scripts/inspect-config.mjs demo-estetica-prueba-mpfvpl5u
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

const clientId = process.argv[2];
if (!clientId) {
  console.error("Usage: node scripts/inspect-config.mjs <clientId>");
  process.exit(1);
}

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function ok(msg) { console.log(`  ${GREEN}OK${RESET}  ${msg}`); }
function warn(msg) { console.log(`  ${YELLOW}WARN${RESET}  ${msg}`); }
function bad(msg) { console.log(`  ${RED}BAD${RESET}  ${msg}`); }

function isStringArray(v) {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function describeArray(v) {
  if (!Array.isArray(v)) return `not an array (typeof = ${typeof v})`;
  if (v.length === 0) return "empty array";
  const sample = v[0];
  if (typeof sample === "string") return `string[] (${v.length})`;
  if (sample && typeof sample === "object") {
    const keys = Object.keys(sample).slice(0, 3).join(",");
    return `array of objects (${v.length}; keys: ${keys})`;
  }
  return `array of ${typeof sample}`;
}

async function main() {
  const snap = await db.collection("config").doc(clientId).get();
  if (!snap.exists) {
    console.log(`${RED}config/${clientId} does not exist${RESET}`);
    process.exit(2);
  }
  const data = snap.data();

  console.log("\n=== Raw document ===");
  console.log(JSON.stringify(data, null, 2));

  console.log("\n=== Shape lint (vs master-template expectations) ===");

  // brand.name — string, non-empty, not the literal placeholder
  const brandName = data?.brand?.name;
  if (typeof brandName !== "string" || !brandName.trim()) {
    bad(`brand.name missing or empty (got: ${JSON.stringify(brandName)}) — splash will render nothing`);
  } else if (/^sin\s*nombre$/i.test(brandName.trim())) {
    bad(`brand.name = "${brandName}" — that's the brand-package-parser placeholder, not a real name`);
  } else {
    ok(`brand.name = "${brandName}"`);
  }

  // gallery — string[]
  if (data?.gallery !== undefined) {
    if (isStringArray(data.gallery)) {
      ok(`gallery: ${describeArray(data.gallery)}`);
    } else {
      bad(`gallery: ${describeArray(data.gallery)} — template expects string[], Gallery.tsx will render [object Object]`);
    }
  }

  // hero.backgroundImage — string
  const heroBg = data?.hero?.backgroundImage;
  if (heroBg !== undefined) {
    if (typeof heroBg === "string") ok(`hero.backgroundImage: string`);
    else bad(`hero.backgroundImage: not a string (typeof = ${typeof heroBg})`);
  }

  // sections.whyChooseUs.mainImage — string
  const wcu = data?.sections?.whyChooseUs?.mainImage;
  if (wcu !== undefined) {
    if (typeof wcu === "string") ok(`sections.whyChooseUs.mainImage: string`);
    else bad(`sections.whyChooseUs.mainImage: not a string (typeof = ${typeof wcu})`);
  }

  // sections.services.images — string[]
  const svc = data?.sections?.services?.images;
  if (svc !== undefined) {
    if (isStringArray(svc)) ok(`sections.services.images: ${describeArray(svc)}`);
    else bad(`sections.services.images: ${describeArray(svc)} — template expects string[]`);
  }

  // sections.instagram.images — string[]
  const ig = data?.sections?.instagram?.images;
  if (ig !== undefined) {
    if (isStringArray(ig)) ok(`sections.instagram.images: ${describeArray(ig)}`);
    else bad(`sections.instagram.images: ${describeArray(ig)} — template expects string[]`);
  }

  // staff[].portfolio + photoUrl
  if (Array.isArray(data?.staff)) {
    data.staff.forEach((m, i) => {
      if (m?.photoUrl !== undefined && typeof m.photoUrl !== "string") {
        bad(`staff[${i}].photoUrl: typeof = ${typeof m.photoUrl}`);
      }
      if (m?.portfolio !== undefined) {
        if (isStringArray(m.portfolio)) ok(`staff[${i}].portfolio: ${describeArray(m.portfolio)}`);
        else bad(`staff[${i}].portfolio: ${describeArray(m.portfolio)}`);
      }
    });
  }

  // owner.portfolio — string[]
  if (data?.owner?.portfolio !== undefined) {
    if (isStringArray(data.owner.portfolio)) ok(`owner.portfolio: ${describeArray(data.owner.portfolio)}`);
    else bad(`owner.portfolio: ${describeArray(data.owner.portfolio)}`);
  }

  // splash.variant — number 1..7
  const variant = data?.splash?.variant;
  if (variant !== undefined) {
    if (typeof variant === "number" && variant >= 1 && variant <= 7) ok(`splash.variant: ${variant}`);
    else bad(`splash.variant: ${JSON.stringify(variant)} — must be 1..7`);
  }

  // business.type — known niche
  const bt = data?.business?.type;
  if (bt && !["barberia", "estetica", "tattoo", "nails", "cafeteria", "remodelaciones"].includes(bt)) {
    warn(`business.type = "${bt}" — not a known niche; template falls back to safe-overlay merge only`);
  } else if (bt) {
    ok(`business.type: ${bt}`);
  }

  console.log("");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
