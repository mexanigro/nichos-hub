/**
 * Uploads the 3D Impact asset library (Velvet Muse / Aurea / Onyx + shared)
 * to Firebase Storage under organized, predictable paths so the Nichos-hub
 * editor can pick which asset goes to which slot per client.
 *
 * Sources live in the Claude local-agent uploads folder with random UUIDs;
 * this script maps each known UUID → human-readable storage path, e.g.
 *
 *   <uploads>/5d57153a-193863.png
 *     → gs://barbertemplate-madre.firebasestorage.app/3d-assets/velvet-muse/hero-primary.png
 *
 * Idempotent: skips entries whose target storage object already matches the
 * local file's md5 hash. Pass --force to re-upload regardless.
 *
 * Outputs a manifest to outputs/3d-assets-manifest.{json,md} after running.
 *
 * Usage:
 *   node scripts/upload-3d-assets.mjs                            # dry-run, default uploads dir
 *   node scripts/upload-3d-assets.mjs --apply                    # actually upload
 *   node scripts/upload-3d-assets.mjs --apply --force            # re-upload everything
 *   node scripts/upload-3d-assets.mjs --uploads-dir=<abs-path>   # override source dir
 */

import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { createHash, randomUUID } from "crypto";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// ── env bootstrap (same pattern as fix-client-configs.mjs) ──────────────────
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

// Force init so Storage client picks up creds
const databaseId = process.env.FIREBASE_DATABASE_ID;
const db = databaseId ? getFirestore(databaseId) : getFirestore();
try { db.settings({ preferRest: true }); } catch {}

const STORAGE_BUCKET = "barbertemplate-madre.firebasestorage.app";
const bucket = getStorage().bucket(STORAGE_BUCKET);

// ── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const FORCE = args.includes("--force");
const UPLOADS_DIR_ARG = args.find((a) => a.startsWith("--uploads-dir="));
const DEFAULT_UPLOADS_DIR =
  "C:\\Users\\liama\\AppData\\Roaming\\Claude\\local-agent-mode-sessions\\f03b34ae-3cec-4d2b-9c99-ec5c15172781\\87854f97-98f5-46f8-99cc-e29986ae0409\\agent\\local_ditto_87854f97-98f5-46f8-99cc-e29986ae0409\\uploads";
const UPLOADS_DIR = UPLOADS_DIR_ARG ? UPLOADS_DIR_ARG.slice("--uploads-dir=".length) : DEFAULT_UPLOADS_DIR;

