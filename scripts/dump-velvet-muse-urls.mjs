/**
 * Dump all image URLs from config/demo-velvet-muse with HTTP status check.
 * Focus: heroObjects.{primary,secondary,accent}.src, hero.assets.*, and any *.src/*.url.
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// --- Load .env.local manually -----------------------------------------------
const envPath = resolve(import.meta.dirname, "../.env.local");
for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[k] = v;
}

// --- Normalize private key --------------------------------------------------
let key = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
if (/^["'`]/.test(key) && key[0] === key[key.length - 1]) key = key.slice(1, -1);
key = key.replace(/\\n/g, "\n").replace(/\\\n/g, "\n");

// --- Init Firebase Admin (separate env vars, NOT FIREBASE_SERVICE_ACCOUNT_JSON)
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

// --- Read doc ---------------------------------------------------------------
const CLIENT = "demo-velvet-muse";
const snap = await db.collection("config").doc(CLIENT).get();
if (!snap.exists) {
  console.error(`config/${CLIENT} DOES NOT EXIST`);
  process.exit(2);
}
const data = snap.data();

// --- Walk every leaf, collect strings that look like URLs -------------------
const URL_RE = /^https?:\/\//i;
const found = []; // { path, url }

function walk(node, path) {
  if (node === null || node === undefined) return;
  if (typeof node === "string") {
    if (URL_RE.test(node) && /(\.(png|jpg|jpeg|webp|gif|svg|glb|gltf|mp4|webm|avif)|firebasestorage|googleusercontent)/i.test(node)) {
      found.push({ path, url: node });
    }
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${path}[${i}]`));
    return;
  }
  if (typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      walk(v, path ? `${path}.${k}` : k);
    }
  }
}

walk(data, "");

// --- Prioritize known 3D slots: print these explicitly first ----------------
const PRIORITY_PATHS = [
  "heroObjects.primary.src",
  "heroObjects.secondary.src",
  "heroObjects.accent.src",
];

console.log("=== PRIORITY 3D SLOTS ===");
for (const p of PRIORITY_PATHS) {
  const segs = p.split(".");
  let cur = data;
  for (const s of segs) {
    cur = cur?.[s];
    if (cur === undefined) break;
  }
  console.log(`${p} = ${cur ?? "(MISSING)"}`);
}

console.log("\n=== hero.assets.* ===");
const heroAssets = data?.hero?.assets;
if (heroAssets) {
  console.log(JSON.stringify(heroAssets, null, 2));
} else {
  console.log("(no hero.assets present)");
}

// --- Verify each URL with fetch ---------------------------------------------
console.log("\n=== ALL FOUND URLs (with HTTP status) ===");

const unique = new Map(); // url -> first-seen path
for (const f of found) {
  if (!unique.has(f.url)) unique.set(f.url, f.path);
}

const rows = [];
for (const [url, path] of unique) {
  let status;
  try {
    const res = await fetch(url, { method: "GET" });
    status = res.status;
  } catch (err) {
    status = `ERR ${err.message}`;
  }
  rows.push({ path, url, status });
  console.log(`[${status}] ${path}`);
  console.log(`        ${url}`);
}

// --- Final compact JSON report ---------------------------------------------
console.log("\n=== JSON REPORT ===");
console.log(JSON.stringify(rows, null, 2));
