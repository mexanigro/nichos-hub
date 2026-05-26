/**
 * Client-side image downscale + JPEG re-encode.
 *
 * Goals:
 *   - Cut bandwidth from naive multi-MB phone photos before they hit /api/upload.
 *   - Keep visual quality "good enough" for landing-page renders.
 *   - Stay zero-dependency: only canvas + Blob, no library.
 *
 * Strategy:
 *   - If the file is not an image, return it untouched.
 *   - If it is SVG, return untouched (re-encoding to JPEG would destroy it).
 *   - Otherwise: load into an <img>, draw into an offscreen canvas with the
 *     longest side capped at `maxDim`, encode to JPEG at the given quality,
 *     and return the smaller of the two.
 *
 * The original filename is preserved (without forcing `.jpg`) so the server
 * can still infer roles by name in brand-package imports. The MIME type is
 * set to image/jpeg only when we actually re-encoded.
 */

export type CompressOptions = {
  /** Longest side after resize. 2000px is plenty for any hero / gallery use. */
  maxDim?: number;
  /** JPEG quality 0..1. 0.82 keeps phone photos crisp. */
  quality?: number;
  /** Skip compression entirely if the file is smaller than this. */
  skipBelowBytes?: number;
};

const DEFAULTS: Required<CompressOptions> = {
  maxDim: 2000,
  quality: 0.82,
  skipBelowBytes: 600 * 1024, // 600 KB
};

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const cfg = { ...DEFAULTS, ...opts };

  // Skip non-images and SVG (vector — re-encoding makes no sense).
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/svg+xml") return file;
  if (file.size <= cfg.skipBelowBytes) return file;

  // Browser without canvas / Blob (shouldn't happen in Next/Vercel target, but be safe).
  if (typeof document === "undefined" || typeof Image === "undefined") return file;

  let url: string | null = null;
  try {
    url = URL.createObjectURL(file);
    const img = await loadImage(url);
    const { width, height } = scaledDims(img.naturalWidth, img.naturalHeight, cfg.maxDim);

    // No-op if the file is already small enough.
    if (width === img.naturalWidth && height === img.naturalHeight && file.size < 2 * 1024 * 1024) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", cfg.quality);
    });

    if (!blob) return file;
    if (blob.size >= file.size) return file; // compression actually made it bigger — bail.

    // Strip extension and append .jpg so the server's MIME inference is consistent.
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    if (url) URL.revokeObjectURL(url);
  }
}

/**
 * Apply compressImage to multiple files in parallel.
 */
export async function compressImages(files: File[], opts?: CompressOptions): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, opts)));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function scaledDims(srcW: number, srcH: number, maxDim: number): { width: number; height: number } {
  const longest = Math.max(srcW, srcH);
  if (longest <= maxDim) return { width: srcW, height: srcH };
  const scale = maxDim / longest;
  return {
    width: Math.round(srcW * scale),
    height: Math.round(srcH * scale),
  };
}
