/**
 * process-mascot-local.mjs
 *
 * Quita el fondo cream de las poses del erizo (arzac.studio landing) de forma
 * LOCAL (sin BRIA/Firebase) usando flood-fill por conectividad desde los bordes.
 * El cuerpo cream del erizo queda intacto porque está encerrado por las espinas
 * terracota (borde más oscuro) — el flood-fill se detiene ahí.
 *
 *   node scripts/process-mascot-local.mjs <slot> [<slot> ...]
 *   ej: node scripts/process-mascot-local.mjs 02-belly-A-green 03-belly-A-warm 06-cozy-green
 *
 * Entrada:  public/mascot/hedgehog/hedgehog-<slot>.png
 * Salida:   public/mascot/hedgehog/processed/<slot>.png  (alpha, ~760px, trimmed)
 */
import sharp from "sharp";
import { resolve } from "path";

const SRC_DIR = resolve(process.cwd(), "public/mascot/hedgehog");
const OUT_DIR = resolve(SRC_DIR, "processed");
const TOL = 34;          // distancia RGB al cream de referencia
const FEATHER_TOL = 60;  // banda de transición para el alpha (anti-halo)
const OUT_MAX = 760;     // lado mayor de salida

function dist2(r, g, b, R, G, B) {
  const dr = r - R, dg = g - G, db = b - B;
  return dr * dr + dg * dg + db * db;
}

async function processSlot(slot) {
  const src = resolve(SRC_DIR, `hedgehog-${slot}.png`);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const ch = info.channels; // 4

  // Cream de referencia: promedio de las 4 esquinas
  const corner = (x, y) => { const i = (y * w + x) * ch; return [data[i], data[i + 1], data[i + 2]]; };
  const cs = [corner(2, 2), corner(w - 3, 2), corner(2, h - 3), corner(w - 3, h - 3)];
  const R = Math.round(cs.reduce((s, c) => s + c[0], 0) / 4);
  const G = Math.round(cs.reduce((s, c) => s + c[1], 0) / 4);
  const B = Math.round(cs.reduce((s, c) => s + c[2], 0) / 4);
  const tol2 = TOL * TOL;
  const feather2 = FEATHER_TOL * FEATHER_TOL;

  // Flood-fill BFS desde TODOS los píxeles de borde que sean cream
  const visited = new Uint8Array(w * h);
  const stack = [];
  const pushIf = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (visited[p]) return;
    const i = p * ch;
    if (dist2(data[i], data[i + 1], data[i + 2], R, G, B) <= tol2) { visited[p] = 1; stack.push(p); }
  };
  for (let x = 0; x < w; x++) { pushIf(x, 0); pushIf(x, h - 1); }
  for (let y = 0; y < h; y++) { pushIf(0, y); pushIf(w - 1, y); }

  while (stack.length) {
    const p = stack.pop();
    const x = p % w, y = (p - x) / w;
    pushIf(x + 1, y); pushIf(x - 1, y); pushIf(x, y + 1); pushIf(x, y - 1);
  }

  // Aplicar alpha: bg conectado → transparente. Borde → feather suave + despill
  // del tinte cream para evitar halo.
  for (let p = 0; p < w * h; p++) {
    const i = p * ch;
    if (visited[p]) { data[i + 3] = 0; continue; }
    const d2 = dist2(data[i], data[i + 1], data[i + 2], R, G, B);
    if (d2 < feather2) {
      // píxel cremoso NO conectado al borde (cerca del contorno): bajar alpha
      // proporcional a cuán cerca está del cream, suavizando el filo.
      const t = d2 / feather2; // 0=cream .. 1=lejos
      const a = Math.round(255 * Math.min(1, t * 1.15));
      if (a < data[i + 3]) data[i + 3] = a;
    }
  }

  const cleaned = sharp(Buffer.from(data), { raw: { width: w, height: h, channels: ch } });
  const meta = await cleaned.png().toBuffer().then((b) => sharp(b).metadata());

  const outPath = resolve(OUT_DIR, `${slot}.png`);
  await sharp(Buffer.from(data), { raw: { width: w, height: h, channels: ch } })
    .trim({ threshold: 1 }) // recortar borde transparente
    .resize({ width: OUT_MAX, height: OUT_MAX, fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9, quality: 90, effort: 9 })
    .toFile(outPath);

  const out = await sharp(outPath).metadata();
  // medir % transparente para validar
  const { data: od, info: oi } = await sharp(outPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let tr = 0; for (let p = 0; p < oi.width * oi.height; p++) if (od[p * oi.channels + 3] < 30) tr++;
  const pct = ((tr / (oi.width * oi.height)) * 100).toFixed(1);
  console.log(`  ✓ ${slot} → processed/${slot}.png  ${out.width}x${out.height}  cream=[${R},${G},${B}]  transp=${pct}%`);
}

const slots = process.argv.slice(2);
if (!slots.length) { console.error("uso: node scripts/process-mascot-local.mjs <slot> ..."); process.exit(1); }
console.log("=== process-mascot-local ===");
for (const s of slots) { try { await processSlot(s); } catch (e) { console.error(`  ✗ ${s}: ${e.message}`); } }
