// PLANTILLA-01 · copia promovida (VENTA-01, 2026-10-06, D-270) de tests/orden/plantilla-01/h.test.ts. La orden quedó aprobada por
// Liam el 2026-10-06 (T 3222922 · H 96cef4b) y su carpeta está congelada; esto es la copia editable que corre `npm test`.
// Recorte: entera (ninguna de sus afirmaciones sale a la red: Firestore y Storage en memoria, el cliente de Anthropic falso).
// PLANTILLA-01 · H1 (H) · ninguna web de una clienta sale con equipo o reseñas que no son de ella (inciso z, D-263). Sesión A2
// (2026-10-05): test rojo.
//
// Medido por A2: el alta le pone a un cliente de peluquería el equipo del preset (`H src/lib/provisioning.ts:71`, `staff: preset.staff`:
// Noa Levi, Maya Cohen y Dana Mizrahi, con fotos de Unsplash) y ninguna reseña; sin `testimonials` en el config, la página de T cae a las
// tres del preset (`T src/config/site.ts:209`, `mergeDeep` salta lo ausente) porque `features.showTestimonials` nace en true
// (`H src/lib/niche-defaults.ts:21`). Y el equipo no se ve sólo en su sección: la reserva lo lista en «elegir profesional»
// (`T src/components/booking/BookingWizard.tsx:47,81`, `T src/services/db.ts:258`), así que ocultar la sección no lo saca de la web.
// Liam (2026-10-05): para el equipo, el aviso pide sólo cargar lo real; para las reseñas, cargar las reales u ocultar la sección.
// `avisosDePreset(config, niche)` (H src/lib/avisos-preset.ts) da los avisos; desde-plantilla (en seco y aplicado) y `aplicarTextos` (en
// seco y aplicado) los devuelven en su salida, y las dos consolas los imprimen. El aviso NO bloquea la escritura (lo que bloquea publicar es
// la guía y el juicio de Liam).
// Caja negra: funciones de H por `import()` dinámico con un Firestore y un Storage EN MEMORIA; lectura de los dos scripts. Sólo en H.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CLIENTE, HUB_DOC, clienteDeAlta, dbFalsa, existe, fuente, importarModulo, mundo, porJson, type Cfg } from "./orden/plantilla-01/_comun.ts";

const MODULO = "src/lib/avisos-preset.ts";
type Aviso = { seccion: string; message: string };

/** Un equipo y unas reseñas propios de la clienta (ids, slugs y nombres que no son del preset). */
const EQUIPO = [{ id: "rut", slug: "rut-ben-david", name: "רות בן דוד", specialty: "צבע", bio: "צבעית ותיקה.", photoUrl: "https://example.com/rut.jpg" }];
const RESENAS = [{ id: "r1", name: "לקוחה", text: "שירות נהדר ואווירה טובה", rating: 5, lang: "he" }];

