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

test("hero v6 dentro del contrato: sin avisos (CONEXION-02: hero.video.* en https://, una ruta local es error)", () => {
  assert.deepEqual(paths({ hero: { variant: "v6", eyebrow: "מספרה לנשים", titlePrefix: "הסטודיו", titleHighlight: "לשיער שלך", titleSuffix: "ברמת גן", subtitle: "a b c", ctaPrimary: "לקביעת תור", ctaSecondary: "וואטסאפ", video: { mp4: "https://s/a.mp4", poster: "https://s/a.avif", portrait: { mp4: "https://s/v.mp4" } } } }), []);
});

test("services v6: destacada sin foto, primera oración > 12, priceMax < price, consulta sin teléfono, nombre > 5", () => {
  const p = paths({
    contact: {},
    sections: { services: { variant: "v6", images: ["https://s/a.jpg", ""] } },
    services: [
      { id: "a", name: "uno dos tres cuatro cinco seis", description: "1 2 3 4 5 6 7 8 9 10 11 12 13. Corta.", price: 100, priceMax: 50, mode: "reserva" },
      { id: "b", name: "b", description: "Corta. 1 2 3 4 5 6 7 8 9 10 11 12 13 14", price: 100, mode: "consulta" },
    ],
  });
  for (const k of ["services[0].name", "services[0].description", "services[0].priceMax", "services[1].mode", "sections.services.images[1]"]) assert.ok(p.includes(k), k);
  assert.ok(!p.includes("services[1].description"), "la primera oración corta pasa aunque la segunda sea larga");
  assert.ok(!p.includes("sections.services.images[0]"));
});

// CONEXION-03 (2026-09-22): la foto de un servicio vive en Storage — una ruta local es error, no aviso (como hero.video.*).
test("services v6: una foto local en sections.services.images[i] es error; la casilla vacía no", () => {
  const cfg = { sections: { services: { variant: "v6", images: ["/dev-fixtures/media/paleta-a/servicio-1.jpg", ""] } }, services: [{ id: "a", name: "a", price: 10 }, { id: "b", name: "b", price: 20 }] };
  const errores = validateVariantContracts(cfg).filter((i) => i.severity === "error");
  assert.deepEqual(errores.map((i) => i.path), ["sections.services.images[0]"]);
  assert.ok(errores[0].message.includes("producción no sirve rutas locales"));
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
  for (const k of ["error:sections.services.featured", "error:sections.gallery.selection", "warning:sections.gallery.selection", "warning:branding.localPhotoMobile", "error:sections.team.surface", "error:sections.services.veil", "warning:sections.faq.veil"]) assert.ok(p.includes(k), k);
  // CONEXION-09 (D-91): con vídeo del hero y foto del local pero SIN la relación ya no se avisa nada. D-90 la dejó sin casilla en el
  // hub y el navegador del hub no puede leer los píxeles de Storage: nadie puede escribirla desde aquí, y un aviso sin acción es ruido.
  assert.deepEqual(p.filter((k) => k.endsWith(":branding.heroToBackdrop")), [], "sin heroToBackdrop no hay aviso (D-91)");
  assert.ok(rp({ services: [{ id: "cut" }, { id: "color" }], sections: { services: { featured: ["cut", "cut"] } } }).includes("error:sections.services.featured"), "duplicado");
  assert.deepEqual(rp({ services: [{ id: "cut" }, { id: "color" }], sections: { services: { featured: ["cut", "color"] } } }), [], "dos ids existentes: sin avisos");
  // CONEXION-03 (D-41): featured es orden, no cantidad — una lista de 1 o de 3 ids existentes ya no avisa.
  for (const featured of [["cut"], ["cut", "color", "bride"]]) assert.deepEqual(rp({ services: [{ id: "cut" }, { id: "color" }, { id: "bride" }], sections: { services: { featured } } }), [], `featured con ${featured.length} ids: sin avisos`);
});

