/**
 * process-3d-assets.mjs
 *
 * Pipeline para procesar imágenes 3D generadas por ChatGPT y dejarlas listas
 * para los sitios multi-tenant:
 *
 *   PNG (cream/champagne bg) → BRIA bg removal → validación de calidad →
 *   compresión sharp → backgroundTone autodetectado → Firebase Storage →
 *   URL pública.
 *
 * USO
 *   node scripts/process-3d-assets.mjs \
 *     --client demo-velvet-muse \
 *     --input ./uploads/3d-raw/velvet-muse/ \
 *     --slots hero-primary,hero-secondary,hero-accent
 *
 *   # batch desde manifest
 *   node scripts/process-3d-assets.mjs --manifest ./scripts/3d-assets-manifest.json
 *
 *   # flags útiles
 *   --dry-run     no sube ni escribe output, solo procesa y valida
 *   --particles=pearls   default "pearls"
 *   --max-attempts=2     reintentos BRIA por imagen (default 2)
 *
 * SALIDA
 *   scripts/3d-assets-output.json
 *   {
 *     "<clientId>": {
 *       "<slot>": {
 *         "src": "https://firebasestorage.googleapis.com/...",
 *         "backgroundTone": "#f7f0ea",
 *         "particles": "pearls",
 *         "shadowColor": "auto",
 *         "_meta": { ...validación, tamaños, intentos... }
 *       }
 *     }
 *   }
 */

import {
  readFileSync,
  existsSync,
  statSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
} from "fs";
import { resolve, dirname, basename, join } from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

// ─── env bootstrap (mismo patrón que upload-3d-assets.mjs) ───────────────────
const envPath = resolve(import.meta.dirname, "../.env.local");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

