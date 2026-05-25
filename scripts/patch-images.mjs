/**
 * One-time script: patch Firestore config for estetica-prueba and pintureria-el-paolo
 * with niche-appropriate Unsplash images.
 *
 * Usage: node scripts/patch-images.mjs
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Load .env.local
const envPath = resolve(import.meta.dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx < 0) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  // Strip wrapping quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
}

// Initialize Firebase Admin
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

// ── Unsplash image URLs ──
// Format: https://images.unsplash.com/photo-{id}?w={width}&fit=crop&q=80

function unsplash(id, w = 1200) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&fit=crop&q=80`;
}

// ═══════════════════════════════════════════════════════════════
// Estetica Prueba — facial beauty, skincare, injections
// ALL photo IDs verified against Unsplash (2025-05-25)
// ═══════════════════════════════════════════════════════════════
const esteticaConfig = {
  hero: {
    backgroundImage: unsplash("1643684391140-c5056cfd3436", 1920), // woman receiving facial massage
  },
  sections: {
    whyChooseUs: {
      mainImage: unsplash("1713085085470-fba013d67e65", 800), // professional facial cosmetic treatment
    },
    services: {
      images: [
        unsplash("1616394584738-fc6e612e71b9", 600), // woman with face cream/beauty mask
        unsplash("1570172619644-dfd03ed5d881", 600), // facial skincare application
        unsplash("1531299244174-d247dd4e5a66", 600), // woman with cucumber eye treatment
        unsplash("1683408640631-2c99fff964d7", 600), // woman resting, eyes closed
      ],
    },
  },
  gallery: [
    { src: unsplash("1552693673-1bf958298935", 800), alt: "Tratamiento facial profesional" },
    { src: unsplash("1643684391140-c5056cfd3436", 800), alt: "Masaje facial relajante" },
    { src: unsplash("1616394584738-fc6e612e71b9", 800), alt: "Cuidado de la piel" },
    { src: unsplash("1731514771613-991a02407132", 800), alt: "Mascarilla facial" },
    { src: unsplash("1570172619644-dfd03ed5d881", 800), alt: "Tratamiento de skincare" },
    { src: unsplash("1531299244174-d247dd4e5a66", 800), alt: "Tratamiento de ojos" },
  ],
};

// ═══════════════════════════════════════════════════════════════
// Pintureria el Paolo — painting, remodeling, renovation
// ALL photo IDs verified against Unsplash (2025-05-25)
// ═══════════════════════════════════════════════════════════════
const pintureriaConfig = {
  hero: {
    backgroundImage: unsplash("1517581177682-a085bb7ffb15", 1920), // man climbing ladder during renovation
  },
  sections: {
    whyChooseUs: {
      mainImage: unsplash("1502005097973-6a7082348e28", 800), // modern kitchen with island
    },
    services: {
      images: [
        unsplash("1525909002-1b05e0c869d8", 600), // colorful paint rollers
        unsplash("1652829069862-87874e119527", 600), // close-up paint roller
        unsplash("1600054648630-e10e710825f6", 600), // minimalist renovated bedroom
        unsplash("1584622650111-993a426fbf0a", 600), // modern bathroom renovation
      ],
    },
  },
  gallery: [
    { src: unsplash("1502005097973-6a7082348e28", 800), alt: "Remodelacion de cocina" },
    { src: unsplash("1584622650111-993a426fbf0a", 800), alt: "Renovacion de bano moderno" },
    { src: unsplash("1517581177682-a085bb7ffb15", 800), alt: "Proyecto en progreso" },
    { src: unsplash("1505691938895-1758d7feb511", 800), alt: "Sala renovada" },
    { src: unsplash("1600054648630-e10e710825f6", 800), alt: "Dormitorio remodelado" },
    { src: unsplash("1634586648651-f1fb9ec10d90", 800), alt: "Obra en construccion" },
  ],
};

// ── Apply patches ──
// Correct clientIds from hub_clients collection (VITE_CLIENT_ID format)
const ESTETICA_CLIENT_ID = "demo-estetica-prueba-mpfvpl5u";
const PINTURERIA_CLIENT_ID = "demo-pintureria-el-paolo-mpfwkvuh";

async function main() {
  // Clean up wrong docs first
  console.log("Cleaning stale config/estetica-prueba (wrong doc)...");
  await db.collection("config").doc("estetica-prueba").delete().catch(() => {});
  console.log("Cleaning stale config/pintureria-el-paolo (wrong doc)...");
  await db.collection("config").doc("pintureria-el-paolo").delete().catch(() => {});

  console.log(`\nPatching ${ESTETICA_CLIENT_ID}...`);
  await db.collection("config").doc(ESTETICA_CLIENT_ID).set(esteticaConfig, { merge: true });
  console.log(`✓ ${ESTETICA_CLIENT_ID} config patched`);

  console.log(`Patching ${PINTURERIA_CLIENT_ID}...`);
  await db.collection("config").doc(PINTURERIA_CLIENT_ID).set(pintureriaConfig, { merge: true });
  console.log(`✓ ${PINTURERIA_CLIENT_ID} config patched`);

  console.log("\nDone! Both clients now have niche-appropriate images.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
