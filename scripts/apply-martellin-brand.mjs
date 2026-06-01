/**
 * Apply Martellin brand package to demo-martellin-mpfwij1m config in Firestore.
 *
 * Usage:
 *   node scripts/apply-martellin-brand.mjs          # dry-run (shows what would change)
 *   node scripts/apply-martellin-brand.mjs --apply  # actually upload + write to Firestore
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { randomUUID } from "crypto";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// ── Config ─────────────────────────────────────────────────────────────────
const CLIENT_ID = "demo-martellin-mpfwij1m";
const BRAND_PACKAGE_DIR = "C:\\Users\\liama\\Desktop\\Mis webs\\martellin_complete_brand_package";
const STORAGE_BUCKET = "barbertemplate-madre.firebasestorage.app";

// ── Env bootstrap ──────────────────────────────────────────────────────────
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

const bucket = getStorage().bucket(STORAGE_BUCKET);

// ── CLI args ───────────────────────────────────────────────────────────────
const APPLY = process.argv.includes("--apply");

// ── Brand data ─────────────────────────────────────────────────────────────
const brandDataPath = resolve(BRAND_PACKAGE_DIR, "brand-data.json");
const brandData = JSON.parse(readFileSync(brandDataPath, "utf-8"));

console.log(`\n🎨 Martellin Brand → ${CLIENT_ID}`);
console.log(`   Mode: ${APPLY ? "APPLY (real write)" : "DRY-RUN (preview only)"}\n`);

// ── Images to upload ───────────────────────────────────────────────────────
const IMAGES_TO_UPLOAD = [
  {
    localPath: resolve(BRAND_PACKAGE_DIR, "images", "logo_primary_light.png"),
    storageName: "logo_primary_light.png",
    configKey: "brand.logo",
    description: "Logo fondo claro",
  },
  {
    localPath: resolve(BRAND_PACKAGE_DIR, "images", "logo_reversed_dark.png"),
    storageName: "logo_reversed_dark.png",
    configKey: "brand.logoDark",
    description: "Logo fondo oscuro",
  },
  {
    localPath: resolve(BRAND_PACKAGE_DIR, "images", "og-image.png"),
    storageName: "og-image.png",
    configKey: "brand.ogImage",
    description: "OG Image (social share)",
  },
];

// ── Upload images ──────────────────────────────────────────────────────────
const uploadedUrls = {};

for (const img of IMAGES_TO_UPLOAD) {
  if (!existsSync(img.localPath)) {
    console.log(`   ⚠ SKIP ${img.description}: file not found at ${img.localPath}`);
    continue;
  }

  const fileSize = readFileSync(img.localPath).length;
  console.log(`   📎 ${img.description}: ${img.storageName} (${(fileSize / 1024).toFixed(0)} KB)`);

  if (APPLY) {
    const buffer = readFileSync(img.localPath);
    const timestamp = Date.now();
    const storagePath = `clients/${CLIENT_ID}/images/${timestamp}-${img.storageName}`;
    const bucketFile = bucket.file(storagePath);

    await bucketFile.save(buffer, {
      metadata: {
        contentType: "image/png",
        cacheControl: "public, max-age=31536000",
      },
    });

    const token = randomUUID();
    await bucketFile.setMetadata({
      metadata: { firebaseStorageDownloadTokens: token },
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
    uploadedUrls[img.configKey] = publicUrl;
    console.log(`      ✅ Uploaded → ${storagePath}`);
  } else {
    uploadedUrls[img.configKey] = `[DRY-RUN: would upload to clients/${CLIENT_ID}/images/...]`;
  }
}

// ── Build config patch ─────────────────────────────────────────────────────
const configPatch = {
  brand: {
    name: "MARTELLIN",
    tagline: "Tattoo & Piercing Studio",
    ...(uploadedUrls["brand.logo"] && { logo: uploadedUrls["brand.logo"] }),
    ...(uploadedUrls["brand.logoDark"] && { logoDark: uploadedUrls["brand.logoDark"] }),
    ...(uploadedUrls["brand.ogImage"] && { ogImage: uploadedUrls["brand.ogImage"] }),
    faviconEmoji: "🎨",
  },
  theme: {
    accent: brandData.palette.rustCopper,       // #A45A3E
    accentLight: "#C8917A",                     // lightened rustCopper (~30%)
    surfaceDark: brandData.palette.richBlack,   // #0A0A0A
  },
  typography: {
    display: brandData.typography.displayHeadings,  // "Cinzel Decorative"
    body: brandData.typography.bodyUi,              // "Montserrat"
  },
};

console.log("\n   📋 Config patch to write:");
console.log(JSON.stringify(configPatch, null, 2).split("\n").map(l => "      " + l).join("\n"));

// ── Read current config ────────────────────────────────────────────────────
console.log(`\n   📖 Reading current config/${CLIENT_ID}...`);
const currentSnap = await db.collection("config").doc(CLIENT_ID).get();
if (currentSnap.exists) {
  const current = currentSnap.data();
  console.log(`      Current brand.name: ${current?.brand?.name || "(empty)"}`);
  console.log(`      Current theme.accent: ${current?.theme?.accent || "(empty)"}`);
  console.log(`      Current typography: ${JSON.stringify(current?.typography) || "(empty)"}`);
} else {
  console.log(`      ⚠ Document does not exist — will create it`);
}

// ── Write to Firestore ─────────────────────────────────────────────────────
if (APPLY) {
  console.log(`\n   💾 Writing to Firestore config/${CLIENT_ID}...`);
  await db.collection("config").doc(CLIENT_ID).set(configPatch, { merge: true });
  console.log(`      ✅ Done! Config merged successfully.`);
  console.log(`\n   🌐 Verify at: https://${CLIENT_ID.replace("demo-", "demo-").replace(/-([a-z0-9]+)$/, "-$1")}.arzac.studio`);
  console.log(`      (CDN cache ~10s, then refresh)`);
} else {
  console.log(`\n   ℹ️  DRY-RUN complete. Run with --apply to execute.`);
}

console.log("\n✅ Script finished.\n");
