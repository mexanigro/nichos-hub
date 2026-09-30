// ARREGLOS-03 · guard de la condición 1 del revisor (aprobada por Liam, 2026-09-30). D-154 hace puras `quitarTextoIdioma` y
// `renombrarTextoIdioma`; esto vigila que lleguen a lo que se GUARDA:
// (1) borrar un servicio, una persona o una reseña, y cambiarle el id a una reseña, actualiza la raíz Y las capas
//     `translations.<lang>` en un solo config —el handler de cada casilla es una función pura que se aplica dentro de un único
//     `setConfig`—, y `validateConfig` no bloquea;
// (2) el guardado lleva el borrado a Firestore: `PUT /api/config` escribe con `set(…, { merge: true })`, que CONSERVA una clave que
//     falta en el cuerpo, así que la ficha marca con `null` (`borradosIdioma`) cada id que ya no está y `paraFirestore` lo convierte
//     en `FieldValue.delete()`. Sin Firestore (D-34): la fusión se modela con la regla de Firestore, como en
//     `tests/config-firestore.test.ts`, y el modelo se contrasta primero con el defecto (sin los `null`, el huérfano queda);
// (3) las casillas y el guardado llaman a esas funciones donde corresponde.
// Sin navegador: los módulos con el cargador de .tsx de `./orden/arreglos-03/_comun.ts`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import { ROOT, importarModulo } from "./orden/arreglos-03/_comun.ts";

type Cfg = Record<string, any>;
type Issue = { path: string; severity: "error" | "warning" };

/** Un cliente con texto por idioma en las tres secciones: `en` y `ru` como objeto por id, `ar` como array con `id`. */
const CONFIG: Cfg = {
  brand: { name: "Salón" },
  services: [{ id: "cut", name: "תספורת", price: 120, duration: 30 }, { id: "blowdry", name: "פן", price: 80, duration: 30 }],
  staff: [{ id: "noa", name: "נועה", specialty: "צבע" }, { id: "dana", name: "דנה", specialty: "תספורת" }],
  testimonials: [{ id: "r1", name: "יעל", rating: 5, text: "מעולה." }, { id: "r2", name: "מאיה", rating: 4, text: "טוב." }],
  translations: {
    en: {
      hero: { subtitle: "Client subtitle" },
      services: { cut: { name: "Haircut" }, blowdry: { name: "Blow-dry" } },
      staff: { noa: { specialty: "Colour" }, dana: { specialty: "Cuts" } },
      testimonials: { r1: { text: "Excellent." }, r2: { text: "Good." } },
    },
    ru: { services: { blowdry: { name: "Укладка" } }, staff: { dana: { specialty: "Стрижки" } }, testimonials: { r1: { text: "Отлично." } } },
    ar: { testimonials: [{ id: "r1", text: "ممتاز." }, { id: "r2", text: "جيد." }] },
  },
};

const esMapa = (v: unknown): v is Cfg => !!v && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const esBorrar = (v: unknown) => v instanceof FieldValue && v.isEqual(FieldValue.delete());
/** `set(data, { merge: true })` de Firestore sobre `doc` (copiado de tests/config-firestore.test.ts). */
function fusionar(doc: Cfg, data: Cfg): Cfg {
  const out = structuredClone(doc);
  for (const [k, v] of Object.entries(data)) {
    if (esBorrar(v)) delete out[k];
    else if (esMapa(v) && Object.keys(v).length) out[k] = fusionar(esMapa(out[k]) ? out[k] : {}, v);
    else out[k] = structuredClone(v);
  }
  return out;
}
/** Lo que el hub manda por JSON: sin las claves `undefined`. */
const porJson = (c: Cfg): Cfg => JSON.parse(JSON.stringify(c));
/** Los ids con texto en `translations.<lang>.<seccion>` (objeto por id o array con `id`). */
const idsEnCapa = (c: Cfg, lang: string, seccion: string): string[] => {
  const v = c.translations?.[lang]?.[seccion];
  return Array.isArray(v) ? v.map((x: Cfg) => x.id) : v ? Object.keys(v).filter((k) => v[k] != null) : [];
};

