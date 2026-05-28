/** One-shot: dump the live config/demo-velvet-muse doc + highlight critical keys. */
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

console.log("=== CRITICAL KEYS ===");
console.log("splash.variant                              =", JSON.stringify(data?.splash?.variant));
console.log("language                                    =", JSON.stringify(data?.language));
console.log("hero.heroVariant                            =", JSON.stringify(data?.hero?.heroVariant));
console.log("hero.titlePrefix                            =", JSON.stringify(data?.hero?.titlePrefix));
console.log("hero.titleHighlight                         =", JSON.stringify(data?.hero?.titleHighlight));
console.log("hero.titleSuffix                            =", JSON.stringify(data?.hero?.titleSuffix));
console.log("hero.subtitle                               =", typeof data?.hero?.subtitle);
console.log("hero.tagline (should be undefined)          =", JSON.stringify(data?.hero?.tagline));
console.log("hero.title   (should be undefined)          =", JSON.stringify(data?.hero?.title));
console.log("hero.ctaPrimary (TYPE)                      =", typeof data?.hero?.ctaPrimary, "=>", JSON.stringify(data?.hero?.ctaPrimary));
console.log("hero.ctaSecondary (TYPE)                    =", typeof data?.hero?.ctaSecondary, "=>", JSON.stringify(data?.hero?.ctaSecondary));
console.log("hero.ctaPrimaryHref                         =", JSON.stringify(data?.hero?.ctaPrimaryHref));
console.log("hero.backgroundImage                        =", typeof data?.hero?.backgroundImage);
console.log("sections.whyChooseUs.whyChooseUsVariant     =", JSON.stringify(data?.sections?.whyChooseUs?.whyChooseUsVariant));
console.log("sections.services.servicesVariant           =", JSON.stringify(data?.sections?.services?.servicesVariant));
console.log("sections.gallery.galleryVariant             =", JSON.stringify(data?.sections?.gallery?.galleryVariant));
console.log("sections.contact.bookingVariant             =", JSON.stringify(data?.sections?.contact?.bookingVariant));
console.log("sections.booking (legacy, should be absent) =", data?.sections?.booking === undefined ? "undefined ✓" : JSON.stringify(data?.sections?.booking));
console.log("TOP-LEVEL heroVariant (legacy)              =", JSON.stringify(data?.heroVariant));
console.log("TOP-LEVEL servicesVariant (legacy)          =", JSON.stringify(data?.servicesVariant));
console.log("TOP-LEVEL galleryVariant (legacy)           =", JSON.stringify(data?.galleryVariant));
console.log("TOP-LEVEL bookingVariant (legacy)           =", JSON.stringify(data?.bookingVariant));
console.log("TOP-LEVEL whyChooseUsVariant (legacy)       =", JSON.stringify(data?.whyChooseUsVariant));
console.log("heroObjects.primary.src                     =", typeof data?.heroObjects?.primary?.src, data?.heroObjects?.primary?.src ? "(present)" : "(MISSING)");
console.log("services.length                             =", data?.services?.length);
console.log("gallery.length                              =", data?.gallery?.length);
console.log("business.type                               =", JSON.stringify(data?.business?.type));
console.log();
console.log("=== ALL TOP-LEVEL KEYS ===");
console.log(Object.keys(data ?? {}).sort().join(", "));
