import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const envPath = "/sessions/compassionate-quirky-darwin/mnt/Desktop/Nichos-hub/.env.local";
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
const d = snap.data();
console.log("brand.name           =", JSON.stringify(d?.brand?.name));
console.log("brand.tagline        =", JSON.stringify(d?.brand?.tagline));
console.log("brand.faviconEmoji   =", JSON.stringify(d?.brand?.faviconEmoji));
console.log("brand.logo           =", JSON.stringify(d?.brand?.logo));
console.log("heroObjects.primary  =", JSON.stringify(d?.heroObjects?.primary, null, 2));
console.log("heroObjects.secondary=", JSON.stringify(d?.heroObjects?.secondary, null, 2));
console.log("heroObjects.accent   =", JSON.stringify(d?.heroObjects?.accent, null, 2));
console.log("globalAmbientParticles=", JSON.stringify(d?.globalAmbientParticles));
console.log("splash.enabled       =", JSON.stringify(d?.splash?.enabled));
console.log("splash full          =", JSON.stringify(d?.splash, null, 2));
console.log("clients_doc_status:");
const c = await db.collection("clients").doc("demo-velvet-muse").get();
console.log("  exists:", c.exists, "data:", c.exists ? JSON.stringify(c.data()) : "n/a");