async function modulos() {
  const [resenas, equipo, servicios, validador, textos, firestore] = await Promise.all([
    importarModulo("src/components/config-editors/testimonials-editor.tsx"),
    importarModulo("src/components/config-editors/staff-editor.tsx"),
    importarModulo("src/components/config-editors/services-editor.tsx"),
    importarModulo("src/lib/config-validator.ts"),
    importarModulo("src/lib/textos-idioma.ts"),
    importarModulo("src/lib/config-firestore.ts"),
  ]);
  const validateConfig = validador.validateConfig as (c: unknown) => Issue[];
  return {
    quitarResena: resenas.quitarResena as (c: Cfg, i: number) => Cfg,
    cambiarIdResena: resenas.cambiarIdResena as (c: Cfg, i: number, id: string) => Cfg,
    quitarMiembro: equipo.quitarMiembro as (c: Cfg, i: number) => Cfg,
    quitarServicio: servicios.quitarServicio as (c: Cfg, i: number) => Cfg,
    borradosIdioma: textos.borradosIdioma as (antes: Cfg, ahora: Cfg) => Cfg,
    paraFirestore: firestore.paraFirestore as (c: Cfg) => Cfg,
    errores: (c: Cfg) => validateConfig(c).filter((i) => i.severity === "error").map((i) => i.path).sort(),
    bloquea: (c: Cfg) => (validador.hasBlockingIssues as (i: Issue[]) => boolean)(validateConfig(c)),
  };
}

test("borrar un servicio, una persona o una reseña, y cambiarle el id a una reseña, actualiza la raíz y las capas translations.<lang> en un solo config, y validateConfig no bloquea", async () => {
  const m = await modulos();
  const antes = structuredClone(CONFIG);
  assert.deepEqual(m.errores(CONFIG), [], "precondición: el cliente de prueba no da ningún error");

  for (const [nombre, fn, seccion, i, id, otro] of [
    ["quitarServicio", m.quitarServicio, "services", 1, "blowdry", "cut"],
    ["quitarMiembro", m.quitarMiembro, "staff", 1, "dana", "noa"],
    ["quitarResena", m.quitarResena, "testimonials", 0, "r1", "r2"],
  ] as const) {
    // La otra dirección: la raíz sola (lo que hacía remove() antes) deja el huérfano y bloquea.
    const soloRaiz = { ...structuredClone(CONFIG), [seccion]: CONFIG[seccion].filter((_: Cfg, j: number) => j !== i) };
    assert.equal(m.bloquea(soloRaiz), true, `${seccion}: borrar sólo en la raíz bloquea el guardado`);

    const r = fn(structuredClone(CONFIG), i);
    assert.deepEqual(r[seccion].map((x: Cfg) => x.id), [otro], `${nombre}: la raíz pierde «${id}» y conserva «${otro}»`);
    for (const l of ["en", "ru", "ar"]) assert.ok(!idsEnCapa(r, l, seccion).includes(id), `${nombre}: ${l} ya no tiene texto para «${id}»`);
    assert.ok(idsEnCapa(r, "en", seccion).includes(otro), `${nombre}: el texto de «${otro}» sigue`);
    assert.equal(r.translations.en.hero.subtitle, "Client subtitle", `${nombre}: no toca otra clave de la capa`);
    assert.deepEqual(m.errores(r), [], `${nombre}: sin huérfanos, validateConfig no da error`);
    assert.equal(m.bloquea(r), false, `${nombre}: y el guardado no se bloquea`);
  }

  const r9 = m.cambiarIdResena(structuredClone(CONFIG), 0, "r9");
  assert.deepEqual(r9.testimonials.map((x: Cfg) => x.id), ["r9", "r2"], "cambiarIdResena: la raíz lleva el id nuevo");
  for (const l of ["en", "ru", "ar"]) {
    assert.ok(idsEnCapa(r9, l, "testimonials").includes("r9") && !idsEnCapa(r9, l, "testimonials").includes("r1"), `cambiarIdResena: ${l} mueve el texto de r1 a r9`);
  }
  assert.deepEqual(m.errores(r9), [], "cambiarIdResena: validateConfig no da error");
  assert.deepEqual(CONFIG, antes, "los handlers no mutan el config que reciben");
});

