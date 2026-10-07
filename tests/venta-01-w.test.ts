// VENTA-01 · copia promovida (SECCIONES-02, 2026-10-07, D-281) de tests/orden/venta-01/w.test.ts. La orden quedó aprobada por Liam
// el 2026-10-06 (T 3222922 · H fa5674e) y su carpeta está congelada; esto es la copia editable que corre `npm test`.
// Recorte (D-281): SÓLO el registro del árbol (tests/venta-01-demo.json). Lo guardado en Firestore, el estado del deployment y las
// variables en Vercel, y el HTML que sirve la web los mira la orden congelada (`rojo-verde --orden venta-01`, marca «, webs»): una
// copia promovida no sale a la red.
// VENTA-01 · W1 (H) · el Redeploy de la demo de PLANTILLA-01 sirve el link con su nombre (D-268, D-271).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AJENO, DEMO, ROOT, existe, type Cfg } from "./orden/venta-01/_comun.ts";

const REGISTRO = "tests/venta-01-demo.json";
const VARIABLES = ["VITE_BRAND_DESCRIPTION", "VITE_BRAND_NAME", "VITE_BRAND_TAGLINE", "VITE_OG_IMAGE"];

test("el registro del árbol de W1: tests/venta-01-demo.json declara el Redeploy de la demo de PLANTILLA-01 (demo-demo-plantilla-a-f87b89e8) —su deployment, el commit de T, las cuatro variables del link y lo que sirvió: un title y un og:title con su nombre y su línea y un og:image en el Storage de la demo, sin «Studio Noa» ni Ramat Gan en ningún idioma—", () => {
  assert.ok(existe(REGISTRO), `falta ${REGISTRO}: la demo no se redesplegó con su nombre (D-268)`);
  const r = JSON.parse(readFileSync(resolve(ROOT, REGISTRO), "utf8")) as Cfg;
  assert.equal(r.orden, "venta-01", "el registro es de VENTA-01");
  assert.equal(r.clientId, DEMO, `el registro es de la demo de PLANTILLA-01 (${DEMO})`);
  assert.match(String(r.deploymentId ?? ""), /^dpl_/, "el registro declara el deployment del Redeploy");
  assert.match(String(r.tCommit ?? ""), /^[0-9a-f]{7,40}$/, "el commit de T desplegado");
  const m = (r.medido ?? {}) as Cfg;
  assert.deepEqual([...(m.variables ?? [])].sort(), VARIABLES, "las cuatro variables del link");
  assert.match(String(m.deployment ?? ""), /^READY · target production/, "el deployment quedó READY en producción");
  assert.ok(String(m.title ?? "").trim() && m.title === m.ogTitle, "title y og:title, iguales y con texto");
  assert.ok(String(m.ogDescription ?? "").trim(), "og:description con texto");
  assert.match(String(m.ogImage ?? ""), new RegExp(`^https://firebasestorage\\.googleapis\\.com/v0/b/[^/]+/o/clients%2F${DEMO}%2F`), "og:image en el Storage de la demo");
  for (const ajeno of AJENO) for (const k of ["title", "ogTitle", "ogDescription"]) assert.ok(!String(m[k]).includes(ajeno), `${k} no dice «${ajeno}»`);
});
