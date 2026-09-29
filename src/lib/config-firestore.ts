import { FieldValue } from "firebase-admin/firestore";

/**
 * Lo que `PUT /api/config/[clientId]` le entrega a `set(…, { merge: true })`.
 *
 * Firestore, con `merge: true`, fusiona hoja por hoja; pero un MAPA VACÍO es una hoja: `{ translations: { en: {} } }` reemplaza
 * la capa inglesa entera por `{}`. Medido en IDIOMAS-01 (2026-09-29): un guardado de Contenido que llegó con el parche vacío borró
 * `translations.en` de una web de prueba (servicios, equipo, reseñas y alts de galería). Por eso, DENTRO de `translations`, ningún
 * mapa vacío llega a Firestore: se quita, y uno que queda vacío al quitar los suyos también; un parche vacío no borra una capa.
 * Fuera de `translations`, `{}` se escribe como siempre, porque el hub lo manda a propósito: `hours: {}` en el alta (sin él la web
 * muestra el horario del preset), `heroObjects: {}` que activa Impact y los slots nuevos de hero-objects-editor.
 * Borrar sigue siendo explícito en todo el cuerpo: `null` → `FieldValue.delete()` sólo en ese campo. Los arrays, enteros.
 */
export function paraFirestore(body: Record<string, unknown>): Record<string, unknown> {
  return convertir(body, false, true);
}

function convertir(obj: Record<string, unknown>, podar: boolean, raiz: boolean): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null) out[k] = FieldValue.delete();
    else if (esMapa(v)) {
      const aqui = podar || (raiz && k === "translations");
      const dentro = convertir(v, aqui, false);
      if (!aqui || Object.keys(dentro).length) out[k] = dentro;
    } else out[k] = v;
  }
  return out;
}

function esMapa(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
}
