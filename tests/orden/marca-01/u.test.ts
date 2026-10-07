// MARCA-01 · U1 (H) · la guía de una web nueva con los pasos del material (D-295). Sesión A (2026-10-07): test rojo — la guía no tiene
// los pasos del material y el árbol de H no la ata.
//
// La guía vive en el registro (`bloque-05/GUIA-WEB-NUEVA.md`, fuera de git): el árbol de H la ata por su sha256 en
// `tests/marca-01-guia.json` (inciso l: el rojo es del árbol), como VENTA-01 (D-269). Sólo en H.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { GUIA, existe, fuente, seccionDeTexto, sha256De } from "./_comun.ts";

const REGISTRO = "tests/marca-01-guia.json";

test("la guía de una web nueva (bloque-05/GUIA-WEB-NUEVA.md) tiene la sección «El material en su paleta» con el comando de cada paso —scripts/material.ts pedidos; tools/material/graduar.mjs para el vídeo, la textura y el local, y --fotos para un trabajo real que no pasa; una conversación de ChatGPT por foto con el pedido de la herramienta y su local.jpg adjunto; scripts/material.ts subir y scripts/material.ts aprobar—, y su paso obligatorio antes del Redeploy pide «todo el material PASA»; y tests/marca-01-guia.json del árbol guarda el sha256 de esa guía, que coincide", () => {
  assert.ok(existe(REGISTRO), `falta ${REGISTRO} (D-295): el árbol de H no ata la guía`);
  const reg = JSON.parse(fuente(REGISTRO)) as { guia?: string; sha256?: string };
  assert.equal(reg.guia, GUIA, `${REGISTRO} nombra la guía por su ruta fija`);
  assert.ok(existsSync(GUIA), `existe ${GUIA}`);
  assert.equal(sha256De(GUIA), reg.sha256, `el sha256 de la guía es el que guarda ${REGISTRO}`);

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