test("avisosDePreset da un aviso de equipo cuando el equipo falta o tiene una persona del preset —aunque la sección esté oculta, porque la reserva la lista— y uno de reseñas cuando faltan con la sección a la vista; cada aviso nombra su sección y su salida (equipo: cargarlo por la casilla, que ocultar no lo saca de la reserva; reseñas: cargarlas por la casilla u ocultar la sección con features.showTestimonials en false); con equipo y reseñas propios, o sin reseñas y la sección oculta, no hay aviso; desde-plantilla, en seco y aplicado, y aplicar, en seco y aplicado, devuelven esos avisos y escriben igual; y las dos consolas los imprimen", async () => {
  assert.ok(existe(MODULO), `falta ${MODULO} (D-263): hoy nadie avisa que la web sale con el equipo del preset y las reseñas del preset`);
  const { avisosDePreset } = await importarModulo(MODULO);
  assert.equal(typeof avisosDePreset, "function", `${MODULO} exporta avisosDePreset`);
  const alta = (await clienteDeAlta()).config;
  const { getNichePreset } = await importarModulo("src/lib/client-config/niche-presets.ts");
  const preset = getNichePreset("peluqueria").staff as Cfg[];
  assert.deepEqual(alta.staff.map((s: Cfg) => s.slug), preset.map((s) => s.slug), "precondición (medido): el alta le pone al cliente el equipo del preset");

  const con = (cambio: Cfg) => ({ ...porJson(alta), ...cambio, features: { ...alta.features, ...(cambio.features ?? {}) } });
  const secciones = (c: Cfg) => (avisosDePreset(c, "peluqueria") as Aviso[]).map((a) => a.seccion).sort();
  // (1) Las dos direcciones.
  const casos: [string, Cfg, string[]][] = [
    ["recién dado de alta: equipo del preset y sin reseñas", con({ testimonials: undefined }), ["equipo", "reseñas"]],
    ["equipo y reseñas propios", con({ staff: EQUIPO, testimonials: RESENAS }), []],
    ["equipo propio, sin reseñas y la sección de reseñas oculta", con({ staff: EQUIPO, testimonials: undefined, features: { showTestimonials: false } }), []],
    ["equipo propio, sin reseñas y la sección a la vista", con({ staff: EQUIPO, testimonials: undefined }), ["reseñas"]],
    ["equipo propio, lista de reseñas vacía y la sección a la vista", con({ staff: EQUIPO, testimonials: [] }), ["reseñas"]],
    ["una persona del preset entre las propias", con({ staff: [...EQUIPO, preset[1]], testimonials: RESENAS }), ["equipo"]],
    ["equipo del preset con la sección oculta (la reserva lo sigue listando)", con({ testimonials: RESENAS, features: { showTeam: false, showAbout: false } }), ["equipo"]],
    ["sin equipo (la página y la reserva caen al preset)", con({ staff: undefined, testimonials: RESENAS }), ["equipo"]],
  ];
  for (const [que, c, esperado] of casos) assert.deepEqual(secciones(porJson(c)), esperado, `${que}: avisos ${JSON.stringify(esperado)}`);
  // (2) Qué dice cada aviso.
  const avisos = avisosDePreset(porJson(con({ testimonials: undefined })), "peluqueria") as Aviso[];
  const equipo = avisos.find((a) => a.seccion === "equipo")!, resenas = avisos.find((a) => a.seccion === "reseñas")!;
  assert.match(equipo.message, /casilla/i, "el aviso de equipo dice que se carga por la casilla");
  assert.match(equipo.message, /reserva/i, "y que ocultar la sección no lo saca de la reserva");
  assert.ok(preset.some((p) => equipo.message.includes(p.name)), "y nombra a la persona del preset que está a la vista");
  assert.match(resenas.message, /casilla/i, "el aviso de reseñas dice que se cargan por la casilla");
  assert.match(resenas.message, /features\.showTestimonials/, "o que se oculta la sección con features.showTestimonials en false");

  // (3) desde-plantilla: en seco y aplicado, con el cliente recién dado de alta (equipo del preset) y con uno con lo suyo.
  // MARCA-01 (D-289): desde-plantilla suma además un aviso «material» por cada hueco copiado de la plantilla; aquí se miran los de
  // equipo y reseñas (los de material los vigila la orden marca-01, D2).
  const dePreset = (avisos: Aviso[] | undefined) => (avisos ?? []).filter((a) => (a.seccion as string) !== "material");
  const { desdePlantilla } = await importarModulo("src/lib/desde-plantilla.ts");
  for (const aplicar of [false, true]) {
    const w = await mundo();
    const r = await desdePlantilla({ clientId: CLIENTE, plantilla: "a", aplicar }, { db: w.db, bucket: w.bucket });
    assert.deepEqual(dePreset(r.avisos as Aviso[]).map((a) => a.seccion).sort(), ["equipo"], `desde-plantilla ${aplicar ? "aplicado" : "en seco"}: avisa el equipo del preset (el cliente de alta tiene una reseña propia)`);
    assert.equal(r.escrito, aplicar, `desde-plantilla ${aplicar ? "aplicado" : "en seco"}: el aviso no cambia si escribe`);
    const w2 = await mundo();
    const antes = w2.inicial[`config/${CLIENTE}`];
    const propio = { ...antes, staff: EQUIPO, translations: { en: { testimonials: antes.translations.en.testimonials } } };
    const w3 = await dbFalsa({ ...w2.inicial, [`config/${CLIENTE}`]: propio });
    const r2 = await desdePlantilla({ clientId: CLIENTE, plantilla: "a", aplicar }, { db: w3.db, bucket: w2.bucket });
    assert.deepEqual(dePreset(r2.avisos as Aviso[]), [], `desde-plantilla ${aplicar ? "aplicado" : "en seco"}: con equipo y reseñas propios, ningún aviso`);
  }

  // (4) aplicar (la consola de textos): en seco y aplicado.
  const { aplicarTextos } = await importarModulo("src/lib/textos-consola.ts");
  const hub = (await clienteDeAlta()).hub;
  for (const aplicar of [false, true]) {
    const w = await dbFalsa({ [`config/${CLIENTE}`]: con({ testimonials: undefined }), [`hub_clients/${HUB_DOC}`]: hub });
    const r = await aplicarTextos({ clientId: CLIENTE, propuesta: { en: { "brand.tagline": "Colour and curls, calmly" } }, aplicar }, { db: w.db });
    assert.deepEqual(((r.avisos ?? []) as Aviso[]).map((a) => a.seccion).sort(), ["equipo", "reseñas"], `aplicar ${aplicar ? "aplicado" : "en seco"}: avisa el equipo y las reseñas del preset`);
    assert.equal(w.escrituras.length, aplicar ? 1 : 0, `aplicar ${aplicar ? "aplicado" : "en seco"}: el aviso no bloquea la escritura`);
    const w2 = await dbFalsa({ [`config/${CLIENTE}`]: con({ staff: EQUIPO, testimonials: RESENAS }), [`hub_clients/${HUB_DOC}`]: hub });
    const r2 = await aplicarTextos({ clientId: CLIENTE, propuesta: { en: { "brand.tagline": "Colour and curls, calmly" } }, aplicar }, { db: w2.db });
    assert.deepEqual(r2.avisos ?? [], [], `aplicar ${aplicar ? "aplicado" : "en seco"}: con equipo y reseñas propios, ningún aviso`);
  }

  // (5) Las consolas los imprimen.
  for (const s of ["scripts/desde-plantilla.ts", "scripts/textos.ts"]) {
    assert.ok(existe(s), `falta ${s}`);
    assert.match(fuente(s), /avisos/, `${s} imprime los avisos`);
  }
});
