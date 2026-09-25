// ARREGLOS-01 · D (H) · la ficha abre con el slug y no revienta. Sesión A (2026-09-25): tests rojos — no existe
// `src/lib/hub-clients.ts` y `page.tsx:187` sigue leyendo `data?.client.clientId`.
//
// D-111 (medido). `src/app/api/clients/[clientId]/route.ts:13` hace `db.collection("hub_clients").doc(clientId).get()`: con el
// `clientId` (el slug de la web, el que está en la url pública y el que el hub escribe en `config/{id}`) en vez del id del
// documento devuelve 404 `{ error }`. Y la página lee `data?.client.clientId` con `data` = ese objeto de error: `data.client` es
// `undefined`, la propiedad lanza, y no se llega nunca al `if (!data) return null` de `:343`.
//
// Caja negra: `buscarClienteHub` se corre con una colección EN MEMORIA (el patrón `BucketMinimo` de `media-upload.ts`), así que
// este test no toca Firestore ni la red; de la ruta y de la página se lee el fuente. Sólo en H (inciso n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { HUB_CLIENTS, PAGINA_FICHA, ROOT, RUTA_FICHA, canonico, fuente, importarModulo } from "./_comun.ts";

/** Dos documentos de `hub_clients` como los deja el alta (`provisioning.ts`): el id del documento no es el `clientId`. */
const DOCS: Record<string, Record<string, unknown>> = {
  JabrxNIt3qgPdUNrFQpr: { clientId: "demo-peluqueria-a-efd04f31", businessName: "A", status: "demo" },
  Zk9QqLmVv2bHtXs4NpWy: { clientId: "demo-peluqueria-c-1a2b3c4d", businessName: "C", status: "demo" },
};
/** Colección mínima: `doc(id).get()` y `where(campo, op, valor).limit(n).get()`, que es lo que la resolución necesita. */
function coleccionFalsa(docs = DOCS) {
  const consultas: string[] = [];
  return {
    consultas,
    coleccion: {
      doc(id: string) {
        return { async get() { consultas.push(`doc:${id}`); return { exists: Object.hasOwn(docs, id), id, data: () => docs[id] }; } };
      },
      where(campo: string, op: string, valor: unknown) {
        return {
          limit(n: number) {
            return {
              async get() {
                consultas.push(`where:${campo}${op}${String(valor)}`);
                const hits = Object.entries(docs).filter(([, d]) => d[campo] === valor).slice(0, n);
                return { empty: hits.length === 0, docs: hits.map(([id, d]) => ({ id, data: () => d })) };
              },
            };
          },
        };
      },
    },
  };
}

test("src/lib/hub-clients.ts exporta `buscarClienteHub`, que con el id del documento de `hub_clients` y con el campo `clientId` (el slug) devuelve el mismo cliente y con un id que no existe devuelve `undefined`; y /api/clients/[clientId] la usa y responde 404 con `error` cuando no hay cliente", async () => {
  // (1) El archivo y la función. Hoy no existen: aquí es donde esta orden está en rojo.
  assert.ok(existsSync(resolve(ROOT, HUB_CLIENTS)), `no existe ${HUB_CLIENTS}: la ficha sólo sabe resolver por el id del documento (D-111)`);
  const mod = await importarModulo(HUB_CLIENTS);
  assert.equal(typeof mod.buscarClienteHub, "function", `${HUB_CLIENTS} debe exportar \`buscarClienteHub(id, deps?)\` (exporta: ${Object.keys(mod).join(", ")})`);
  const buscar = mod.buscarClienteHub as (id: string, deps?: { coleccion: unknown }) => Promise<{ id: string; data: Record<string, unknown> } | undefined>;

  // (2) Por el id del documento: el mismo cliente que hoy.
  const porDoc = coleccionFalsa();
  const a = await buscar("JabrxNIt3qgPdUNrFQpr", { coleccion: porDoc.coleccion });
  assert.ok(a, "con el id del documento tiene que encontrar el cliente");
  assert.equal(a.id, "JabrxNIt3qgPdUNrFQpr", "devuelve el id del documento, que es con el que escriben el PATCH y el DELETE");
  assert.deepEqual(canonico(a.data), canonico(DOCS.JabrxNIt3qgPdUNrFQpr), "y sus datos, sin tocar");

  // (3) Por el slug: EL MISMO cliente. Esto es lo que hoy revienta la ficha.
  const porSlug = coleccionFalsa();
  const b = await buscar("demo-peluqueria-a-efd04f31", { coleccion: porSlug.coleccion });
  assert.ok(b, "con el `clientId` (el slug que está en la url pública) tiene que encontrar el MISMO cliente");
  assert.deepEqual(canonico(b), canonico(a), "el slug y el id del documento abren la misma ficha");
  assert.ok(porSlug.consultas.some((c) => c.startsWith("where:clientId")), `la resolución por slug pregunta por el campo clientId (consultas: ${porSlug.consultas.join(", ")})`);
  assert.equal(porSlug.consultas[0], "doc:demo-peluqueria-a-efd04f31", "primero el id del documento, que es el caso de siempre; la consulta por campo sólo si no está");

  // (4) Y el que no existe no es un cliente ni lanza.
  const vacio = coleccionFalsa();
  assert.equal(await buscar("no-existe-en-ningun-lado", { coleccion: vacio.coleccion }), undefined, "un id que no existe devuelve undefined, no lanza");
  const otro = coleccionFalsa();
  assert.equal(await buscar("", { coleccion: otro.coleccion }), undefined, "un id vacío tampoco es un cliente");

  // (5) La ruta la usa y sigue contestando 404 con su `error` cuando no hay cliente.
  const ruta = fuente(RUTA_FICHA);
  assert.ok(ruta.includes("buscarClienteHub"), `${RUTA_FICHA} debe resolver por ${HUB_CLIENTS}, no por \`doc(clientId).get()\` a secas`);
  assert.match(ruta, /status:\s*404/, `${RUTA_FICHA} sigue contestando 404 cuando no hay cliente`);
  assert.match(ruta, /error:\s*["'`]Cliente no encontrado/, `${RUTA_FICHA} sigue devolviendo su «Cliente no encontrado»`);
});

test("src/app/clients/[clientId]/page.tsx no lee ninguna propiedad de `client` sin `?.` y muestra «Cliente no encontrado» con el id cuando la respuesta no trae `client`, en vez de reventar", () => {
  const src = fuente(PAGINA_FICHA);

  // (1) El defecto exacto de D-111: `data?.client.` cuida el `data` y se olvida del `client`, que es el que falta en la respuesta
  //     de error. Hoy hay dos (`:187` y `:188`): aquí está el rojo.
  const sueltas = src.split(/\r?\n/).map((l, i) => [i + 1, l] as const).filter(([, l]) => /data\?\.client\./.test(l));
  assert.deepEqual(sueltas.map(([n, l]) => `${n}: ${l.trim()}`), [], "`data?.client.<x>` lanza cuando la respuesta es `{ error }`: si se encadena `data?.`, se encadena también `client?.`");

  // (2) Y la rama de error existe y nombra el id, que es lo que hace falta para saber qué ficha no abrió.
  const i = src.indexOf("Cliente no encontrado");
  assert.ok(i > 0, `${PAGINA_FICHA} debe mostrar «Cliente no encontrado» cuando la respuesta no trae \`client\` (es el mismo texto que ya devuelve la API)`);
  assert.ok(src.slice(Math.max(0, i - 400), i + 400).includes("clientId"), "…y decir de qué id se trata, cerca del mensaje");
});
