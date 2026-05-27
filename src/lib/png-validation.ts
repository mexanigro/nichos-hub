/**
 * Client-side validation for transparent PNGs used in the 3D Impact system
 * (heroObjects, composition layers).
 *
 * The 3D objects render assuming a real alpha channel and decent resolution.
 * Reject before upload — once it's in Firebase Storage it'll ship to the
 * client's site and look terrible. Pure browser code: canvas + ImageData.
 *
 * Returns either `{ ok: true, file }` (the original File) or
 * `{ ok: false, message }` with a user-facing Spanish message.
 */

export type PngValidationKind = "hero" | "particle" | "layer";

export type PngValidationOptions = {
  /** Which kind of asset — drives the minimum resolution. */
  kind?: PngValidationKind;
  /** Hard fail above this size (bytes). Default 1 MB. */
  maxBytes?: number;
  /** Warn above this size (bytes). Default 500 KB. Returned in `warning`. */
  warnBytes?: number;
  /** Skip the alpha-channel sample (still validates format). */
  skipAlphaCheck?: boolean;
};

export type PngValidationResult =
  | { ok: true; file: File; warning?: string }
  | { ok: false; message: string };

const MIN_DIMS: Record<PngValidationKind, { side: number; label: string }> = {
  hero: { side: 2400, label: "2400×3200" },
  // Layers go inside a composition stack — same hero-grade quality.
  layer: { side: 2400, label: "2400×3200" },
  // Particles / pearls textures are tiled, lower resolution OK.
  particle: { side: 1200, label: "1200×1200" },
};

const DEFAULTS = {
  maxBytes: 1024 * 1024, // 1 MB hard fail
  warnBytes: 500 * 1024, // 500 KB warning
};

/**
 * Run all checks against a candidate PNG file. Resolves with either a pass
 * (returns the same File for the caller to upload) or a Spanish error message.
 */
export async function validateTransparentPng(
  rawFile: File,
  opts: PngValidationOptions = {},
): Promise<PngValidationResult> {
  const kind: PngValidationKind = opts.kind ?? "hero";
  const minDim = MIN_DIMS[kind];
  const maxBytes = opts.maxBytes ?? DEFAULTS.maxBytes;
  const warnBytes = opts.warnBytes ?? DEFAULTS.warnBytes;

  // 1. Format check — MIME + extension fallback.
  const looksLikePng =
    rawFile.type === "image/png" ||
    /\.png$/i.test(rawFile.name);
  if (!looksLikePng) {
    return {
      ok: false,
      message:
        "La imagen debe ser un PNG. Convertila a .png (no .jpg, .webp ni .heic) antes de subir.",
    };
  }

  // 2. Size — hard fail above maxBytes.
  if (rawFile.size > maxBytes) {
    const mb = (rawFile.size / 1024 / 1024).toFixed(2);
    const limit = (maxBytes / 1024 / 1024).toFixed(2);
    return {
      ok: false,
      message: `La imagen pesa ${mb} MB — el limite para objetos 3D es ${limit} MB. Optimizala (tinypng.com) o bajale el detalle.`,
    };
  }

  // 3. Load to inspect dimensions + alpha channel.
  let bitmap: ImageBitmap | HTMLImageElement | null = null;
  let url: string | null = null;
  try {
    url = URL.createObjectURL(rawFile);
    bitmap = await loadBitmap(url);
  } catch {
    return {
      ok: false,
      message: "No se pudo leer la imagen. Verifica que no este corrupta.",
    };
  }

  const width = "naturalWidth" in bitmap ? bitmap.naturalWidth : bitmap.width;
  const height = "naturalHeight" in bitmap ? bitmap.naturalHeight : bitmap.height;

  // 4. Resolution — at least min side on the longest edge.
  const longest = Math.max(width, height);
  if (longest < minDim.side) {
    if (url) URL.revokeObjectURL(url);
    return {
      ok: false,
      message: `La imagen es de ${width}×${height} px. Para objetos 3D ${
        kind === "particle" ? "(particulas)" : "(hero)"
      } necesitamos al menos ${minDim.label}. Subi una version mas grande.`,
    };
  }

  // 5. Alpha channel — sample a margin strip of pixels (PNGs over photos that
  //    were just renamed to .png have an all-opaque alpha — those won't blend).
  if (!opts.skipAlphaCheck) {
    const alphaOk = await hasMeaningfulAlpha(bitmap, width, height);
    if (url) URL.revokeObjectURL(url);
    if (!alphaOk) {
      return {
        ok: false,
        message:
          "El PNG no tiene fondo transparente real (canal alpha completo). Pasalo por remove.bg o exportalo desde Photoshop/Figma con transparencia antes de subir.",
      };
    }
  } else if (url) {
    URL.revokeObjectURL(url);
  }

  // 6. Soft size warning — still returns ok:true.
  const warning =
    rawFile.size > warnBytes
      ? `La imagen pesa ${(rawFile.size / 1024).toFixed(0)} KB. Para que el sitio cargue rapido, lo ideal es bajo ${(warnBytes / 1024).toFixed(0)} KB. Optimizala en tinypng.com si podes.`
      : undefined;

  return { ok: true, file: rawFile, warning };
}

