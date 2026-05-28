/** Dump the full faq.items array to verify question/answer keys exist. */
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
if (!getApps().length) initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: key }) });
const db = process.env.FIREBASE_DATABASE_ID ? getFirestore(process.env.FIREBASE_DATABASE_ID) : getFirestore();
try { db.settings({ preferRest: true }); } catch {}

const snap = await db.collection("config").doc("demo-velvet-muse").get();
const data = snap.data();
console.log("sections.faq:", JSON.stringify(data?.sections?.faq, null, 2));
console.log("---");
console.log("hero.titlePrefix:", JSON.stringify(data?.hero?.titlePrefix));
console.log("hero.ctaPrimary:", JSON.stringify(data?.hero?.ctaPrimary), "type:", typeof data?.hero?.ctaPrimary);
console.log("hero.heroVariant:", JSON.stringify(data?.hero?.heroVariant));
console.log("---");
console.log("sections.whyChooseUs.benefits[0]:", JSON.stringify(data?.sections?.whyChooseUs?.benefits?.[0]));
console.log("testimonials[0]:", JSON.stringify(data?.testimonials?.[0]));
console.log("services[0]:", JSON.stringify(data?.services?.[0]));
console.log("staff (overlay should be absent; from preset):", Array.isArray(data?.staff) ? `${data.staff.length} entries` : "undefined");
