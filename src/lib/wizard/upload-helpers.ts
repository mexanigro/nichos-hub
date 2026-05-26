import type { SerializedFile } from "@/lib/builder-storage";

/**
 * Convierte un SerializedFile (dataUrl en base64) de vuelta a un File real
 * para poder subirlo por multipart/form-data.
 */
export function serializedToFile(sf: SerializedFile): File | null {
  try {
    const [meta, base64] = sf.dataUrl.split(",");
    if (!base64) return null;
    const mime = sf.type || meta.match(/data:(.*?);/)?.[1] || "application/octet-stream";
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], sf.name || "upload.bin", { type: mime });
  } catch {
    return null;
  }
}

interface UploadResult {
  ok: boolean;
  urls?: string[];
  error?: string;
}

/**
 * Sube uno o varios SerializedFile al endpoint protegido por token JWT.
 * Devuelve las URLs publicas (Firebase Storage download URLs).
 */
export async function uploadSerializedFiles(
  files: SerializedFile[],
  token: string,
): Promise<UploadResult> {
  const realFiles = files.map(serializedToFile).filter((f): f is File => f !== null);
  if (realFiles.length === 0) return { ok: true, urls: [] };

  const form = new FormData();
  for (const f of realFiles) form.append("file", f);

  let res: Response;
  try {
    res = await fetch("/api/onboarding/upload", {
      method: "POST",
      headers: { "x-onboarding-token": token },
      body: form,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error || `Upload failed (${res.status})` };
  }
  return { ok: true, urls: data.urls || [] };
}
