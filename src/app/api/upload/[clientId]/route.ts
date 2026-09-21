import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { resolveContentType, subirMaterial } from "@/lib/media-upload";

const MAX_FILES = 20;
/** image/jpeg|png|webp|avif ≤ 5 MB y video/mp4|webm ≤ 6 MB (los límites viven en subirMaterial). */
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm"]);

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

  const files = formData.getAll("file").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No se enviaron archivos" }, { status: 400 });
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Maximo ${MAX_FILES} archivos por request` }, { status: 400 });
  }

  // CONEXION-01: `rol` = hero|services|gallery|staff|branding para la peluquería; la flota sigue en `images`.
  const rolCrudo = formData.get("rol");
  const rol = typeof rolCrudo === "string" && /^[a-z]+$/.test(rolCrudo) ? rolCrudo : "images";

  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const contentType = resolveContentType(file.name, file.type);

    if (!contentType || !ALLOWED_TYPES.has(contentType)) {
      errors.push(`${file.name}: tipo no permitido (${file.type || "vacío"} → ${contentType || "desconocido"})`);
      continue;
    }

    // La flota sube fotos sueltas al mismo rol: prefijo de tiempo para que dos con el mismo nombre no se pisen.
    // Los roles de la peluquería nombran el hueco (hero.mp4, retrato-1.jpg): el nombre va tal cual y el path es reproducible.
    const nombre = rol === "images" ? `${Date.now()}-${file.name}` : file.name;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { url } = await subirMaterial({ clientId, rol, nombre, buffer, contentType });
      urls.push(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[upload] Error subiendo ${file.name}:`, msg);
      errors.push(`${file.name}: ${msg}`);
    }
  }

  if (urls.length === 0 && errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  return NextResponse.json({ urls, errors: errors.length > 0 ? errors : undefined });
});
