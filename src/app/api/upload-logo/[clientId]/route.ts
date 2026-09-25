/**
 * La casilla de logo del hub. ARREGLOS-01 (2026-09-25, D-110): sube por la MISMA puerta que el resto del material
 * (`subirMaterial`, rol `branding`, hueco fijo `logo.<ext>` / `logo-dark.<ext>`, token = sha256 del contenido), así que para los
 * mismos bytes la url es la misma que la de `scripts/b4-material.ts` y la subida es idempotente. Antes guardaba fuera de
 * `media/<rol>/`, con un token al azar y la extensión `.png` fija, aunque el archivo fuera `.webp`.
 * Vale para todos los nichos: ni esta ruta ni la casilla preguntan por el nicho.
 */
import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { actualizacionDeLogos, nombreLogo, resolveContentType, subirMaterial } from "@/lib/media-upload";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export const POST = withOwner(async (req, _session, ctx) => {
  const { clientId } = await ctx.params;
  if (!/^[a-zA-Z0-9_-]+$/.test(clientId)) {
    return NextResponse.json({ error: "clientId invalido" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Se esperaba multipart/form-data" }, { status: 400 });
  }

  const lightFile = formData.get("logo-light") as File | null;
  const darkFile = formData.get("logo-dark") as File | null;

  if ((!lightFile || lightFile.size === 0) && (!darkFile || darkFile.size === 0)) {
    return NextResponse.json({ error: "Se requiere al menos un archivo de logo" }, { status: 400 });
  }

  const errors: string[] = [];

  /** Un logo por la puerta del material: rol `branding` y el hueco fijo de su variante. */
  async function uploadFile(file: File, variante: "light" | "dark"): Promise<string | null> {
    const contentType = resolveContentType(file.name, file.type);
    // Un logo es una imagen: `subirMaterial` también acepta vídeo, aquí no.
    if (!ALLOWED_TYPES.has(contentType)) {
      errors.push(`${file.name}: tipo no permitido (${contentType || "desconocido"})`);
      return null;
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      const { url } = await subirMaterial({ clientId, rol: "branding", nombre: nombreLogo(variante, file.name), buffer, contentType });
      return url;
    } catch (err) {
      // Tipo no permitido o tamaño: `subirMaterial` los rechaza con el mismo mensaje que daba esta ruta.
      errors.push(err instanceof Error ? err.message : String(err));
      return null;
    }
  }

  let lightUrl: string | null = null;
  let darkUrl: string | null = null;

  try {
    if (lightFile && lightFile.size > 0) {
      lightUrl = await uploadFile(lightFile, "light");
    }
    if (darkFile && darkFile.size > 0) {
      darkUrl = await uploadFile(darkFile, "dark");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[upload-logo] Storage error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (!lightUrl && !darkUrl) {
    return NextResponse.json({ error: errors.join("; ") || "Error al subir logos" }, { status: 400 });
  }

  // Check current config to decide auto-fill behavior
  const configRef = db.collection("config").doc(clientId);
  let currentLogo = "";
  let currentLogoDark = "";
  try {
    const snap = await configRef.get();
    if (snap.exists) {
      const brand = (snap.data()?.brand as Record<string, string>) || {};
      currentLogo = brand.logo || "";
      currentLogoDark = brand.logoDark || "";
    }
  } catch {
    // config may not exist yet
  }

  // El logo que el cliente ya tiene no se pisa (D-110): la decisión vive en una función pura, probable sin Firestore.
  const { result, updates } = actualizacionDeLogos({
    lightUrl: lightUrl ?? undefined,
    darkUrl: darkUrl ?? undefined,
    logoActual: currentLogo,
    logoDarkActual: currentLogoDark,
  });

  // Persist to Firestore — update() for existing docs, set() as fallback
  try {
    await configRef.update(updates);
  } catch {
    try {
      const brand: Record<string, string> = {};
      if (result.logo) brand.logo = result.logo;
      if (result.logoDark) brand.logoDark = result.logoDark;
      await configRef.set({ brand }, { mergeFields: Object.keys(updates) });
    } catch (err) {
      console.error("[upload-logo] Firestore write failed:", err);
    }
  }

  return NextResponse.json({ ...result, errors: errors.length > 0 ? errors : undefined });
});
