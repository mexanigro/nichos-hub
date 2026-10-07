/**
 * MARCA-01 (D-291) · Instagram sigue a la galería. `desde-plantilla` deja `sections.instagram.images` con las mismas urls que las
 * piezas de la galería —el mismo archivo de Storage— y `subirMaterial`, al subir otra foto con el nombre fijo de la pieza, reescribe
 * ese archivo con otro token (D-22): la url vieja da 403 (medido en Ashkelon, `DEMOS-ASHKELON.md` § 1). Al poner la foto de una pieza,
 * cada foto de Instagram que apuntaba al mismo archivo (la misma ruta, con cualquier token) pasa a la url nueva; y también la que tiene
 * el MISMO contenido en otro archivo (el mismo token: el sha256 de los bytes, D-22) —la web de Yulia, que resubió sus 6 fotos de
 * Instagram a mano en archivos propios—: muestra la misma foto, así que la sigue.
 * Puro y sin alias `@/`: lo usan la casilla de galería (`aplicarPieza`) y la consola de material (`subirCarpeta`).
 */
type Cfg = Record<string, unknown>;

/** «<bucket>/<ruta>» de una url de descarga de Firebase Storage (sin el token), o undefined. */
export function rutaDeStorage(url: unknown): string | undefined {
  if (typeof url !== "string") return undefined;
  const m = /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/([^/]+)\/o\/([^?]+)\?/.exec(url);
  return m ? `${m[1]}/${decodeURIComponent(m[2])}` : undefined;
}

const tokenDe = (url: unknown) => (typeof url === "string" ? /[?&]token=([0-9a-f]+)/.exec(url)?.[1] : undefined);

/** `config` con cada foto de Instagram que apuntaba al archivo de `anterior` (o tenía su mismo contenido) cambiada a `nueva`; no muta la entrada y, si no hay
 *  ninguna que cambiar (o no hay Instagram), devuelve el mismo objeto. */
export function instagramSigueA<T extends Cfg>(config: T, anterior: unknown, nueva: unknown): T {
  const ruta = rutaDeStorage(anterior), token = tokenDe(anterior);
  const sigue = (u: unknown) => rutaDeStorage(u) === ruta || (!!token && tokenDe(u) === token);
  const sections = config.sections as Cfg | undefined;
  const ig = sections?.instagram as Cfg | undefined;
  const fotos = Array.isArray(ig?.images) ? (ig.images as unknown[]) : null;
  if (!ruta || typeof nueva !== "string" || !nueva || !fotos || !fotos.some(sigue)) return config;
  return { ...config, sections: { ...sections, instagram: { ...ig, images: fotos.map((u) => (sigue(u) ? nueva : u)) } } };
}
