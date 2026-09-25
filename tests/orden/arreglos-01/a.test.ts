// ARREGLOS-01 · C (H) · la casilla de logo sube como el resto del material. Sesión A (2026-09-25): tests rojos —
// `src/lib/media-upload.ts` no exporta `nombreLogo` ni `actualizacionDeLogos`.
//
// D-110 (medido). `/api/upload-logo/[clientId]/route.ts:62–68, :76, :79` guarda en `clients/<id>/logo-light-bg.png` y
// `logo-dark-bg.png` con `randomUUID()` de token y la extensión `.png` FIJA, aunque el archivo sea `.webp`. Todas las demás
// casillas (CONEXION-02..06) suben por `/api/upload/[clientId]` → `subirMaterial`, que guarda en
// `clients/<id>/media/<rol>/<nombre>` con el token = sha256 del contenido (D-20): misma entrada, misma url, idempotente. Por eso
// E2E-01 tuvo que comparar el material por CONTENIDO y dejar el diagnóstico «(LOGO-01)» a la vista.
//
// Caja negra: `subirMaterial` se llama con un bucket EN MEMORIA (`BucketMinimo`, el mismo patrón que sus propios tests), así que
// este test no toca Storage, ni Firestore, ni la red. La url esperada se arma con `urlDeStorage` y `tokenDeContenido`, que son la
// misma cuenta que hace `scripts/b4-material.ts`. Sólo en H (inciso n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { B4_MATERIAL, CONFIG_TAB, MEDIA_UPLOAD, ROOT, RUTA_LOGO, VIEJO_LOGO, canonico, fuente, importarModulo } from "./_comun.ts";

/** Lo que `b4-material.ts` ya declara para el logo: las dos rutas del fixture, con rol `branding` (CONEXION-08, D-81). */
const FILAS_B4 = [`["brand.logo", "branding"]`, `["brand.logoDark", "branding"]`];
/** Un bucket en memoria con la forma mínima que `subirMaterial` usa. */
function bucketFalso() {
  const guardados: { path: string; bytes: number; metadata: Record<string, unknown> }[] = [];
  return {
    guardados,
    bucket: {
      name: "bucket-de-prueba.firebasestorage.app",
      file(path: string) {
        return { async save(buffer: Buffer, opts: { metadata: Record<string, unknown> }) { guardados.push({ path, bytes: buffer.length, metadata: opts.metadata }); } };
      },
    },
  };
}