/* ════════════════════════════════════════════════════════════════════════ */

async function loadBitmap(url: string): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap is fastest where available and skips DOM layout.
  if (typeof createImageBitmap === "function") {
    const blob = await fetch(url).then((r) => r.blob());
    return await createImageBitmap(blob);
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Sample the outer 8% margin of the image at a coarse grid. If at least 15%
 * of sampled pixels have alpha < 250 we consider it a real transparent PNG.
 *
 * Why the margin? Hero PNG objects almost always have transparent borders
 * around the subject — sampling there gives a cheap and reliable signal
 * without needing to read the full ImageData of a 3000×3000 file.
 */
async function hasMeaningfulAlpha(
  bitmap: ImageBitmap | HTMLImageElement,
  width: number,
  height: number,
): Promise<boolean> {
  // Downsample to keep the check fast even on big images.
  const targetMax = 256;
  const scale = Math.min(1, targetMax / Math.max(width, height));
  const w = Math.max(8, Math.round(width * scale));
  const h = Math.max(8, Math.round(height * scale));

  const canvas =
    typeof OffscreenCanvas === "function"
      ? new OffscreenCanvas(w, h)
      : Object.assign(document.createElement("canvas"), { width: w, height: h });
  // OffscreenCanvas needs explicit sizing too.
  if ("width" in canvas) canvas.width = w;
  if ("height" in canvas) canvas.height = h;

  const ctx = (canvas as HTMLCanvasElement).getContext("2d", {
    willReadFrequently: true,
  });
  if (!ctx) return true; // canvas unavailable — trust the user.
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, w, h);

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, w, h);
  } catch {
    // CORS-tainted canvas; not expected for a local File but be safe.
    return true;
  }
  const data = imageData.data;
  const margin = Math.max(1, Math.round(Math.min(w, h) * 0.08));

  let sampled = 0;
  let transparent = 0;

  // Top + bottom strips
  for (let y = 0; y < margin; y++) {
    for (let x = 0; x < w; x += 2) {
      const a1 = data[(y * w + x) * 4 + 3];
      const a2 = data[((h - 1 - y) * w + x) * 4 + 3];
      sampled += 2;
      if (a1 < 250) transparent++;
      if (a2 < 250) transparent++;
    }
  }
  // Left + right strips (excluding corners already counted)
  for (let x = 0; x < margin; x++) {
    for (let y = margin; y < h - margin; y += 2) {
      const a1 = data[(y * w + x) * 4 + 3];
      const a2 = data[(y * w + (w - 1 - x)) * 4 + 3];
      sampled += 2;
      if (a1 < 250) transparent++;
      if (a2 < 250) transparent++;
    }
  }

  if (sampled === 0) return true;
  return transparent / sampled > 0.15;
}
