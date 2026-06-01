/** Dump full heroObjects map from config/demo-velvet-muse. Read-only. */
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
  initializeApp({ credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: key,
  })});
}
const db = process.env.FIREBASE_DATABASE_ID ? getFirestore(process.env.FIREBASE_DATABASE_ID) : getFirestore();
try { db.settings({ preferRest: true }); } catch {}

const snap = await db.collection("config").doc("demo-velvet-muse").get();
const data = snap.data();
console.log("FULL heroObjects:");
console.log(JSON.stringify(data?.heroObjects, null, 2));
console.log();
console.log("heroObjects keys:", Object.keys(data?.heroObjects ?? {}));
console.log();

// Check all URLs found inside heroObjects
const urls = [];
function walk(o, path = []) {
  if (o == null) return;
  if (typeof o === "string" && o.startsWith("http")) urls.push({ path: path.join("."), url: o });
  else if (typeof o === "object") for (const k of Object.keys(o)) walk(o[k], [...path, k]);
}
walk(data?.heroObjects, ["heroObjects"]);
console.log("URLs encontradas dentro de heroObjects:");
for (const u of urls) {
  const s = await fetch(u.url, { method: "HEAD" }).then(r => r.status).catch(e => `ERR:${e.code || e.message}`);
  console.log(`  HTTP ${s}  ${u.path}`);
  console.log(`        ${u.url}`);
}
