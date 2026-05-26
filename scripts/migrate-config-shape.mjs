/**
 * One-shot data migration: re-shape an existing config/{clientId} document
 * using the SAME normalization rules as the hub API
 * (src/app/api/config/[clientId]/route.ts → normalizeConfigShape).
 *
 * Necessary because pre-existing data (patch-images.mjs from 2026-05-25 and
 * an older brand-package-import bug) wrote `gallery: Array<{src, alt}>`
 * which the master-template's <Gallery /> cannot render (it expects string[]).
 *
 * After the hub fix (API normalizes on GET/PUT), every future write is clean.
 * This script makes existing docs match — equivalent to the owner opening the
 * UI and pressing "Guardar", but doable without OAuth.
 *
 * Usage:
 *   node scripts/migrate-config-shape.mjs <clientId>                # dry-run
 *   node scripts/migrate-config-shape.mjs <clientId> --apply        # write
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// ── env bootstrap ──
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

// ── normalization (mirror of API route's normalizeConfigShape) ──

function normalizeImageArray(value) {
  if (!Array.isArray(value)) return undefined;
  const out = [];
  for (const item of value) {
    if (typeof item === "string") {
      if (item) out.push(item);
    } else if (item && typeof item === "object") {
      const candidate = item.src ?? item.url ?? item.href;
      if (typeof candidate === "string" && candidate) out.push(candidate);
    }
  }
  return out;
}

function normalizeConfigShape(data) {
  const out = { ...data };

  // Drop legacy `brand.favicon` URL — template only reads `brand.faviconEmoji`.
  // Use FieldValue.delete() so the merge:true write actually removes the field.
  if (out.brand && typeof out.brand === "object" && !Array.isArray(out.brand)) {
    const brand = { ...out.brand };
    if ("favicon" in brand) brand.favicon = FieldValue.delete();
    out.brand = brand;
  }

  // Same for accidental top-level `_unused` payload from Brand Package legacy writes.
  if ("_unused" in out) out._unused = FieldValue.delete();

  const flatGallery = normalizeImageArray(out.gallery);
  if (flatGallery !== undefined) out.gallery = flatGallery;

  if (out.sections && typeof out.sections === "object" && !Array.isArray(out.sections)) {
    const sections = { ...out.sections };
    if (sections.services && typeof sections.services === "object") {
      const services = { ...sections.services };
      const flat = normalizeImageArray(services.images);
      if (flat !== undefined) services.images = flat;
      sections.services = services;
    }
    if (sections.instagram && typeof sections.instagram === "object") {
      const instagram = { ...sections.instagram };
      const flat = normalizeImageArray(instagram.images);
      if (flat !== undefined) instagram.images = flat;
      sections.instagram = instagram;
    }
    out.sections = sections;
  }

  if (Array.isArray(out.staff)) {
    out.staff = out.staff.map((m) => {
      if (!m || typeof m !== "object") return m;
      const next = { ...m };
      const flat = normalizeImageArray(next.portfolio);
      if (flat !== undefined) next.portfolio = flat;
      return next;
    });
  }

  if (out.owner && typeof out.owner === "object") {
    const owner = { ...out.owner };
    const flat = normalizeImageArray(owner.portfolio);
    if (flat !== undefined) owner.portfolio = flat;
    out.owner = owner;
  }

  return out;
}

function diffFields(before, after, prefix = "") {
  const changed = [];
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  for (const k of keys) {
    const path = prefix ? `${prefix}.${k}` : k;
    const a = before?.[k];
    const b = after?.[k];
    const sa = JSON.stringify(a);
    const sb = JSON.stringify(b);
    if (sa !== sb) {
      if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
        changed.push(...diffFields(a, b, path));
      } else {
        changed.push({ path, before: a, after: b });
      }
    }
  }
  return changed;
}

const clientId = process.argv[2];
const apply = process.argv.includes("--apply");
if (!clientId) {
  console.error("Usage: node scripts/migrate-config-shape.mjs <clientId> [--apply]");
  process.exit(1);
}

async function main() {
  const ref = db.collection("config").doc(clientId);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`config/${clientId} does not exist`);
    process.exit(2);
  }
  const before = snap.data();
  const after = normalizeConfigShape(before);
  const diffs = diffFields(before, after);

  if (diffs.length === 0) {
    console.log(`config/${clientId} — already clean shape, nothing to migrate.`);
    return;
  }

  console.log(`config/${clientId} — ${diffs.length} field(s) need reshaping:\n`);
  for (const d of diffs) {
    const beforeSummary = Array.isArray(d.before)
      ? `[${d.before.length} items, first = ${JSON.stringify(d.before[0])?.slice(0, 80)}]`
      : JSON.stringify(d.before)?.slice(0, 120);
    const afterSummary = Array.isArray(d.after)
      ? `[${d.after.length} items, first = ${JSON.stringify(d.after[0])?.slice(0, 80)}]`
      : JSON.stringify(d.after)?.slice(0, 120);
    console.log(`  ${d.path}`);
    console.log(`    before: ${beforeSummary}`);
    console.log(`    after:  ${afterSummary}`);
  }

  if (!apply) {
    console.log("\nDry-run only. Re-run with --apply to write to Firestore.");
    return;
  }

  // Use the same write semantics as the API route: full document overwrite of
  // top-level keys that changed. We use set with merge:true so we only touch
  // the keys we re-shaped, leaving everything else intact.
  const writePayload = {};
  for (const d of diffs) {
    const root = d.path.split(".")[0];
    writePayload[root] = after[root];
  }

  await ref.set(writePayload, { merge: true });
  console.log("\n✓ Wrote normalized shape to Firestore.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
