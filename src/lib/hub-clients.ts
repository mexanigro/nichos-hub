/**
 * ARREGLOS-01 (2026-09-25, D-111) · resolver un cliente de `hub_clients` por lo que venga en la url.
 *
 * La ficha se abre con dos cosas distintas: el **id del documento** (lo que usa el listado, y con lo que escriben el PATCH y el
 * DELETE) y el **`clientId`** —el slug de la web, el que está en la url pública y el que el hub escribe en `config/{id}`—. Hasta
 * esta orden `/api/clients/[clientId]` sólo sabía lo primero: con el slug devolvía 404 y la ficha reventaba al leer
 * `data.client.clientId` sobre el objeto de error.
 *
 * Primero el id del documento (una lectura, el caso de siempre) y sólo si no está, una consulta por el campo `clientId`.
 * Dependencias inyectables como en `media-upload.ts` (`BucketMinimo`): así se prueba con una colección en memoria, sin Firestore.
 * Importable con `node --experimental-strip-types` (import relativo con extensión, sin alias `@/`) y sin inicializar Firebase al
 * importarse: la colección real se toma sólo al llamar sin `deps`.
 */
import { db } from "./firebase-admin.ts";

/** Forma mínima de una colección de Firestore que usa `buscarClienteHub`. */
export type ColeccionMinima = {
  doc(id: string): { get(): Promise<{ exists: boolean; id: string; data(): Record<string, unknown> | undefined }> };
  where(campo: string, op: string, valor: unknown): {
    limit(n: number): { get(): Promise<{ empty: boolean; docs: Array<{ id: string; data(): Record<string, unknown> | undefined }> }> };
  };
};

export type ClienteHub = { id: string; data: Record<string, unknown> };

export async function buscarClienteHub(
  id: string,
  deps: { coleccion: ColeccionMinima } = { coleccion: db.collection("hub_clients") as unknown as ColeccionMinima },
): Promise<ClienteHub | undefined> {
  if (!id) return undefined;
  const doc = await deps.coleccion.doc(id).get();
  if (doc.exists) return { id: doc.id, data: doc.data() ?? {} };
  const q = await deps.coleccion.where("clientId", "==", id).limit(1).get();
  if (q.empty || !q.docs.length) return undefined;
  const hit = q.docs[0];
  return { id: hit.id, data: hit.data() ?? {} };
}
