/**
 * process-3d-single-slot.mjs
 *
 * Wrapper para procesar UN solo slot a la vez desde un manifest velvet-muse-v2.
 * Necesario porque el sandbox limita cada llamada de bash a ~45s y BRIA + upload
 * puede tomar varios segundos. Persistimos progreso a un .state.json y la
 * siguiente invocación continúa desde donde quedó.
 *
 * USO
 *   node scripts/process-3d-single-slot.mjs \
 *     --manifest scripts/3d-assets-manifest-velvet-muse-v2.json \
 *     --max-attempts 3 \
 *     --threshold-halo 3 \
 *     --threshold-bbox 0.95 \
 *     --state scripts/3d-assets-state-velvet-muse-v2.json
 *
 * Cada invocación:
 *   1. Lee el state. Si no existe, lo inicializa con todos los slots como pending.
 *   2. Toma el primer slot pending, lo procesa con BRIA + valida + comprime + sube.
 *   3. Marca como ok/failed y persiste el state.
 *   4. Imprime un resumen del progreso y sale.
 *
 * El state guarda el resultado final compatible con scripts/3d-assets-output.json.
 */
import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve, basename } from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

// ─── env bootstrap ──────────────────────────────────────────────────────────
const envPath = resolve(import.meta.dirname, "../.env.local");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = v;
  }
}

const STORAGE_BUCKET = "barbertemplate-madre.firebasestorage.app";
function initFirebase() {
  if (getApps().length) return;
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
    storageBucket: STORAGE_BUCKET,
  });
}

// ─── CLI parsing ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = { flags: new Set(), kv: {} };
  for (const a of argv) {
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq > 0) out.kv[a.slice(2, eq)] = a.slice(eq + 1);
      else {
        out._p = a.slice(2);
        out.flags.add(a.slice(2));
      }
    } else if (out._p) {
      out.kv[out._p] = a;
      out.flags.delete(out._p);
      out._p = undefined;
    }
  }
  return out;
}
const args = parseArgs(process.argv.slice(2));
const MAX_ATTEMPTS = Number(args.kv["max-attempts"] || 3);
const THRESHOLD_HALO = Number(args.kv["threshold-halo"] || 3);
const THRESHOLD_BBOX = Number(args.kv["threshold-bbox"] || 0.95);
const PARTICLES = args.kv["particles"] || "pearls";
const MANIFEST_PATH = resolve(process.cwd(), args.kv["manifest"]);
const STATE_PATH = resolve(process.cwd(), args.kv["state"]);

const BRIA_API_KEY = process.env.BRIA_API_KEY;
if (!BRIA_API_KEY) {
  console.error("BRIA_API_KEY missing");
  process.exit(1);
}

