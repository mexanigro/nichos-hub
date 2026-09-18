import test from "node:test";
import assert from "node:assert/strict";
import { validateVariantContracts } from "./config-validator.ts";

const paths = (cfg: unknown) => validateVariantContracts(cfg).map((i) => i.path);

test("contratos: no actúan fuera de hero v6 / services v6", () => {
  assert.deepEqual(paths({ hero: { variant: "v1", eyebrow: "a b c d e f" }, sections: { services: { variant: "v3" } }, services: [{ id: "x", name: "a b c d e f g" }] }), []);
});

test("hero v6: eyebrow > 4, titular fuera de 2–6, frase > 12, CTA > 2, vídeo sin póster ni retrato", () => {
  const p = paths({
    hero: { variant: "v6", eyebrow: "uno dos tres cuatro cinco", titlePrefix: "a", titleHighlight: "b c d e", titleSuffix: "f g", subtitle: "1 2 3 4 5 6 7 8 9 10 11 12 13", ctaPrimary: "a b c", ctaSecondary: "ok", video: { mp4: "/x.mp4" } },
  });
  for (const k of ["hero.eyebrow", "hero.titlePrefix", "hero.subtitle", "hero.ctaPrimary", "hero.video.poster", "hero.video.portrait"]) assert.ok(p.includes(k), k);
  assert.ok(!p.includes("hero.ctaSecondary"));
});

test("hero v6 dentro del contrato: sin avisos", () => {
  assert.deepEqual(paths({ hero: { variant: "v6", eyebrow: "מספרה לנשים", titlePrefix: "הסטודיו", titleHighlight: "לשיער שלך", titleSuffix: "ברמת גן", subtitle: "a b c", ctaPrimary: "לקביעת תור", ctaSecondary: "וואטסאפ", video: { mp4: "/a.mp4", poster: "/a.avif", portrait: { mp4: "/v.mp4" } } } }), []);
});

test("services v6: destacada sin foto, primera oración > 12, priceMax < price, consulta sin teléfono, nombre > 5", () => {
  const p = paths({
    contact: {},
    sections: { services: { variant: "v6", images: ["/a.jpg", ""] } },
    services: [
      { id: "a", name: "uno dos tres cuatro cinco seis", description: "1 2 3 4 5 6 7 8 9 10 11 12 13. Corta.", price: 100, priceMax: 50, mode: "reserva" },
      { id: "b", name: "b", description: "Corta. 1 2 3 4 5 6 7 8 9 10 11 12 13 14", price: 100, mode: "consulta" },
    ],
  });
  for (const k of ["services[0].name", "services[0].description", "services[0].priceMax", "services[1].mode", "sections.services.images[1]"]) assert.ok(p.includes(k), k);
  assert.ok(!p.includes("services[1].description"), "la primera oración corta pasa aunque la segunda sea larga");
  assert.ok(!p.includes("sections.services.images[0]"));
});