// ─── Firebase init (idempotente) ────────────────────────────────────────────
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
      if (eq > 0) {
        out.kv[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        // soportar también `--key value` después
        out._pendingKey = a.slice(2);
        out.flags.add(a.slice(2));
      }
    } else if (out._pendingKey) {
      out.kv[out._pendingKey] = a;
      out.flags.delete(out._pendingKey);
      out._pendingKey = undefined;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const DRY_RUN = args.flags.has("dry-run");
const PARTICLES = args.kv["particles"] || "pearls";
const MAX_ATTEMPTS = Number(args.kv["max-attempts"] || 2);
// --threshold-halo N => halo% por encima de N es ERROR (dispara reintento BRIA).
// Default 5 (mismo comportamiento que warning anterior, ahora como error).
const THRESHOLD_HALO = Number(args.kv["threshold-halo"] || 5);
// --threshold-bbox N => si bbox del alpha cubre >= N del rectángulo total
// (en width Y height a la vez), BRIA dejó cream pegado al sujeto. Default 0.95.
const THRESHOLD_BBOX = Number(args.kv["threshold-bbox"] || 0.95);

const BRIA_API_KEY = process.env.BRIA_API_KEY;
if (!BRIA_API_KEY) {
  console.error("❌ BRIA_API_KEY no está en .env.local");
  process.exit(1);
}

const BRIA_ENDPOINT =
  process.env.BRIA_ENDPOINT ||
  "https://engine.prod.bria-api.com/v1/background/remove";

// ─── Construir el plan (qué imágenes procesar) ──────────────────────────────
/**
 * Plan shape: { [clientId]: { [slot]: absolutePathToSourcePng } }
 */
function buildPlan() {
  if (args.kv["manifest"]) {
    const manifestPath = resolve(process.cwd(), args.kv["manifest"]);
    if (!existsSync(manifestPath)) {
      console.error(`❌ manifest no existe: ${manifestPath}`);
      process.exit(1);
    }
    const raw = JSON.parse(readFileSync(manifestPath, "utf-8"));
    const plan = {};
    for (const [clientId, slots] of Object.entries(raw)) {
      plan[clientId] = {};
      for (const [slot, relPath] of Object.entries(slots)) {
        plan[clientId][slot] = resolve(process.cwd(), relPath);
      }
    }
    return plan;
  }

  // Modo single-client
  const clientId = args.kv["client"];
  const inputDir = args.kv["input"];
  if (!clientId || !inputDir) {
    console.error(
      "❌ falta --client y --input (o usá --manifest <ruta.json>)"
    );
    process.exit(1);
  }
  const inputAbs = resolve(process.cwd(), inputDir);
  if (!existsSync(inputAbs)) {
    console.error(`❌ input dir no existe: ${inputAbs}`);
    process.exit(1);
  }

  let slotList;
  if (args.kv["slots"]) {
    slotList = args.kv["slots"].split(",").map((s) => s.trim()).filter(Boolean);
  } else {
    // Auto-detect: todos los .png del dir, sin extensión = slot
    slotList = readdirSync(inputAbs)
      .filter((f) => f.toLowerCase().endsWith(".png"))
      .map((f) => f.replace(/\.png$/i, ""));
  }

  const slots = {};
  for (const slot of slotList) {
    const file = join(inputAbs, `${slot}.png`);
    if (!existsSync(file)) {
      console.warn(`  ⚠️  slot "${slot}" no encontrado en ${inputAbs}`);
      continue;
    }
    slots[slot] = file;
  }
  return { [clientId]: slots };
}

// ─── BRIA: background removal ───────────────────────────────────────────────
async function briaRemoveBackground(pngBuffer) {
  // Bria acepta multipart/form-data con campo "file"
  const form = new FormData();
  const blob = new Blob([pngBuffer], { type: "image/png" });
  form.append("file", blob, "input.png");

  const res = await fetch(BRIA_ENDPOINT, {
    method: "POST",
    headers: {
      api_token: BRIA_API_KEY,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `BRIA ${res.status} ${res.statusText}: ${text.slice(0, 300)}`
    );
  }

  const ct = res.headers.get("content-type") || "";

  if (ct.startsWith("image/")) {
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  }

  // BRIA puede devolver { result_url: "..." } en JSON
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(
      `BRIA respuesta inesperada (no es imagen ni JSON): ${text.slice(0, 200)}`
    );
  }
  const url =
    json.result_url ||
    json.url ||
    (Array.isArray(json.result) ? json.result[0] : undefined);
  if (!url) {
    throw new Error(`BRIA JSON sin result_url: ${JSON.stringify(json).slice(0, 200)}`);
  }
  const imgRes = await fetch(url);
  if (!imgRes.ok) {
    throw new Error(`BRIA result_url falló: ${imgRes.status}`);
  }
  const ab = await imgRes.arrayBuffer();
  return Buffer.from(ab);
}

// ─── Validación de calidad del PNG con alpha ────────────────────────────────
/**
 * Devuelve { ok, warnings, errors, stats }
 *
 *  - canal alpha real (no todo 255)
 *  - existen píxeles transparentes (alpha < 50)
 *  - halo blanco residual (% de blancos puros con alpha alto en borde de sujeto)
 *  - dimensiones (lado mayor >= 1200)
 *  - sujeto centrado (offset del bbox vs centro)
 */
async function validateProcessedPng(buffer) {
  const img = sharp(buffer, { failOn: "none" });
  const meta = await img.metadata();
  const { width, height, channels } = meta;

  if (!width || !height) {
    return {
      ok: false,
      errors: ["sharp no pudo leer dimensiones"],
      warnings: [],
      stats: {},
    };
  }

  if (channels < 4) {
    return {
      ok: false,
      errors: ["PNG no tiene canal alpha (channels < 4)"],
      warnings: [],
      stats: { width, height, channels },
    };
  }

  // Raw pixels (RGBA)
  const { data } = await img
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const totalPx = width * height;
  let opaque = 0;
  let transparent = 0;
  let semi = 0;

  let minX = width,
    minY = height,
    maxX = -1,
    maxY = -1;

  // Para halo: contar píxeles "casi-borde" del sujeto que son blancos puros con alpha alto
  let edgeSamples = 0;
  let edgeWhite = 0;

  // Sampling step para halo (downsample 2x para velocidad sin perder señal)
  const step = Math.max(1, Math.floor(Math.min(width, height) / 800));

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (a >= 250) opaque++;
      else if (a < 50) transparent++;
      else semi++;

      // bbox del sujeto: cualquier pixel con alpha > 30
      if (a > 30) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  const sampled =
    Math.ceil(width / step) * Math.ceil(height / step) || totalPx;

  // Halo detect: scan a thin band along the bbox border looking for white-ish
  // pixels with high alpha (típica firma del halo cream que BRIA no removió).
  if (maxX > minX && maxY > minY) {
    const band = Math.max(4, Math.floor(Math.min(maxX - minX, maxY - minY) * 0.03));
    for (let y = Math.max(0, minY - band); y < Math.min(height, maxY + band); y += step) {
      for (let x = Math.max(0, minX - band); x < Math.min(width, maxX + band); x += step) {
        const insideBbox =
          x >= minX + band && x <= maxX - band && y >= minY + band && y <= maxY - band;
        if (insideBbox) continue; // queremos sólo la franja del borde
        const idx = (y * width + x) * 4;
        const a = data[idx + 3];
        if (a <= 200) continue;
        edgeSamples++;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        if (r > 245 && g > 245 && b > 245) edgeWhite++;
      }
    }
  }

  const pctTransparent = (transparent / sampled) * 100;
  const pctOpaque = (opaque / sampled) * 100;
  const haloPct = edgeSamples > 0 ? (edgeWhite / edgeSamples) * 100 : 0;

  // Centrado del sujeto: offset del centro del bbox vs centro de la imagen
  const bboxCx = (minX + maxX) / 2;
  const bboxCy = (minY + maxY) / 2;
  const offsetX = Math.abs(bboxCx - width / 2) / width;
  const offsetY = Math.abs(bboxCy - height / 2) / height;

  // Ratio bbox vs rectángulo de la imagen.
  // Si BRIA dejó el cream pegado al sujeto, el bbox del alpha cubre todo
  // el rectángulo y este ratio sale ≈ 1.0 — la silueta se perdió.
  const bboxW = Math.max(0, maxX - minX);
  const bboxH = Math.max(0, maxY - minY);
  const bboxRatioW = width > 0 ? bboxW / width : 0;
  const bboxRatioH = height > 0 ? bboxH / height : 0;
  const bboxRatio = Math.max(bboxRatioW, bboxRatioH);

  const longSide = Math.max(width, height);

  const errors = [];
  const warnings = [];

  if (pctOpaque >= 99.5) {
    errors.push(
      `BRIA no removió fondo: ${pctOpaque.toFixed(1)}% de píxeles son opacos`
    );
  }
  if (pctTransparent < 1) {
    errors.push(
      `Muy pocos píxeles transparentes (${pctTransparent.toFixed(2)}%) — BRIA probablemente falló`
    );
  }
  if (longSide < 1200) {
    errors.push(`Lado mayor ${longSide}px < 1200px (imagen muy chica)`);
  }
  // Halo: AHORA es error (no warning) — el owner quiere que dispare reintento.
  if (haloPct > THRESHOLD_HALO) {
    errors.push(
      `Halo > ${THRESHOLD_HALO}%: ${haloPct.toFixed(1)}% de píxeles borde son blanco-puro con alpha alto (BRIA dejó cream pegado al contorno)`
    );
  }
  // Bbox cubre todo el rectángulo => BRIA dejó el cream como parte del sujeto
  // y el alpha real es el del rectángulo, no el de la silueta. La sombra
  // CSS caería sobre el cuadro, exactamente lo que queremos evitar.
  if (bboxRatioW >= THRESHOLD_BBOX && bboxRatioH >= THRESHOLD_BBOX) {
    errors.push(
      `BRIA dejó cream pegado al sujeto: bbox cubre ${(bboxRatioW * 100).toFixed(
        1
      )}%×${(bboxRatioH * 100).toFixed(1)}% del rectángulo (>= ${(
        THRESHOLD_BBOX * 100
      ).toFixed(0)}% en ambos ejes)`
    );
  }
  if (offsetX > 0.18 || offsetY > 0.18) {
    warnings.push(
      `Sujeto descentrado: offset (${(offsetX * 100).toFixed(0)}%, ${(offsetY * 100).toFixed(0)}%)`
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      width,
      height,
      channels,
      pctTransparent: Number(pctTransparent.toFixed(2)),
      pctOpaque: Number(pctOpaque.toFixed(2)),
      haloPct: Number(haloPct.toFixed(2)),
      bbox: { minX, minY, maxX, maxY },
      bboxRatio: {
        w: Number(bboxRatioW.toFixed(3)),
        h: Number(bboxRatioH.toFixed(3)),
        max: Number(bboxRatio.toFixed(3)),
      },
      offset: {
        x: Number(offsetX.toFixed(3)),
        y: Number(offsetY.toFixed(3)),
      },
    },
  };
}

// ─── backgroundTone: muestrear los píxeles dominantes en franja de borde ─────
// Se calcula sobre el RAW pre-BRIA. Toma el 5% más externo, descarta blancos
// quasi-puros (>250 en R,G,B — suelen ser highlights/specular del objeto que
// asoma al borde, no fondo) y devuelve el color DOMINANTE (cluster modal), no
// el promedio — para no diluir el cream warm con blancos near-puros.
async function detectBackgroundTone(originalPngBuffer) {
  const img = sharp(originalPngBuffer, { failOn: "none" });
  const meta = await img.metadata();
  const { width, height } = meta;
  if (!width || !height) return "#f7f0ea";

  const { data } = await img
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Bucketize en cubos de 16 (más tolerante a ruido JPEG/PNG dither)
  const buckets = new Map();
  const bandW = Math.max(8, Math.floor(width * 0.05)); // 5% del owner
  const bandH = Math.max(8, Math.floor(height * 0.05));
  const step = Math.max(1, Math.floor(Math.min(width, height) / 400));

  function consume(x, y) {
    const idx = (y * width + x) * 4;
    const a = data[idx + 3];
    if (a < 200) return; // ignorar transparente
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    // Descartar blanco quasi-puro: highlights/specular que asoman al borde
    // del objeto, no fondo real. El cream cálido típico es #f7f0ea (R<250).
    if (r > 250 && g > 250 && b > 250) return;
    // Descartar negro quasi-puro idem (sombras hard del objeto)
    if (r < 12 && g < 12 && b < 12) return;
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const prev = buckets.get(key);
    if (prev) {
      prev.count++;
      prev.r += r;
      prev.g += g;
      prev.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  // Top + bottom bands
  for (let y = 0; y < bandH; y += step)
    for (let x = 0; x < width; x += step) consume(x, y);
  for (let y = height - bandH; y < height; y += step)
    for (let x = 0; x < width; x += step) consume(x, y);
  // Left + right bands
  for (let y = bandH; y < height - bandH; y += step) {
    for (let x = 0; x < bandW; x += step) consume(x, y);
    for (let x = width - bandW; x < width; x += step) consume(x, y);
  }

  if (buckets.size === 0) return "#f7f0ea";

  let best = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) best = bucket;
  }
  const r = Math.round(best.r / best.count);
  const g = Math.round(best.g / best.count);
  const b = Math.round(best.b / best.count);
  const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  return hex;
}

// ─── Compresión sharp ───────────────────────────────────────────────────────
async function compressPng(buffer) {
  return await sharp(buffer, { failOn: "none" })
    .png({
      compressionLevel: 9,
      palette: true,
      quality: 90,
      effort: 10,
    })
    .toBuffer();
}

// ─── Upload a Firebase Storage ──────────────────────────────────────────────
function publicUrlFor(bucketName, storagePath, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    storagePath
  )}?alt=media&token=${token}`;
}

async function uploadToStorage(buffer, storagePath) {
  initFirebase();
  const bucket = getStorage().bucket(STORAGE_BUCKET);
  const file = bucket.file(storagePath);
  const token = randomUUID();
  await file.save(buffer, {
    metadata: {
      contentType: "image/png",
      cacheControl: "public, max-age=31536000",
    },
  });
  await file.setMetadata({
    metadata: { firebaseStorageDownloadTokens: token },
  });
  return publicUrlFor(STORAGE_BUCKET, storagePath, token);
}

// ─── Procesar una sola imagen, con reintentos BRIA ──────────────────────────
async function processOne({ clientId, slot, sourcePath }) {
  const original = readFileSync(sourcePath);
  const originalBytes = original.length;

  // backgroundTone se calcula sobre el ORIGINAL (pre-BRIA)
  let backgroundTone = "#f7f0ea";
  try {
    backgroundTone = await detectBackgroundTone(original);
  } catch (err) {
    console.warn(`    ⚠️  backgroundTone falló: ${err.message}`);
  }

  let lastValidation = null;
  let processed = null;
  let attempt = 0;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    try {
      console.log(`    → BRIA attempt ${attempt}/${MAX_ATTEMPTS}…`);
      const briaOut = await briaRemoveBackground(original);
      const validation = await validateProcessedPng(briaOut);
      lastValidation = validation;
      if (validation.ok) {
        processed = briaOut;
        if (validation.warnings.length) {
          for (const w of validation.warnings) console.warn(`      ⚠️  ${w}`);
        }
        break;
      }
      console.warn(`      ✗ validación falló:`);
      for (const e of validation.errors) console.warn(`        - ${e}`);
    } catch (err) {
      lastValidation = {
        ok: false,
        errors: [`BRIA exception: ${err.message}`],
        warnings: [],
        stats: {},
      };
      console.warn(`      ✗ BRIA error: ${err.message}`);
    }
  }

  if (!processed) {
    return {
      status: "failed",
      clientId,
      slot,
      sourcePath,
      attempts: attempt,
      validation: lastValidation,
      backgroundTone,
      originalBytes,
    };
  }

  // Comprimir
  let compressed = processed;
  try {
    compressed = await compressPng(processed);
  } catch (err) {
    console.warn(`    ⚠️  compresión falló (uso PNG sin optimizar): ${err.message}`);
  }
  const compressedBytes = compressed.length;

  // Upload
  const storagePath = `3d-assets/${clientId}/${slot}.png`;
  let publicUrl = null;
  if (DRY_RUN) {
    publicUrl = `dry-run://${storagePath}`;
  } else {
    try {
      publicUrl = await uploadToStorage(compressed, storagePath);
    } catch (err) {
      return {
        status: "upload-failed",
        clientId,
        slot,
        sourcePath,
        attempts: attempt,
        validation: lastValidation,
        backgroundTone,
        originalBytes,
        compressedBytes,
        error: err.message,
      };
    }
  }

  return {
    status: "ok",
    clientId,
    slot,
    sourcePath,
    storagePath,
    publicUrl,
    backgroundTone,
    attempts: attempt,
    originalBytes,
    compressedBytes,
    validation: lastValidation,
  };
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const plan = buildPlan();
  const clients = Object.keys(plan);
  if (clients.length === 0) {
    console.error("❌ Plan vacío — nada que procesar.");
    process.exit(1);
  }

  console.log(`\n=== process-3d-assets ===`);
  console.log(`mode:       ${DRY_RUN ? "DRY-RUN (no uploads)" : "APPLY"}`);
  console.log(`particles:  ${PARTICLES}`);
  console.log(`attempts:   ${MAX_ATTEMPTS}`);
  console.log(`halo max:   ${THRESHOLD_HALO}%`);
  console.log(`bbox max:   ${THRESHOLD_BBOX} (cubre rect)`);
  console.log(`clients:    ${clients.join(", ")}`);
  console.log("");

  const results = {};
  const allRows = [];

  for (const clientId of clients) {
    results[clientId] = {};
    const slots = plan[clientId];
    const slotNames = Object.keys(slots);
    console.log(`▶ ${clientId} — ${slotNames.length} slots`);
    for (const slot of slotNames) {
      const sourcePath = slots[slot];
      console.log(`  · ${slot}  (${basename(sourcePath)})`);
      const row = await processOne({ clientId, slot, sourcePath });
      allRows.push(row);

      if (row.status === "ok") {
        results[clientId][slot] = {
          src: row.publicUrl,
          backgroundTone: row.backgroundTone,
          particles: PARTICLES,
          shadowColor: "auto",
          _meta: {
            attempts: row.attempts,
            originalKB: +(row.originalBytes / 1024).toFixed(1),
            compressedKB: +(row.compressedBytes / 1024).toFixed(1),
            savedPct: +(
              ((row.originalBytes - row.compressedBytes) / row.originalBytes) *
              100
            ).toFixed(1),
            validation: row.validation?.stats,
            warnings: row.validation?.warnings || [],
            storagePath: row.storagePath,
          },
        };
        console.log(
          `    ✓ ${row.publicUrl}  (${(row.compressedBytes / 1024).toFixed(
            1
          )} KB, tone ${row.backgroundTone})`
        );
      } else {
        results[clientId][slot] = {
          src: null,
          backgroundTone: row.backgroundTone,
          particles: PARTICLES,
          shadowColor: "auto",
          _meta: {
            status: row.status,
            attempts: row.attempts,
            errors: row.validation?.errors || [],
            warnings: row.validation?.warnings || [],
            error: row.error,
          },
        };
        console.log(`    ✗ FAILED (${row.status}) — necesita atención manual`);
      }
    }
  }

  // ─── Output JSON (merge con lo que ya exista) ────────────────────────────
  const outputPath = resolve(import.meta.dirname, "3d-assets-output.json");
  if (!DRY_RUN) {
    let existing = {};
    if (existsSync(outputPath)) {
      try {
        existing = JSON.parse(readFileSync(outputPath, "utf-8"));
      } catch {
        existing = {};
      }
    }
    for (const [clientId, slots] of Object.entries(results)) {
      existing[clientId] = { ...(existing[clientId] || {}), ...slots };
    }
    writeFileSync(outputPath, JSON.stringify(existing, null, 2) + "\n", "utf-8");
  } else {
    const dryPath = outputPath.replace(/\.json$/, ".dry-run.json");
    writeFileSync(dryPath, JSON.stringify(results, null, 2) + "\n", "utf-8");
    console.log(`\n(dry-run) output → ${dryPath}`);
  }

  // ─── Resumen ─────────────────────────────────────────────────────────────
  const ok = allRows.filter((r) => r.status === "ok");
  const failed = allRows.filter((r) => r.status !== "ok");

  console.log(`\n=== reporte final ===`);
  console.log(`  ok:     ${ok.length}`);
  console.log(`  failed: ${failed.length}`);
  if (ok.length) {
    const sumOriginal = ok.reduce((s, r) => s + r.originalBytes, 0);
    const sumCompressed = ok.reduce((s, r) => s + r.compressedBytes, 0);
    console.log(
      `  bytes:  ${(sumOriginal / 1024).toFixed(0)} KB → ${(sumCompressed / 1024).toFixed(
        0
      )} KB (${(((sumOriginal - sumCompressed) / sumOriginal) * 100).toFixed(1)}% ahorrado)`
    );
  }
  if (failed.length) {
    console.log(`\n  imágenes que necesitan atención manual:`);
    for (const r of failed) {
      console.log(
        `    - ${r.clientId}/${r.slot}: ${r.status} (${(r.validation?.errors || []).join("; ") || r.error || "—"})`
      );
    }
  }
  if (!DRY_RUN) console.log(`\noutput: ${outputPath}\n`);
}

main().catch((err) => {
  console.error("\nError fatal:", err);
  process.exit(1);
});
// EOF