// ─── BRIA ───────────────────────────────────────────────────────────────────
async function briaRemoveBackground(pngBuffer) {
  const form = new FormData();
  form.append("file", new Blob([pngBuffer], { type: "image/png" }), "input.png");
  const res = await fetch(
    "https://engine.prod.bria-api.com/v1/background/remove",
    { method: "POST", headers: { api_token: BRIA_API_KEY }, body: form }
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`BRIA ${res.status}: ${t.slice(0, 200)}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.startsWith("image/")) return Buffer.from(await res.arrayBuffer());
  const json = JSON.parse(await res.text());
  const url = json.result_url || json.url || (Array.isArray(json.result) ? json.result[0] : null);
  if (!url) throw new Error("BRIA JSON sin result_url");
  const r2 = await fetch(url);
  if (!r2.ok) throw new Error(`fetch result_url ${r2.status}`);
  return Buffer.from(await r2.arrayBuffer());
}

// ─── Validación con thresholds ──────────────────────────────────────────────
async function validate(buffer) {
  const img = sharp(buffer, { failOn: "none" });
  const meta = await img.metadata();
  const { width, height, channels } = meta;
  if (!width || !height) return { ok: false, errors: ["no dims"], warnings: [], stats: {} };
  if (channels < 4) return { ok: false, errors: ["sin alpha"], warnings: [], stats: { width, height, channels } };

  const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const step = Math.max(1, Math.floor(Math.min(width, height) / 800));
  let opaque = 0, transparent = 0, semi = 0;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      if (a >= 250) opaque++;
      else if (a < 50) transparent++;
      else semi++;
      if (a > 30) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  const sampled = Math.ceil(width / step) * Math.ceil(height / step) || 1;

  let edgeSamples = 0, edgeWhite = 0;
  if (maxX > minX && maxY > minY) {
    const band = Math.max(4, Math.floor(Math.min(maxX - minX, maxY - minY) * 0.03));
    for (let y = Math.max(0, minY - band); y < Math.min(height, maxY + band); y += step) {
      for (let x = Math.max(0, minX - band); x < Math.min(width, maxX + band); x += step) {
        const inside = x >= minX + band && x <= maxX - band && y >= minY + band && y <= maxY - band;
        if (inside) continue;
        const idx = (y * width + x) * 4;
        const a = data[idx + 3];
        if (a <= 200) continue;
        edgeSamples++;
        if (data[idx] > 245 && data[idx + 1] > 245 && data[idx + 2] > 245) edgeWhite++;
      }
    }
  }

  const pctTransparent = (transparent / sampled) * 100;
  const pctOpaque = (opaque / sampled) * 100;
  const haloPct = edgeSamples > 0 ? (edgeWhite / edgeSamples) * 100 : 0;
  const bboxW = Math.max(0, maxX - minX);
  const bboxH = Math.max(0, maxY - minY);
  const bboxRatioW = width > 0 ? bboxW / width : 0;
  const bboxRatioH = height > 0 ? bboxH / height : 0;
  const longSide = Math.max(width, height);
  const errors = [], warnings = [];

  if (pctOpaque >= 99.5) errors.push(`BRIA no removió fondo: ${pctOpaque.toFixed(1)}% opacos`);
  if (pctTransparent < 1) errors.push(`Muy pocos transparentes: ${pctTransparent.toFixed(2)}%`);
  if (longSide < 1200) errors.push(`Lado mayor ${longSide}px < 1200px`);
  if (haloPct > THRESHOLD_HALO) errors.push(`Halo > ${THRESHOLD_HALO}%: ${haloPct.toFixed(1)}% (BRIA dejó cream en el contorno)`);
  if (bboxRatioW >= THRESHOLD_BBOX && bboxRatioH >= THRESHOLD_BBOX) {
    errors.push(`BRIA dejó cream pegado al sujeto: bbox cubre ${(bboxRatioW * 100).toFixed(1)}%×${(bboxRatioH * 100).toFixed(1)}%`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      width, height, channels,
      pctTransparent: +pctTransparent.toFixed(2),
      pctOpaque: +pctOpaque.toFixed(2),
      haloPct: +haloPct.toFixed(2),
      bboxRatio: { w: +bboxRatioW.toFixed(3), h: +bboxRatioH.toFixed(3) },
    },
  };
}

// ─── backgroundTone del raw pre-BRIA (5% borde, descarta blancos/negros puros) ─
async function detectBackgroundTone(originalPngBuffer) {
  const img = sharp(originalPngBuffer, { failOn: "none" });
  const meta = await img.metadata();
  const { width, height } = meta;
  if (!width || !height) return "#f7f0ea";
  const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const buckets = new Map();
  const bandW = Math.max(8, Math.floor(width * 0.05));
  const bandH = Math.max(8, Math.floor(height * 0.05));
  const step = Math.max(1, Math.floor(Math.min(width, height) / 400));
  function consume(x, y) {
    const idx = (y * width + x) * 4;
    if (data[idx + 3] < 200) return;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    if (r > 250 && g > 250 && b > 250) return; // highlights
    if (r < 12 && g < 12 && b < 12) return; // sombras hard
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const p = buckets.get(key);
    if (p) { p.count++; p.r += r; p.g += g; p.b += b; }
    else buckets.set(key, { count: 1, r, g, b });
  }
  for (let y = 0; y < bandH; y += step) for (let x = 0; x < width; x += step) consume(x, y);
  for (let y = height - bandH; y < height; y += step) for (let x = 0; x < width; x += step) consume(x, y);
  for (let y = bandH; y < height - bandH; y += step) {
    for (let x = 0; x < bandW; x += step) consume(x, y);
    for (let x = width - bandW; x < width; x += step) consume(x, y);
  }
  if (buckets.size === 0) return "#f7f0ea";
  let best = null;
  for (const b of buckets.values()) if (!best || b.count > best.count) best = b;
  const r = Math.round(best.r / best.count);
  const g = Math.round(best.g / best.count);
  const bl = Math.round(best.b / best.count);
  return "#" + [r, g, bl].map(v => v.toString(16).padStart(2, "0")).join("");
}

async function compressPng(buffer) {
  return await sharp(buffer, { failOn: "none" })
    .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
    .toBuffer();
}

async function uploadToStorage(buffer, storagePath) {
  initFirebase();
  const bucket = getStorage().bucket(STORAGE_BUCKET);
  const file = bucket.file(storagePath);
  const token = randomUUID();
  await file.save(buffer, {
    metadata: { contentType: "image/png", cacheControl: "public, max-age=31536000" },
  });
  await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
}

// ─── State ──────────────────────────────────────────────────────────────────
function loadState() {
  if (existsSync(STATE_PATH)) {
    return JSON.parse(readFileSync(STATE_PATH, "utf-8"));
  }
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
  const queue = [];
  for (const [clientId, slots] of Object.entries(manifest)) {
    for (const [slot, relPath] of Object.entries(slots)) {
      queue.push({
        clientId, slot,
        sourcePath: resolve(process.cwd(), relPath),
        status: "pending",
      });
    }
  }
  return { queue, results: {} };
}

function saveState(state) {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n", "utf-8");
}

// ─── Main: procesa UN slot ──────────────────────────────────────────────────
async function main() {
  const state = loadState();
  const next = state.queue.find(q => q.status === "pending");
  if (!next) {
    console.log("ALL DONE");
    const remaining = state.queue.filter(q => q.status !== "ok" && q.status !== "failed");
    console.log(`ok: ${state.queue.filter(q => q.status === "ok").length}, failed: ${state.queue.filter(q => q.status === "failed").length}, other: ${remaining.length}`);
    process.exit(0);
  }

  const { clientId, slot, sourcePath } = next;
  console.log(`▶ ${clientId}/${slot} (${basename(sourcePath)})`);
  const original = readFileSync(sourcePath);
  const originalBytes = original.length;

  let backgroundTone = "#f7f0ea";
  try { backgroundTone = await detectBackgroundTone(original); }
  catch (e) { console.warn(`tone fallback: ${e.message}`); }
  console.log(`  backgroundTone (raw): ${backgroundTone}`);

  let lastValidation = null;
  let processed = null;
  let attempt = 0;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    console.log(`  → BRIA attempt ${attempt}/${MAX_ATTEMPTS}…`);
    try {
      const t0 = Date.now();
      const briaOut = await briaRemoveBackground(original);
      console.log(`    BRIA ok (${Date.now() - t0}ms, ${(briaOut.length / 1024).toFixed(0)}KB)`);
      const v = await validate(briaOut);
      lastValidation = v;
      console.log(`    halo ${v.stats.haloPct}% bbox ${v.stats.bboxRatio?.w}×${v.stats.bboxRatio?.h} trans ${v.stats.pctTransparent}%`);
      if (v.ok) { processed = briaOut; break; }
      for (const e of v.errors) console.log(`    ✗ ${e}`);
    } catch (err) {
      console.log(`    ✗ BRIA err: ${err.message}`);
      lastValidation = { ok: false, errors: [`BRIA: ${err.message}`], warnings: [], stats: {} };
    }
  }

  if (!processed) {
    next.status = "failed";
    next.attempts = attempt;
    next.validation = lastValidation;
    next.backgroundTone = backgroundTone;
    next.originalBytes = originalBytes;
    state.results[clientId] = state.results[clientId] || {};
    state.results[clientId][slot] = {
      src: null,
      backgroundTone,
      particles: PARTICLES,
      shadowColor: "auto",
      _meta: {
        status: "failed",
        attempts: attempt,
        errors: lastValidation?.errors || [],
        warnings: lastValidation?.warnings || [],
      },
    };
    saveState(state);
    console.log(`  ✗ FAILED después de ${attempt} intentos`);
    process.exit(0);
  }

  let compressed = processed;
  try { compressed = await compressPng(processed); }
  catch (e) { console.warn(`compress falló: ${e.message}`); }
  const compressedBytes = compressed.length;

  const storagePath = `3d-assets/${clientId}/${slot}.png`;
  const t1 = Date.now();
  const publicUrl = await uploadToStorage(compressed, storagePath);
  console.log(`  ✓ upload ${Date.now() - t1}ms → ${publicUrl}`);

  next.status = "ok";
  next.attempts = attempt;
  next.validation = lastValidation;
  next.backgroundTone = backgroundTone;
  next.originalBytes = originalBytes;
  next.compressedBytes = compressedBytes;
  next.storagePath = storagePath;
  next.publicUrl = publicUrl;
  state.results[clientId] = state.results[clientId] || {};
  state.results[clientId][slot] = {
    src: publicUrl,
    backgroundTone,
    particles: PARTICLES,
    shadowColor: "auto",
    bboxRatio: lastValidation.stats.bboxRatio,
    haloPercent: lastValidation.stats.haloPct,
    _meta: {
      attempts: attempt,
      originalKB: +(originalBytes / 1024).toFixed(1),
      compressedKB: +(compressedBytes / 1024).toFixed(1),
      savedPct: +(((originalBytes - compressedBytes) / originalBytes) * 100).toFixed(1),
      validation: lastValidation.stats,
      warnings: lastValidation.warnings || [],
      storagePath,
    },
  };
  saveState(state);
  console.log(`  saved state.`);
}

main().catch(err => { console.error("FATAL", err); process.exit(1); });
