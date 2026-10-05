// IDIOMAS-01 · hallazgo de la carga (2026-09-29): un guardado de Contenido con el parche vacío mandó
// `{ translations: { en: {} } }` y Firestore, con `set(…, { merge: true })`, reemplazó la capa inglesa entera por `{}`.
// Guard de la defensa de fondo (`paraFirestore`, que usa PUT /api/config) y de Contenido. Sin Firestore: la fusión se modela
// con la regla de Firestore —fusiona mapa por mapa y un mapa vacío es una HOJA que reemplaza— y el modelo se contrasta primero
// con el defecto medido (sin `paraFirestore`, el parche vacío borra la capa).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FieldValue } from "firebase-admin/firestore";
import { paraFirestore } from "../src/lib/config-firestore.ts";

const esMapa = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const esBorrar = (v: unknown) => v instanceof FieldValue && v.isEqual(FieldValue.delete());
/** `set(data, { merge: true })` de Firestore sobre `doc`. */
function fusionar(doc: Record<string, unknown>, data: Record<string, unknown>): Record<string, unknown> {
  const out = structuredClone(doc);
  for (const [k, v] of Object.entries(data)) {
    if (esBorrar(v)) delete out[k];
    else if (esMapa(v) && Object.keys(v).length) out[k] = fusionar(esMapa(out[k]) ? out[k] : {}, v);
    else out[k] = structuredClone(v);
  }
  return out;
}

const DOC = {
  brand: { name: "Salón" },
  translations: {
    en: { services: { cut: { name: "Cut" } }, sections: { gallery: { alts: { g1: "Colour" } }, services: { title: "Services", subtitle: "Prices" } } },
    ru: { staff: { noa: { name: "Ноа" } } },
  },
};

test("el modelo reproduce el defecto: sin paraFirestore, `{ translations: { en: {} } }` borra la capa inglesa entera", () => {
  const despues = fusionar(DOC, { translations: { en: {} } });
  assert.deepEqual((despues.translations as Record<string, unknown>).en, {}, "un mapa vacío reemplaza la capa: es lo que pasó en la web A");
});

test("un parche vacío no borra la capa: dentro de translations, paraFirestore quita todo mapa vacío, también el que queda vacío al quitar los suyos", () => {
  for (const cuerpo of [
    { translations: { en: {} }, business: { type: "peluqueria" } },
    { translations: { en: { sections: {} } } },
    { translations: { en: { sections: { services: {} } }, ru: {} } },
  ]) {
    const despues = fusionar(DOC, paraFirestore(cuerpo));
    assert.deepEqual(despues.translations, DOC.translations, `el parche ${JSON.stringify(cuerpo)} no toca ninguna capa`);
  }
  assert.deepEqual(paraFirestore({ translations: { en: {} } }), {}, "sin nada que escribir, el cuerpo queda vacío");
});

test("fuera de translations, {} se sigue escribiendo: hours: {} (alta sin horario del preset), heroObjects: {} (activa Impact) y un slot nuevo", () => {
  const cuerpo = { hours: {}, heroObjects: {}, sections: { hero: {} } };
  assert.deepEqual(paraFirestore(cuerpo), cuerpo, "los mapas vacíos fuera de translations llegan tal cual");
  const antes = { hours: { sunday: { start: "09:00", end: "18:00" } }, heroObjects: { a: { src: "x" } } };
  const despues = fusionar(antes, paraFirestore({ hours: {}, heroObjects: { ...antes.heroObjects, b: {} } }));
  assert.deepEqual(despues.hours, {}, "hours: {} reemplaza el horario, como siempre");
  assert.deepEqual(despues.heroObjects, { a: { src: "x" }, b: {} }, "el slot vacío nuevo se escribe");
  // Y la poda es sólo la de translations en la raíz: el mismo {} dentro de translations no llega.
  assert.deepEqual(paraFirestore({ translations: { en: { hours: {} } }, hours: {} }), { hours: {} });
});

test("un null explícito sigue borrando sólo ese campo", () => {
  const despues = fusionar(DOC, paraFirestore({ translations: { en: { sections: { services: { title: null } } } } }));
  const en = (despues.translations as Record<string, Record<string, any>>).en;
  assert.equal(en.sections.services.title, undefined, "el título se borra");
  assert.equal(en.sections.services.subtitle, "Prices", "el subtítulo queda");
  assert.deepEqual(en.services, DOC.translations.en.services, "los servicios de la capa quedan");
  assert.deepEqual(en.sections.gallery, DOC.translations.en.sections.gallery, "los alts de galería quedan");
  // Lo que no es mapa se escribe como siempre (los arrays, enteros).
  assert.deepEqual(paraFirestore({ services: [{ id: "cut" }], sections: { services: { images: [] } } }), { services: [{ id: "cut" }], sections: { services: { images: [] } } });
});

test("PUT /api/config escribe con paraFirestore, y Contenido no manda un parche vacío ni guarda mientras carga el idioma", () => {
  // PLANTILLA-01 (D-255): la lógica del PUT vive en src/lib/guardar-config.ts (la ruta llama a guardarConfig); se busca ahí.
  const ruta = readFileSync(new URL("../src/lib/guardar-config.ts", import.meta.url), "utf8");
  assert.match(ruta, /\.set\(\s*paraFirestore\(normalizedBody\)|const cleaned = paraFirestore\(normalizedBody\)/, "el guardado del PUT pasa el cuerpo por paraFirestore antes del set");
  assert.doesNotMatch(ruta, /replaceNullsWithDelete/, "no queda el reemplazo viejo, que dejaba pasar los mapas vacíos");
  const contenido = readFileSync(new URL("../src/components/client-content-tab.tsx", import.meta.url), "utf8");
  assert.match(contenido, /if \(Object\.keys\(patch\)\.length === 0\) return;/, "Contenido sin cambios no manda PUT");
  assert.match(contenido, /disabled=\{saving \|\| cargandoIdioma\}/, "Guardar queda deshabilitado mientras llega el GET del idioma");
});