test("src/lib/media-upload.ts exporta `nombreLogo` con los nombres fijos `logo.<ext>` y `logo-dark.<ext>` (la extensión real del archivo) y /api/upload-logo/[clientId] sube por `subirMaterial` con rol `branding`: para los mismos bytes la url es la misma que la de scripts/b4-material.ts, y la ruta ya no usa `randomUUID` ni `clients/<id>/logo-light-bg.png`", async () => {
  // (1) La función de nombre. Hoy no existe: aquí es donde esta orden está en rojo.
  const mod = await importarModulo(MEDIA_UPLOAD);
  assert.equal(typeof mod.nombreLogo, "function", `${MEDIA_UPLOAD} debe exportar \`nombreLogo(variante, archivo)\` (exporta: ${Object.keys(mod).join(", ")})`);
  const nombreLogo = mod.nombreLogo as (v: "light" | "dark", archivo: string) => string;

  // (2) Nombre fijo por variante, con la extensión REAL del archivo (hoy la ruta escribe `.png` siempre, D-110).
  assert.equal(nombreLogo("light", "logo.png"), "logo.png", "la variante clara se llama logo.<ext>");
  assert.equal(nombreLogo("dark", "logo.png"), "logo-dark.png", "la variante oscura se llama logo-dark.<ext>");
  assert.equal(nombreLogo("light", "marca del salón.WEBP"), "logo.webp", "el nombre del archivo del cliente no manda: manda el hueco, y la extensión va en minúsculas");
  assert.equal(nombreLogo("dark", "x.AVIF"), "logo-dark.avif", "lo mismo para la oscura");
  assert.notEqual(nombreLogo("light", "a.webp"), nombreLogo("light", "a.png"), "dos formatos distintos no comparten nombre: la url tiene que decir qué archivo es");

  // (3) Misma entrada, misma url que b4-material.ts: rol `branding`, path por rol y token = sha256 del contenido (D-20, D-36).
  const { subirMaterial, tokenDeContenido, urlDeStorage } = mod as {
    subirMaterial: (m: Record<string, unknown>, d: { bucket: unknown }) => Promise<{ url: string; path: string }>;
    tokenDeContenido: (b: Buffer) => string;
    urlDeStorage: (bucket: string, path: string, token: string) => string;
  };
  const bytes = Buffer.from("PNG falso del wordmark de la plantilla A", "utf8");
  const clientId = "demo-peluqueria-abcd1234";
  const falso = bucketFalso();
  const subida = await subirMaterial({ clientId, rol: "branding", nombre: nombreLogo("light", "logo.png"), buffer: bytes, contentType: "image/png" }, { bucket: falso.bucket });
  const token = tokenDeContenido(bytes);
  assert.equal(token, createHash("sha256").update(bytes).digest("hex").slice(0, 32), "precondición: el token es el sha256 del contenido (D-20)");
  assert.equal(subida.path, `clients/${clientId}/media/branding/logo.png`, "el logo vive donde vive el resto del material del cliente");
  assert.equal(subida.url, urlDeStorage(falso.bucket.name, `clients/${clientId}/media/branding/logo.png`, token), "misma entrada, misma url");
  assert.deepEqual(canonico(falso.guardados.map((g) => g.path)), canonico([`clients/${clientId}/media/branding/logo.png`]), "una sola escritura, en el path del rol");

  // (4) Y la ruta de la casilla usa esa puerta y ya no la suya.
  assert.ok(existsSync(resolve(ROOT, RUTA_LOGO)), `precondición: existe ${RUTA_LOGO}`);
  const ruta = fuente(RUTA_LOGO);
  assert.ok(ruta.includes("subirMaterial"), `${RUTA_LOGO} debe subir por subirMaterial, como el resto de las casillas`);
  assert.ok(ruta.includes("nombreLogo"), `${RUTA_LOGO} debe nombrar el hueco con nombreLogo`);
  assert.match(ruta, /["'`]branding["'`]/, `${RUTA_LOGO} debe subir con el rol branding (D-81)`);
  for (const viejo of VIEJO_LOGO) assert.ok(!ruta.includes(viejo), `${RUTA_LOGO} ya no usa «${viejo}» (D-110)`);

  // (5) Control: b4-material.ts sigue declarando las dos filas del logo con el mismo rol, que es con quien tiene que coincidir.
  const b4 = fuente(B4_MATERIAL);
  for (const fila of FILAS_B4) assert.ok(b4.includes(fila), `${B4_MATERIAL} declara ${fila}`);
});

test("la casilla de logo no mira el nicho —`client-config-tab.tsx` no le pasa `niche` a `LogoUploadField` y la ruta del logo no lo nombra— y un cliente que ya tiene logo no lo pierde: `actualizacionDeLogos`, exportada por src/lib/media-upload.ts, escribe sólo la clave de la variante subida y rellena la otra únicamente cuando está vacía", async () => {
  // (1) La decisión de qué se escribe, hoy en línea en la ruta (`route.ts:106–125`), como función pura. Hoy no existe: rojo.
  const mod = await importarModulo(MEDIA_UPLOAD);
  assert.equal(typeof mod.actualizacionDeLogos, "function", `${MEDIA_UPLOAD} debe exportar \`actualizacionDeLogos({ lightUrl, darkUrl, logoActual, logoDarkActual })\` (exporta: ${Object.keys(mod).join(", ")})`);
  const actualizacion = mod.actualizacionDeLogos as (e: Record<string, string | undefined>) => { result: Record<string, string>; updates: Record<string, string> };

  const CLARO = "https://firebasestorage.googleapis.com/v0/b/x/o/claro?alt=media&token=aaaa";
  const OSCURO = "https://firebasestorage.googleapis.com/v0/b/x/o/oscuro?alt=media&token=bbbb";
  const VIEJA = "https://firebasestorage.googleapis.com/v0/b/x/o/vieja?alt=media&token=cccc";

  // (2) Cliente nuevo: la variante que falta se rellena con la que subió.
  assert.deepEqual(canonico(actualizacion({ lightUrl: CLARO }).updates), canonico({ "brand.logo": CLARO, "brand.logoDark": CLARO }), "sin nada guardado, subir la clara rellena las dos");
  assert.deepEqual(canonico(actualizacion({ darkUrl: OSCURO }).updates), canonico({ "brand.logoDark": OSCURO, "brand.logo": OSCURO }), "sin nada guardado, subir la oscura rellena las dos");

  // (3) Cliente que YA tiene logo: la url que ya está NO se pisa. Esto es lo que D-110 promete.
  assert.deepEqual(canonico(actualizacion({ lightUrl: CLARO, logoDarkActual: VIEJA }).updates), canonico({ "brand.logo": CLARO }), "con una oscura guardada, subir la clara no toca la oscura");
  assert.deepEqual(canonico(actualizacion({ darkUrl: OSCURO, logoActual: VIEJA }).updates), canonico({ "brand.logoDark": OSCURO }), "con una clara guardada, subir la oscura no toca la clara");
  assert.deepEqual(canonico(actualizacion({ lightUrl: CLARO, darkUrl: OSCURO, logoActual: VIEJA, logoDarkActual: VIEJA }).updates), canonico({ "brand.logo": CLARO, "brand.logoDark": OSCURO }), "subir las dos escribe las dos");
  assert.deepEqual(canonico(actualizacion({}).updates), canonico({}), "sin subida no se escribe nada");
  assert.deepEqual(canonico(actualizacion({ lightUrl: CLARO, logoDarkActual: VIEJA }).result), canonico({ logo: CLARO }), "lo que la casilla recibe de vuelta es lo que se escribió");

  // (4) Y la casilla vale para todos los nichos: ni la ruta ni la puerta del material preguntan por el nicho, y la pestaña no
  //     le pasa `niche` a la casilla (el patrón D-35/D-46/D-47/D-67 es para las casillas de peluquería, no para el logo).
  assert.ok(!/\bniche\b/.test(fuente(RUTA_LOGO)), `${RUTA_LOGO} no puede mirar el nicho: el logo es de todos los clientes`);
  const tab = fuente(CONFIG_TAB);
  const monta = tab.match(/<LogoUploadField[\s\S]{0,400}?\/>/);
  assert.ok(monta, `${CONFIG_TAB} debe montar <LogoUploadField …/>`);
  assert.ok(!/\bniche\b/.test(monta[0]), `${CONFIG_TAB} no le pasa \`niche\` a LogoUploadField:\n${monta[0]}`);
});
