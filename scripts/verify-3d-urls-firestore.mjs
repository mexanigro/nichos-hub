/**
 * Verify that config/demo-velvet-muse Firestore doc has the same 3D asset URLs
 * as scripts/3d-assets-output-velvet-muse-v2.json, and that each URL responds
 * HTTP 200. Read-only — does NOT modify Firestore.
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const envPath = resolve(import.meta.dirname, "../.env.local");
for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[k] = v;
}

let key = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
if (/^["'`]/.test(key) && key[0] === key[key.length - 1]) key = key.slice(1, -1);
key = key.replace(/\\n/g, "\n").replace(/\\\n/g, "\n");

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: key,
    }),
  });
}
const db = process.env.FIREBASE_DATABASE_ID
  ? getFirestore(process.env.FIREBASE_DATABASE_ID)
  : getFirestore();
try { db.settings({ preferRest: true }); } catch {}

const CLIENT = "demo-velvet-muse";
const snap = await db.collection("config").doc(CLIENT).get();
if (!snap.exists) {
  console.log(`config/${CLIENT} DOES NOT EXIST`);
  process.exit(2);
}
const data = snap.data();

const output = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "3d-assets-output-velvet-muse-v2.json"), "utf-8")
);
const assets = output[CLIENT];

const mapping = {
  "hero-primary":            ["heroObjects", "primary", "src"],
  "hero-accent":             ["heroObjects", "accent", "src"],
  "services-cut-color":      ["heroObjects", "service_cutColor", "src"],
  "services-smoothing-oil":  ["heroObjects", "service_smoothingOil", "src"],
  "decoration-ribbon-pink":  ["heroObjects", "decoration", "src"],
  "accent-pedestal-marble":  ["heroObjects", "pedestal", "src"],
  "ambient-pearls-scatter":  ["heroObjects", "ambient_pearls", "src"],
  "ambient-smoke-wisps":     ["heroObjects", "ambient_smoke", "src"],
  "ambient-pearl-single":    ["heroObjects", "ambient_pearlSingle", "src"],
};

function deepGet(obj, path) {
  return path.reduce((acc, key) => acc?.[key], obj);
}

console.log("=== heroObjects keys en Firestore ===");
console.log(Object.keys(data?.heroObjects ?? {}).sort().join(", "));
console.log();

console.log("=== COMPARE slot vs (Firestore path expected) vs (JSON src) ===");
const results = [];
for (const [slot, jsonAsset] of Object.entries(assets)) {
  const jsonSrc = jsonAsset.src;
  const expectedPath = mapping[slot] || ["heroObjects", slot, "src"];
  const firestoreSrc = deepGet(data, expectedPath);

  const match = firestoreSrc === jsonSrc;
  const hasUrl = !!firestoreSrc;
  const status = await fetch(jsonSrc, { method: "HEAD" }).then(r => r.status).catch(e => `ERR:${e.code || e.message}`);

  results.push({ slot, expectedPath: expectedPath.join("."), match, hasUrl, status, jsonSrc, firestoreSrc });
  console.log(`${slot}:`);
  console.log(`  expected at: ${expectedPath.join(".")}`);
  console.log(`  Firestore:   ${firestoreSrc ? firestoreSrc.slice(0, 110) + "..." : "(MISSING)"}`);
  console.log(`  match=${match}  json-HTTP=${status}`);
}

console.log("\n=== SUMMARY ===");
console.log(`Total slots:            ${results.length}`);
console.log(`Match Firestore=JSON:   ${results.filter(r => r.match).length}`);
console.log(`HTTP 200 (json src):    ${results.filter(r => r.status === 200).length}`);
console.log(`Missing in Firestore:   ${results.filter(r => !r.hasUrl).length}`);
console.log(`Mismatched URLs:        ${results.filter(r => r.hasUrl && !r.match).length}`);