// ── Asset mapping ───────────────────────────────────────────────────────────
// sourceFile === null  ⇒ slot exists in the spec but the asset is still
//                        pending generation — reported as "pending".
const MAPPING = [
  // ── Velvet Muse (hairstyling) ─────────────────────────────────────────────
  { sourceFile: "5d57153a-193863.png", category: "velvet-muse", slotName: "hero-primary",         description: "Hero compuesto (pelo + tijera + espejo + bottle + cintas + perlas)" },
  { sourceFile: "f1c0c83d-193864.png", category: "velvet-muse", slotName: "hero-secondary",       description: "Tijera + peine + pelo + perlas" },
  { sourceFile: "7b340e85-193862.png", category: "velvet-muse", slotName: "accent-bottle",        description: "Bottle + perlas + cinta + pedestal" },
  { sourceFile: "b74250fb-193861.png", category: "velvet-muse", slotName: "ambient-pearl",        description: "Perla individual (ambient)" },
  { sourceFile: "8b6ae2ee-193885.png", category: "velvet-muse", slotName: "deco-ribbon",          description: "Silk ribbon swoosh" },
  { sourceFile: "0afaa0fc-193884.png", category: "velvet-muse", slotName: "deco-silk-wave",       description: "Silk wave background (paleta velvet)" },
  { sourceFile: "4c2319f3-193886.png", category: "velvet-muse", slotName: "deco-pearls-cluster",  description: "Scattered pearls cluster" },
  { sourceFile: "ec462afc-193883.png", category: "velvet-muse", slotName: "deco-marble-pedestal", description: "Marble pedestal" },

  // ── Aurea (estética) ──────────────────────────────────────────────────────
  { sourceFile: null,                  category: "aurea", slotName: "hero-primary",         description: "Hero primary — pending generate" },
  { sourceFile: null,                  category: "aurea", slotName: "hero-secondary",       description: "Hero secondary — pending generate" },
  { sourceFile: "1aaf7b74-193894.png", category: "aurea", slotName: "accent-device",        description: "Single device close-up (Aurea accent)" },
  { sourceFile: "5ccb7466-193892.png", category: "aurea", slotName: "deco-silk-wave-beige", description: "Silk wave beige (Aurea bg)" },
  { sourceFile: "be1c649e-193893.png", category: "aurea", slotName: "ambient-droplet",      description: "Floating skincare droplet" },

  // ── Onyx (tattoo) ─────────────────────────────────────────────────────────
  { sourceFile: null,                  category: "onyx", slotName: "hero-primary",          description: "Hero primary — pending generate" },
  { sourceFile: null,                  category: "onyx", slotName: "hero-secondary",        description: "Hero secondary — pending generate" },
  { sourceFile: "b1ef6d96-193891.png", category: "onyx", slotName: "accent-bottle",         description: "Ink bottle (Onyx accent)" },
  { sourceFile: "695c9c08-193899.png", category: "onyx", slotName: "bg-stone-texture",      description: "Dark stone texture (Onyx bg)" },
  { sourceFile: "93c6e153-193908.png", category: "onyx", slotName: "ambient-ink-droplets",  description: "Floating ink droplets" },

  // ── Shared (cross-client) ─────────────────────────────────────────────────
  { sourceFile: "5d67a770-193887.png", category: "shared", slotName: "ambient-smoke",       description: "Smoke wisps" },
  { sourceFile: "4f739d71-193890.png", category: "shared", slotName: "ambient-light-rays",  description: "Light rays / sun flare" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
const TARGET_PREFIX = "3d-assets";

function targetPath(entry) {
  return `${TARGET_PREFIX}/${entry.category}/${entry.slotName}.png`;
}

function localMd5Base64(filePath) {
  const buf = readFileSync(filePath);
  return createHash("md5").update(buf).digest("base64");
}

async function getRemoteMeta(storagePath) {
  const file = bucket.file(storagePath);
  const [exists] = await file.exists();
  if (!exists) return { exists: false };
  const [meta] = await file.getMetadata();
  return {
    exists: true,
    size: meta.size ? Number(meta.size) : undefined,
    md5Hash: meta.md5Hash,
    contentType: meta.contentType,
    tokens: meta.metadata?.firebaseStorageDownloadTokens,
    updated: meta.updated,
  };
}

function publicUrlFor(storagePath, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
}

// ── Plan + execute ──────────────────────────────────────────────────────────
const results = [];

console.log(`\n=== upload-3d-assets ===`);
console.log(`mode:        ${APPLY ? (FORCE ? "APPLY (--force)" : "APPLY") : "DRY-RUN"}`);
console.log(`bucket:      gs://${STORAGE_BUCKET}`);
console.log(`uploads dir: ${UPLOADS_DIR}`);
console.log(`mapped:      ${MAPPING.length} slots\n`);

for (const entry of MAPPING) {
  const storagePath = targetPath(entry);

  // Slot pending generation (no source defined)
  if (!entry.sourceFile) {
    console.log(`  ⏳ pending  ${storagePath}  — ${entry.description}`);
    results.push({
      category: entry.category,
      slotName: entry.slotName,
      description: entry.description,
      status: "pending",
      sourcePath: null,
      storagePath,
      publicUrl: null,
      sizeBytes: null,
      uploadedAt: null,
    });
    continue;
  }

  const sourcePath = resolve(UPLOADS_DIR, entry.sourceFile);
  if (!existsSync(sourcePath)) {
    console.log(`  ⚠️  missing  ${storagePath}  ← ${entry.sourceFile} not in uploads/`);
    results.push({
      category: entry.category,
      slotName: entry.slotName,
      description: entry.description,
      status: "missing-source",
      sourcePath,
      storagePath,
      publicUrl: null,
      sizeBytes: null,
      uploadedAt: null,
    });
    continue;
  }

  const localSize = statSync(sourcePath).size;
  const localMd5 = localMd5Base64(sourcePath);

  let remote;
  try {
    remote = await getRemoteMeta(storagePath);
  } catch (err) {
    console.log(`  ❌ error    ${storagePath}  — getMetadata failed: ${err.message}`);
    results.push({
      category: entry.category,
      slotName: entry.slotName,
      description: entry.description,
      status: "error",
      sourcePath,
      storagePath,
      publicUrl: null,
      sizeBytes: localSize,
      uploadedAt: null,
      error: err.message,
    });
    continue;
  }

  // Idempotency: same md5 → skip (unless --force)
  if (remote.exists && remote.md5Hash === localMd5 && !FORCE) {
    const existingToken = remote.tokens ? remote.tokens.split(",")[0] : null;
    const url = existingToken ? publicUrlFor(storagePath, existingToken) : null;
    console.log(`  ✓ skip      ${storagePath}  (md5 match)`);
    results.push({
      category: entry.category,
      slotName: entry.slotName,
      description: entry.description,
      status: "skipped-match",
      sourcePath,
      storagePath,
      publicUrl: url,
      sizeBytes: remote.size ?? localSize,
      uploadedAt: remote.updated ?? null,
    });
    continue;
  }

  const willOverwrite = remote.exists;
  const action = !APPLY
    ? (willOverwrite ? (FORCE ? "would re-upload (--force)" : "would re-upload (md5 differs)") : "would upload")
    : (willOverwrite ? (FORCE ? "re-upload (--force)" : "re-upload (md5 differs)") : "upload");

  console.log(`  → ${action}  ${storagePath}  (${(localSize / 1024).toFixed(1)} KB)`);

  if (!APPLY) {
    results.push({
      category: entry.category,
      slotName: entry.slotName,
      description: entry.description,
      status: willOverwrite ? "would-reupload" : "would-upload",
      sourcePath,
      storagePath,
      publicUrl: null,
      sizeBytes: localSize,
      uploadedAt: null,
    });
    continue;
  }

  // Real upload
  try {
    const buf = readFileSync(sourcePath);
    const file = bucket.file(storagePath);
    const token = remote.tokens && !FORCE ? remote.tokens.split(",")[0] : randomUUID();

    await file.save(buf, {
      metadata: {
        contentType: "image/png",
        cacheControl: "public, max-age=31536000",
      },
    });
    await file.setMetadata({
      metadata: { firebaseStorageDownloadTokens: token },
    });

    const url = publicUrlFor(storagePath, token);
    console.log(`    ✓ uploaded — ${url}`);

    results.push({
      category: entry.category,
      slotName: entry.slotName,
      description: entry.description,
      status: willOverwrite ? "reuploaded" : "uploaded",
      sourcePath,
      storagePath,
      publicUrl: url,
      sizeBytes: localSize,
      uploadedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.log(`    ❌ error: ${err.message}`);
    results.push({
      category: entry.category,
      slotName: entry.slotName,
      description: entry.description,
      status: "error",
      sourcePath,
      storagePath,
      publicUrl: null,
      sizeBytes: localSize,
      uploadedAt: null,
      error: err.message,
    });
  }
}

// ── Manifest output ─────────────────────────────────────────────────────────
const outputsDir = resolve(import.meta.dirname, "../outputs");
if (!existsSync(outputsDir)) mkdirSync(outputsDir, { recursive: true });

const manifest = {
  generatedAt: new Date().toISOString(),
  mode: APPLY ? (FORCE ? "apply-force" : "apply") : "dry-run",
  bucket: STORAGE_BUCKET,
  uploadsDir: UPLOADS_DIR,
  entries: results,
};

const jsonPath = resolve(outputsDir, "3d-assets-manifest.json");
writeFileSync(jsonPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");

const mdLines = [];
mdLines.push(`# 3D assets manifest`);
mdLines.push(``);
mdLines.push(`- Generated: ${manifest.generatedAt}`);
mdLines.push(`- Mode: \`${manifest.mode}\``);
mdLines.push(`- Bucket: \`gs://${STORAGE_BUCKET}\``);
mdLines.push(``);

const byCategory = results.reduce((acc, e) => {
  (acc[e.category] ||= []).push(e);
  return acc;
}, {});

for (const [category, entries] of Object.entries(byCategory)) {
  mdLines.push(`## ${category}`);
  mdLines.push(``);
  mdLines.push(`| Slot | Status | Size | Public URL |`);
  mdLines.push(`|------|--------|------|------------|`);
  for (const e of entries) {
    const size = e.sizeBytes ? `${(e.sizeBytes / 1024).toFixed(1)} KB` : "—";
    const url = e.publicUrl ? `[link](${e.publicUrl})` : "—";
    mdLines.push(`| \`${e.slotName}\` | ${e.status} | ${size} | ${url} |`);
  }
  mdLines.push(``);
}

mdLines.push(`## Status legend`);
mdLines.push(``);
mdLines.push(`- **uploaded / reuploaded** — file was written to Storage this run.`);
mdLines.push(`- **skipped-match** — already in Storage with matching md5; no write.`);
mdLines.push(`- **would-upload / would-reupload** — dry-run plan; rerun with \`--apply\`.`);
mdLines.push(`- **pending** — slot reserved in the spec but the source asset has not been generated yet.`);
mdLines.push(`- **missing-source** — mapping points at a file that is not in \`uploads/\`.`);
mdLines.push(`- **error** — see the JSON manifest for details.`);
mdLines.push(``);

const mdPath = resolve(outputsDir, "3d-assets-manifest.md");
writeFileSync(mdPath, mdLines.join("\n"), "utf-8");

// ── Summary ─────────────────────────────────────────────────────────────────
const counts = results.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] ?? 0) + 1;
  return acc;
}, {});

console.log(`\n=== summary ===`);
for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(20)} ${v}`);
console.log(`\nmanifest: ${jsonPath}`);
console.log(`          ${mdPath}\n`);