test("galeria-04: items con tipo del brief, ids únicos, serviceId existente; selection por id", () => {
  const base = { services: [{ id: "cut" }, { id: "color" }], gallery: ["/1.jpg"] };
  const p = rp({ ...base, sections: { gallery: { items: [{ id: "a", src: "/a.jpg", type: "novia", serviceId: "nope" }, { id: "a", src: "/b.jpg", type: "rosa" }, { src: "/c.jpg" }], selection: ["a", "zz", 0] } } });
  for (const k of ["error:sections.gallery.items[0].serviceId", "error:sections.gallery.items[1].id", "error:sections.gallery.items[1].type", "error:sections.gallery.items[2]", "error:sections.gallery.selection"]) assert.ok(p.includes(k), k + " en " + JSON.stringify(p));
  assert.ok(rp({ ...base, sections: { gallery: { items: [{ id: "a", src: "/a.jpg" }, { id: "b", src: "/b.jpg" }] } } }).includes("warning:sections.gallery.items"), "< 3 piezas avisa");
  assert.ok(rp({ ...base, sections: { gallery: { items: [{ id: "a", src: "/a.jpg" }, { id: "b", src: "/b.jpg" }, { id: "c", src: "/c.jpg" }, { id: "d", src: "/d.jpg" }], selection: ["a", "b", "c", "c"] } } }).includes("error:sections.gallery.selection"), "id repetido");
  // CONEXION-04 (B2): dentro del contrato, las `src` son https:// y `gallery[]` de la raíz va en sincronía con `items[].src` (D-49).
  const ok4 = [{ id: "a", src: "https://s/a.jpg", type: "color", serviceId: "color", alt: "x" }, { id: "b", src: "https://s/b.jpg", type: "cortes", serviceId: "cut", alt: "y" }, { id: "c", src: "https://s/c.jpg", alt: "z" }, { id: "d", src: "https://s/d.jpg", alt: "w" }];
  const alts = { a: "A", b: "B", c: "C", d: "D" };
  assert.deepEqual(rp({ ...base, gallery: ok4.map((it) => it.src), sections: { gallery: { items: ok4, selection: ["d", "c", "b", "a"] } }, translations: { en: { sections: { gallery: { alts } } }, ru: { sections: { gallery: { alts } } }, ar: { sections: { gallery: { alts } } } } }), [], "dentro del contrato: sin avisos");
  // GALERIA-05 A2: alt obligatorio en el idioma base; en otro idioma por translations[lang].sections.gallery.alts (falta → warning)
  const sinAlt = rp({ ...base, sections: { gallery: { items: ok4.map((it, i) => (i === 1 ? { ...it, alt: " " } : it)) } }, translations: { en: { sections: { gallery: { alts: { a: "A", b: "B", c: "C" } } } } } });
  assert.ok(sinAlt.includes("error:sections.gallery.items[1].alt"), "alt vacío → error: " + JSON.stringify(sinAlt));
  assert.ok(sinAlt.includes("warning:translations.en.sections.gallery.alts.d"), "falta el alt de d en en → warning");
  assert.deepEqual(rp({ ...base, gallery: ["/1.jpg", "/2.jpg", "/3.jpg", "/4.jpg"], sections: { gallery: { selection: [0, 1, 2, 3] } } }), [], "sin items: selection por índice sigue valiendo");
});

test("replanteo: dentro del contrato, sin avisos (CONEXION-05: branding.texture/localPhoto/localPhotoMobile en https://, una ruta local es error)", () => {
  assert.deepEqual(rp({
    services: [{ id: "cut" }, { id: "color" }, { id: "x" }],
    gallery: ["/1.jpg", "/2.jpg", "/3.jpg", "/4.jpg", "/5.jpg"],
    hero: { video: { mp4: "/h.mp4" } },
    branding: { localPhoto: "https://s/local.jpg", localPhotoMobile: "https://s/local-v.jpg", heroToBackdrop: { relation: "adjacent-hue", mechanism: "veil-from-first-pixel", dH: 20, dL: 0.05 } },
    sections: { services: { featured: ["color", "cut"], surface: "velo", veil: 0.65 }, gallery: { selection: [0, 1, 2, 3], surface: "liso" } },
  }), []);
});

// REPLANTEO-02 (2026-09-19): branding.mode (D17), branding.texture (R21), surface "textura", heroToBackdrop.foot (R20).
test("replanteo-02: mode light|dark, texture URL, surface textura, foot con hex", () => {
  const bad = rp({ branding: { mode: "auto", texture: 3, heroToBackdrop: { relation: "same-hue", mechanism: "veil-from-first-pixel", foot: { hex: "gris" } } }, sections: { gallery: { surface: "liso" } } });
  for (const k of ["error:branding.mode", "error:branding.texture", "error:branding.heroToBackdrop.foot"]) assert.ok(bad.includes(k), k);
  assert.ok(!bad.includes("error:sections.gallery.surface"), "liso sigue admitido como histórico");
  assert.deepEqual(rp({ branding: { mode: "dark", texture: "https://s/t.jpg", heroToBackdrop: { relation: "adjacent-hue", mechanism: "scrim-dies-into-photo", foot: { hex: "#413c37", L: 0.36, C: 0.01, H: 66 } } }, sections: { gallery: { surface: "textura" }, services: { surface: "velo", veil: 0.65 } } }), []);
});
