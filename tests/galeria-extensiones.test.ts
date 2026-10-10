// La galería de peluquería tiene un tipo «extensiones» (Liam, 2026-10-10, web de Maestro: orden «Tipo extensiones») · guard.
//
// Por qué existe. Los tipos de una pieza eran los seis del brief (color · rizos · liso · recogidos · novia · cortes). En Maestro, que se
// especializa en extensiones, las dos piezas de extensiones quedaban bajo «liso» («החלקה / Straight» en el filtro de /galeria).
// T suma «extensiones» al final de `GALLERY_TYPES` (src/lib/gallery.ts, con su etiqueta en los cuatro locales); acá, el validador y la
// casilla de galería (que lista `GALLERY_TYPES` del validador) la aceptan y la ofrecen.
//
// Qué vigila, en las dos direcciones: (1) `GALLERY_TYPES` del validador = los seis del brief en su orden + «extensiones» al final; (2) `validateConfig` no da error por una pieza «extensiones» y sí por un tipo que no existe; (3) la casilla arma su select
// desde `GALLERY_TYPES`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GALLERY_TYPES, validateConfig } from "../src/lib/config-validator.ts";

const SRC = "https://firebasestorage.googleapis.com/v0/b/x/o/clients%2Fx%2Fmedia%2Fgallery%2Fgaleria-1.png?alt=media&token=abc";
const cfg = (type: string) => ({ gallery: [SRC], sections: { gallery: { items: [{ id: "g-1", src: SRC, type, alt: "x" }] } } });
const errTipo = (type: string) => validateConfig(cfg(type) as never).filter((i) => i.severity === "error" && /\.type$/.test(i.path));

test("(1) GALLERY_TYPES = los seis del brief + «extensiones» al final", () => {
  assert.deepEqual([...GALLERY_TYPES], ["color", "rizos", "liso", "recogidos", "novia", "cortes", "extensiones"]);
});

test("(2) el validador acepta «extensiones» y sigue rechazando un tipo inexistente", () => {
  assert.deepEqual(errTipo("extensiones"), [], "una pieza «extensiones» no da error");
  assert.ok(errTipo("pelucas").length > 0, "un tipo que no existe sigue dando error");
});

test("(3) la casilla de galería arma el select de tipo desde GALLERY_TYPES", () => {
  const src = readFileSync("src/components/config-editors/gallery-editor.tsx", "utf8");
  assert.match(src, /import \{ GALLERY_TYPES \} from "@\/lib\/config-validator"/);
  assert.match(src, /\{GALLERY_TYPES\.map\(\(v\) => \(/);
});
