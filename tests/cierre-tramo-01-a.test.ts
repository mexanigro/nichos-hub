// CIERRE-TRAMO-01 · copia promovida (AUDITORIA-01, 2026-10-05, D-232) de tests/orden/cierre-tramo-01/a.test.ts: A1 (H). La orden quedó
// aprobada por Liam el 2026-10-04 (T 6503410 · H 7e41eae) y su carpeta está congelada; esto es la copia editable que corre `npm test`.
// Recorte (D-232, como las copias de E2E-01, D-104/D-112): una copia promovida no sale a la red ni a Firestore, así que queda SÓLO la
// condición del árbol de A1, escrita para que siga siendo cierta después de la próxima carga: la `carga.fixtureT` de cada web en
// `tests/e2e-01-webs.json` es un commit de T que contiene cierre-tramo-01. No se fija `carga.orden`, que la próxima orden con D2 cambia.
// La comparación de cada `config/{id}` con el tenant de su plantilla (Firestore y los bytes de Storage) queda en la orden congelada:
// `rojo-verde --orden cierre-tramo-01`.
// Sólo en H (inciso n). Lee el registro de H y el git de T por ruta fija; no escribe nada.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ORDEN, PALETAS, RAIZ_T, WEBS, desciende, registro, rojoDe } from "./orden/cierre-tramo-01/_comun.ts";

test("las dos webs de prueba declaran una carga de un fixture de T que contiene cierre-tramo-01: `tests/e2e-01-webs.json` declara para cada una `carga.fixtureT`, un commit de T que desciende del rojo de cierre-tramo-01", () => {
  const webs = registro().webs;
  const rojoT = rojoDe(RAIZ_T, ORDEN);
  assert.ok(rojoT, `precondición: T tiene el commit rojo de ${ORDEN}`);
  for (const p of PALETAS) {
    const w = webs.find((x) => x.paleta === p);
    assert.ok(w, `precondición: ${WEBS} declara la web ${p}`);
    assert.ok(w!.carga?.fixtureT && desciende(RAIZ_T, rojoT, w!.carga.fixtureT), `${WEBS}: la carga de la web ${p} es la del fixture de un commit de T que contiene ${ORDEN} (fixtureT ${w!.carga?.fixtureT})`);
  }
});
