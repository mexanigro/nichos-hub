// MARCA-01 · Instagram sigue a la galería también por el CONTENIDO (sesión B, 2026-10-07). I1 de la orden vigila la misma ruta con
// cualquier token; la web de Yulia tiene sus 6 fotos de Instagram en archivos propios con los mismos bytes que su galería (las resubió
// a mano, `DEMOS-ASHKELON.md` § 1): el token es el sha256 del contenido (D-22), así que el mismo token es la misma foto y la sigue.
// En las dos direcciones: el mismo contenido en otro archivo sigue; otro contenido en otro archivo, no.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CLIENTE, importarModulo, urlDe, type Cfg } from "./orden/marca-01/_comun.ts";

test("instagramSigueA lleva a la url nueva la foto de Instagram que tiene el mismo contenido que la pieza vieja en otro archivo, y no la de otro contenido", async () => {
  const { instagramSigueA } = await importarModulo("src/lib/galeria-instagram.ts");
  const P = (n: string) => `clients/${CLIENTE}/media/${n}`;
  const vieja = urlDe(P("gallery/galeria-1.jpg"), Buffer.from("la foto 1"));
  const mismaFoto = urlDe(P("images/1791-galeria-color.jpg"), Buffer.from("la foto 1"));
  const otraFoto = urlDe(P("images/1791-galeria-rizos.jpg"), Buffer.from("la foto 2"));
  const nueva = urlDe(P("gallery/galeria-1.jpg"), Buffer.from("la foto 1 graduada"));
  const config: Cfg = { sections: { instagram: { images: [mismaFoto, otraFoto] } } };
  const out = instagramSigueA(config, vieja, nueva) as Cfg;
  assert.deepEqual(out.sections.instagram.images, [nueva, otraFoto], "la del mismo contenido pasa a la url nueva; la de otro contenido queda");
  assert.deepEqual(config.sections.instagram.images, [mismaFoto, otraFoto], "no muta la entrada");
  assert.equal(instagramSigueA(config, otraFoto.replace("rizos", "x").replace(/token=[0-9a-f]+/, "token=ffff"), nueva), config, "sin ninguna que siga, devuelve el mismo objeto");
});