test("el guardado lleva el borrado a Firestore: borradosIdioma marca con null cada id que ya no está en una capa objeto, validateConfig acepta ese cuerpo y, con la fusión merge de Firestore, no queda ningún huérfano", async () => {
  const m = await modulos();
  const editado = m.cambiarIdResena(m.quitarMiembro(m.quitarResena(structuredClone(CONFIG), 1), 1), 0, "r9");
  // Lo que hay en Firestore es CONFIG (lo cargado). El defecto: el cuerpo sin los null deja los huérfanos en el documento.
  const sinMarcas = fusionar(CONFIG, m.paraFirestore(porJson(editado)));
  assert.ok(sinMarcas.translations.en.testimonials.r1 && sinMarcas.translations.en.staff.dana, "precondición del modelo: con merge, una clave que falta en el cuerpo se conserva");
  assert.equal(m.bloquea(sinMarcas), true, "precondición del modelo: sin los null, el documento guardado queda con huérfanos y bloquea el próximo guardado");

  const cuerpo = porJson(m.borradosIdioma(CONFIG, editado));
  for (const [l, s, id] of [["en", "testimonials", "r1"], ["en", "testimonials", "r2"], ["ru", "testimonials", "r1"], ["en", "staff", "dana"], ["ru", "staff", "dana"]]) {
    assert.equal(cuerpo.translations[l][s][id], null, `borradosIdioma: translations.${l}.${s}.${id} va como null`);
  }
  assert.ok(Array.isArray(cuerpo.translations.ar.testimonials), "una capa array se manda entera (reemplaza), sin null");
  assert.equal(cuerpo.translations.en.testimonials.r9.text, "Excellent.", "el texto movido va en el cuerpo");
  assert.deepEqual(m.errores(cuerpo), [], "validateConfig acepta el cuerpo con los null (lo que valida PUT /api/config)");

  const guardado = fusionar(CONFIG, m.paraFirestore(cuerpo));
  assert.deepEqual(m.errores(guardado), [], "con la fusión merge de Firestore, el documento guardado no tiene huérfanos");
  assert.deepEqual(Object.keys(guardado.translations.en.testimonials), ["r9"], "en Firestore queda sólo el texto de la reseña que sigue, con su id nuevo");
  assert.equal(m.borradosIdioma(CONFIG, CONFIG), CONFIG, "sin nada borrado, el cuerpo es el mismo");
});

test("las casillas aplican esos handlers dentro de un único setConfig, y el guardado de la ficha manda borradosIdioma", () => {
  const src = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");
  const resenas = src("src/components/config-editors/testimonials-editor.tsx");
  assert.match(resenas, /setConfig\(\(prev\) => quitarResena\(prev, index\)\)/, "reseñas: remove() aplica quitarResena en un setConfig");
  assert.match(resenas, /setConfig\(\(prev\) => cambiarIdResena\(prev, index, nuevo\)\)/, "reseñas: el id aplica cambiarIdResena en un setConfig");
  assert.match(resenas, /onChange=\{\(e\) => cambiarId\(i, e\.target\.value\)\}/, "reseñas: la casilla del id pasa por cambiarId");
  assert.match(src("src/components/config-editors/staff-editor.tsx"), /setConfig\(\(prev\) => quitarMiembro\(prev, index\)\)/, "equipo: remove() aplica quitarMiembro en un setConfig");
  const servicios = src("src/components/config-editors/services-editor.tsx");
  assert.match(servicios, /escribir\(\(prev\) => quitarServicio\(prev, index\)\)/, "servicios: remove() aplica quitarServicio");
  assert.match(servicios, /const escribir = \(fn: \(prev: Cfg\) => Cfg\) => setConfig\(\(prev\) => fn\(prev as Cfg\) as ConfigSlice\);/, "servicios: escribir es un único setConfig");
  assert.match(src("src/components/client-config-tab.tsx"), /body: JSON\.stringify\(borradosIdioma\(originalConfigRef\.current, payload\)\)/, "el guardado manda borradosIdioma contra lo último cargado o guardado");
});
