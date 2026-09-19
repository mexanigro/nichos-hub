import test from "node:test";
import assert from "node:assert/strict";
import { validateVariantContracts, validateReplanteoHuecos } from "./config-validator.ts";

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

// REPLANTEO-01 (2026-09-19): huecos nuevos sin UI — featured, selection, foto del local, velo/liso, heroToBackdrop.
const rp = (cfg: unknown) => validateReplanteoHuecos(cfg).map((i) => `${i.severity}:${i.path}`);

test("replanteo: sin los campos nuevos no actúa", () => {
  assert.deepEqual(rp({ services: [{ id: "cut" }], gallery: ["/1.jpg"], sections: { services: { surface: "alt" } } }), []);
});

test("replanteo: featured (2 ids existentes), selection (4–6 índices existentes), foto del local en par, velo/liso, heroToBackdrop", () => {
  const p = rp({
    services: [{ id: "cut" }, { id: "color" }],
    gallery: ["/1.jpg", "/2.jpg", "/3.jpg"],
    hero: { video: { mp4: "/h.mp4" } },
    branding: { localPhoto: "/local.jpg" },
    sections: { services: { featured: ["cut", "nope", "color"], surface: "velo", veil: 1.5 }, gallery: { selection: [0, 7] }, team: { surface: "oscuro" }, faq: { veil: 0.8 } },
  });
  for (const k of ["error:sections.services.featured", "warning:sections.services.featured", "error:sections.gallery.selection", "warning:sections.gallery.selection", "warning:branding.localPhotoMobile", "warning:branding.heroToBackdrop", "error:sections.team.surface", "error:sections.services.veil", "warning:sections.faq.veil"]) assert.ok(p.includes(k), k);
  assert.ok(rp({ services: [{ id: "cut" }, { id: "color" }], sections: { services: { featured: ["cut", "cut"] } } }).includes("error:sections.services.featured"), "duplicado");
  assert.deepEqual(rp({ services: [{ id: "cut" }, { id: "color" }], sections: { services: { featured: ["cut", "color"] } } }), [], "dos ids existentes: sin avisos");
});

test("replanteo: dentro del contrato, sin avisos", () => {
  assert.deepEqual(rp({
    services: [{ id: "cut" }, { id: "color" }, { id: "x" }],
    gallery: ["/1.jpg", "/2.jpg", "/3.jpg", "/4.jpg", "/5.jpg"],
    hero: { video: { mp4: "/h.mp4" } },
    branding: { localPhoto: "/local.jpg", localPhotoMobile: "/local-v.jpg", heroToBackdrop: { relation: "adjacent-hue", mechanism: "veil-from-first-pixel", dH: 20, dL: 0.05 } },
    sections: { services: { featured: ["color", "cut"], surface: "velo", veil: 0.65 }, gallery: { selection: [0, 1, 2, 3], surface: "liso" } },
  }), []);
});
