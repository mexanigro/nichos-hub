/**
 * Sube la imagen de hero de estética a Firebase Storage y actualiza
 * config/demo-estetica-prueba-mpfvpl5u en Firestore con la nueva URL.
 *
 * Uso:
 *   node scripts/upload-hero-estetica.mjs
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { randomUUID } from "crypto";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// ── env bootstrap ────────────────────────────────────────────────────────────
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
try { db.settings({ preferRest: true }); } catch { /* already set */ }
const BUCKET_NAME = "barbertemplate-madre.firebasestorage.app";
const CLIENT_ID = "demo-estetica-prueba-mpfvpl5u";
const IMAGE_PATH =
  "C:\\Users\\liama\\AppData\\Roaming\\Claude\\local-agent-mode-sessions\\f03b34ae-3cec-4d2b-9c99-ec5c15172781\\87854f97-98f5-46f8-99cc-e29986ae0409\\agent\\local_ditto_87854f97-98f5-46f8-99cc-e29986ae0409\\uploads\\e016993f-195736.png";
const STORAGE_PATH = `clients/${CLIENT_ID}/images/hero-background.png`;

async function main() {
  // 1. Lee el config actual
  const configRef = db.collection("config").doc(CLIENT_ID);
  const snap = await configRef.get();
  console.log("Config actual hero.backgroundImage:", snap.data()?.hero?.backgroundImage ?? "(no override)");

  // 2. Lee la imagen local
  const buffer = readFileSync(IMAGE_PATH);
  console.log(`Imagen leída: ${buffer.length} bytes`);

  // 3. Sube a Firebase Storage
  const bucket = getStorage().bucket(BUCKET_NAME);
  const bucketFile = bucket.file(STORAGE_PATH);

  await bucketFile.save(buffer, {
    metadata: {
      contentType: "image/png",
      cacheControl: "public, max-age=31536000",
    },
  });

  // 4. Genera token de descarga público
  const token = randomUUID();
  await bucketFile.setMetadata({
    metadata: { firebaseStorageDownloadTokens: token },
  });

  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${encodeURIComponent(STORAGE_PATH)}?alt=media&token=${token}`;
  console.log("URL pública:", publicUrl);

  // 5. Actualiza Firestore config
  await configRef.set(
    { hero: { backgroundImage: publicUrl } },
    { merge: true },
  );

  console.log(`✓ Firestore config/${CLIENT_ID} actualizado con nueva hero.backgroundImage`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
