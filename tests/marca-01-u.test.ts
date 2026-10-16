// MARCA-01 · copia promovida (CRM-03, 2026-10-16, D-312) de tests/orden/marca-01/u.test.ts. La orden quedó aprobada por Liam
// el 2026-10-08 (T 96bceb2 · H 17fd18b) y su carpeta está congelada; esto es la copia editable que corre `npm test`.
// Recorte: sin la huella de la guía (Liam la edita por consola, como la copia de VENTA-01 G1): el registro la nombra por su ruta y la sección dice lo que tiene que decir.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { GUIA, existe, fuente, seccionDeTexto } from "./orden/marca-01/_comun.ts";

const REGISTRO = "tests/marca-01-guia.json";

test("la guía de una web nueva tiene la sección «El material en su paleta» con el comando de cada paso y su paso obligatorio antes del Redeploy pide «todo el material PASA» (la copia de U1, sin la huella: Liam edita la guía por consola)", () => {
  assert.ok(existe(REGISTRO), `falta ${REGISTRO} (D-295): el árbol de H no ata la guía`);
  const reg = JSON.parse(fuente(REGISTRO)) as { guia?: string };
  assert.equal(reg.guia, GUIA, `${REGISTRO} nombra la guía por su ruta fija`);
  assert.ok(existsSync(GUIA), `existe ${GUIA}`);

  const guia = readFileSync(GUIA, "utf8");
  const sec = seccionDeTexto(guia, "El material en su paleta");
  assert.ok(sec, "la guía tiene la sección «## El material en su paleta»");
  for (const c of ["scripts/material.ts pedidos", "tools/material/graduar.mjs", "--fotos", "scripts/material.ts subir", "scripts/material.ts aprobar", "local.jpg"]) assert.ok(sec.includes(c), `la sección nombra «${c}»`);
  assert.match(sec, /una conversaci[oó]n (nueva )?(de ChatGPT )?por foto/i, "la sección pide una conversación de ChatGPT por foto");
  const i = guia.search(/^### 7 · PASO OBLIGATORIO/m);
  assert.ok(i >= 0, "la guía tiene su paso «### 7 · PASO OBLIGATORIO antes del Redeploy»");
  const resto = guia.slice(i + 4), paso = resto.slice(0, Math.max(0, resto.search(/^#{2,3} /m)) || resto.length);
  assert.ok(paso.includes("todo el material PASA"), "el paso obligatorio antes del Redeploy pide «todo el material PASA»");
});
