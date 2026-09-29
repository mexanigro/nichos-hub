import { FieldValue } from "firebase-admin/firestore";

/**
 * Lo que `PUT /api/config/[clientId]` le entrega a `set(…, { merge: true })`.
 *
 * Firestore, con `merge: true`, fusiona hoja por hoja; pero un MAPA VACÍO es una hoja: `{ translations: { en: {} } }` reemplaza
 * la capa inglesa entera por `{}`. Medido en IDIOMAS-01 (2026-09-29): un guardado de Contenido que llegó con el parche vacío borró
 * `translations.en` de una web de prueba (servicios, equipo, reseñas y alts de galería). Por eso ningún mapa vacío llega a
 * Firestore, en ninguna parte del cuerpo: se quita, y un mapa que queda vacío al quitar los suyos también. Un parche vacío no borra
 * nada. Borrar sigue siendo explícito: `null` → `FieldValue.delete()` sólo en ese campo. Los arrays se escriben enteros, como siempre.
 */
export function paraFirestore(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (v === null) out[k] = FieldValue.delete();
    else if (esMapa(v)) {
      const dentro = paraFirestore(v);
      if (Object.keys(dentro).length) out[k] = dentro;
    } else out[k] = v;
  }
  return out;
}

function esMapa(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
}
