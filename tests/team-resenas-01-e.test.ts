// TEAM-RESENAS-01 · copia promovida (INSTAGRAM-FAQ-01, 2026-10-02, D-200). La orden quedó aprobada por Liam el 2026-10-02
// (T 471d2be · H dab461c) y su carpeta está congelada; esto es la copia editable que corre `npm test` todos los días.
// Recorte: entera.
// TEAM-RESENAS-01 · E1–E5 (H) · las casillas de servicios, equipo y reseñas. Sesión A (2026-10-01): tests rojos.
//
// E1 · la lista vacía. Medido por A el 2026-10-01: borrar el último elemento manda la lista como `undefined` (`quitarServicio`,
// `quitarMiembro` y `quitarResena` dejan `services|staff|testimonials: undefined`), que no viaja por JSON; el PUT escribe con
// `merge: true` y Firestore conserva la lista vieja. En servicios desde SERVICIOS-GALERIA-01 se borran fotos, featured, serviceId y
// traducciones pero queda el servicio; en reseñas, la reseña vuelve sin sus traducciones. Y en T (medido con el componente real): con
// la lista ausente la web muestra las del preset; con `[]`, la sección sin elementos («5.0 דירוג ממוצע» sin reseñas). Liam
// (2026-10-01, D-176): **no se puede borrar el último**; la casilla lo dice y explica cómo ocultar la sección (`features.show…`); el
// texto «si dejás la lista vacía se usan los del preset» se corrige en las tres; en servicios sigue «volver al preset». En las dos
// direcciones: con un solo elemento no se borra nada; con dos o más, se borra y lo guardado no conserva nada de él.
// E2 · la casilla de reseñas no podía borrar `title` (queda «»): vaciar el título o el servicio borra la clave (D-157).
// E3 · `testimonials[].lang` (D-145): validador y casilla. Los otros lugares (contrato, material y guard) están en T (C3).
// E4 · CT-2 (INFORME § 7): la primera oración de `staff[i].bio`, hasta 10 palabras, es la frase de la tarjeta móvil de team v6; la
// casilla de equipo avisa, en todos los idiomas, si pasa de 10.
// E5 · la casilla de variantes ofrece team v6 y reseñas v6 (sin eso, la carga del cierre del tramo no puede elegirlas: E2E-01 (1)).
// La fusión de Firestore se modela con la regla de `set(…, { merge: true })`, copiada de tests/textos-huerfanos.test.ts (D-34: sin
// Firestore ni navegador). Caja negra: los módulos con el cargador de `_comun.ts`. Sólo en H (inciso n). No escribe nada.
import { test } from "node:test";
import assert from "node:assert/strict";
import { FieldValue } from "firebase-admin/firestore";
import { fuente, importarModulo } from "./orden/team-resenas-01/_comun.ts";

type Issue = { path: string; message: string; severity: "error" | "warning" };
type Cfg = Record<string, any>;
const SERVICIOS = "src/components/config-editors/services-editor.tsx";
const EQUIPO = "src/components/config-editors/staff-editor.tsx";
const RESENAS = "src/components/config-editors/testimonials-editor.tsx";
const VARIANTES = "src/components/config-editors/layout-variants-editor.tsx";

const esMapa = (v: unknown): v is Cfg => !!v && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const esBorrar = (v: unknown) => v instanceof FieldValue && v.isEqual(FieldValue.delete());
/** `set(data, { merge: true })` de Firestore sobre `doc` (copiado de tests/textos-huerfanos.test.ts). Los arrays, enteros. */
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
/** Claves de `translations.<lang>.<sec>` (objeto por id o array con `id`), sin los borrados. */
const idsEnCapa = (c: Cfg, lang: string, sec: string): string[] => {
  const v = c.translations?.[lang]?.[sec];
  return Array.isArray(v) ? v.map((x: Cfg) => x.id) : v ? Object.keys(v).filter((k) => v[k] != null) : [];
};

async function modulos() {
  const t = await importarModulo("src/lib/textos-idioma.ts");
  const cf = await importarModulo("src/lib/config-firestore.ts");
  const v = await importarModulo("src/lib/config-validator.ts");
  const borradosIdioma = t.borradosIdioma as (a: unknown, b: Cfg) => Cfg, paraFirestore = cf.paraFirestore as (b: Cfg) => Cfg;
  return {
    v, validateConfig: v.validateConfig as (c: unknown) => Issue[],
    /** Lo que queda en Firestore después de guardar `ahora` sobre el documento `antes`, como lo hace la ficha. */
    guardado: (antes: Cfg, ahora: Cfg) => fusionar(antes, paraFirestore(borradosIdioma(antes, porJson(ahora)))),
  };
}
/** Un cliente con UN servicio, UNA persona y UNA reseña, cada uno con su texto en en (objeto) y ar (array). */
const UNO: Cfg = {
  business: { type: "peluqueria" },
  services: [{ id: "cut", name: "תספורת", price: 120, duration: 30 }],
  staff: [{ id: "noa", name: "נועה", specialty: "צבע", bio: "בעלת הסטודיו." }],
  testimonials: [{ id: "r1", name: "יעל ב.", rating: 5, text: "שווה כל שקל.", title: "לקוחה", service: "צבע" }],
  translations: {
    en: { services: { cut: { name: "Haircut" } }, staff: { noa: { specialty: "Colour" } }, testimonials: { r1: { text: "Worth every shekel." } } },
    ar: { services: [{ id: "cut", name: "قص" }], staff: [{ id: "noa", specialty: "صبغ" }], testimonials: [{ id: "r1", text: "يستحق كل شيكل." }] },
  },
};
/** El mismo cliente con un segundo elemento en cada lista. */
const DOS: Cfg = (() => {
  const c = structuredClone(UNO);
  c.services.push({ id: "color", name: "צבע", price: 200, duration: 60 });
  c.staff.push({ id: "maya", name: "מאיה", specialty: "תלתלים", bio: "תלתלים." });
  c.testimonials.push({ id: "r2", name: "מיכל ר.", rating: 5, text: "מדויק.", service: "צבע" });
  return c;
})();
/** Las tres listas, con la función de la casilla que borra y el flag de `features` que oculta su sección. */
const LISTAS = [
  { sec: "services", casilla: SERVICIOS, fn: "quitarServicio", flag: "features.showServices" },
  { sec: "staff", casilla: EQUIPO, fn: "quitarMiembro", flag: "features.showTeam" },
  { sec: "testimonials", casilla: RESENAS, fn: "quitarResena", flag: "features.showTestimonials" },
] as const;
/** Fuente de una casilla sin comentarios: lo que dice y hace, no lo que se comenta. */
const sinComentarios = (rel: string) => fuente(rel).replace(/\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, "");

test("borrar el último servicio, la última persona o la última reseña no se puede: `quitarServicio`, `quitarMiembro` y `quitarResena` con un solo elemento devuelven la lista y sus textos por idioma sin cambios, y con dos o más borran el elemento y lo que la ficha guarda —`borradosIdioma(antes, ahora)` fusionado con `merge: true`— no conserva nada de él; ninguna de las tres casillas dice que dejar la lista vacía usa las del preset, cada una dice cómo ocultar su sección (`features.showServices`, `features.showTeam`, `features.showTestimonials`), y la de servicios conserva «volver al preset»", async () => {
  const m = await modulos();
  assert.deepEqual(m.validateConfig(UNO).filter((i) => i.severity === "error"), [], "precondición: el cliente de prueba no da ningún error");
  for (const { sec, casilla, fn } of LISTAS) {
    const quitar = (await importarModulo(casilla))[fn] as (c: Cfg, i: number) => Cfg;
    assert.equal(typeof quitar, "function", `${casilla} exporta ${fn}`);
    // (1) Con un solo elemento no se borra nada. Hoy la lista queda `undefined`: aquí está el rojo.
    const uno = quitar(structuredClone(UNO), 0);
    assert.deepEqual(uno[sec], UNO[sec], `${fn} con un solo elemento no borra nada (hoy ${sec}: ${JSON.stringify(uno[sec])})`);
    for (const l of ["en", "ar"]) assert.deepEqual(idsEnCapa(uno, l, sec), idsEnCapa(UNO, l, sec), `${fn} con un solo elemento: translations.${l}.${sec} no cambia`);
    const g1 = m.guardado(UNO, uno);
    assert.deepEqual(g1[sec], UNO[sec], `${fn} con un solo elemento: lo guardado conserva ${sec}`);
    for (const l of ["en", "ar"]) assert.deepEqual(idsEnCapa(g1, l, sec), idsEnCapa(UNO, l, sec), `${fn} con un solo elemento: lo guardado conserva translations.${l}.${sec}`);
    // (2) Con dos, se borra el primero y lo guardado no conserva nada de él.
    const id = DOS[sec][0].id;
    const dos = quitar(structuredClone(DOS), 0);
    assert.deepEqual(dos[sec].map((x: Cfg) => x.id), [DOS[sec][1].id], `${fn} con dos elementos borra «${id}»`);
    const g2 = m.guardado(DOS, dos);
    assert.deepEqual(g2[sec].map((x: Cfg) => x.id), [DOS[sec][1].id], `${fn}: Firestore guarda la lista sin «${id}»`);
    for (const l of ["en", "ar"]) assert.ok(!idsEnCapa(g2, l, sec).includes(id), `${fn}: Firestore no conserva translations.${l}.${sec}.${id}`);
    assert.deepEqual(m.validateConfig(g2).filter((i) => i.severity === "error"), [], `${fn}: lo guardado no da error`);
  }
  // (3) Lo que dicen las casillas.
  for (const { casilla, flag } of LISTAS) {
    const src = sinComentarios(casilla);
    assert.ok(!/se usan los del preset/i.test(src), `${casilla}: no dice que dejar la lista vacía usa las del preset`);
    assert.ok(src.includes(flag), `${casilla}: dice cómo ocultar la sección (${flag})`);
  }
  assert.ok(/Volver al preset/.test(sinComentarios(SERVICIOS)), `${SERVICIOS}: conserva «Volver al preset»`);
});

test("en la casilla de reseñas vaciar el título o el servicio borra la clave: `editarResena(config, i, { title: \"\" })` deja la reseña sin `title` —y lo que la ficha guarda tampoco lo tiene—, con un título no vacío lo escribe, y la casilla escribe el título y el servicio del idioma base con `editarResena` dentro de un `setConfig`", async () => {
  const mod = await importarModulo(RESENAS);
  // (1) La función. Hoy no existe: aquí está el rojo.
  assert.equal(typeof mod.editarResena, "function", `${RESENAS} debe exportar editarResena (exporta: ${Object.keys(mod).filter((k) => /^[a-z]/.test(k)).join(", ")})`);
  const editar = mod.editarResena as (c: Cfg, i: number, patch: Cfg) => Cfg;
  const m = await modulos();
  const antes = structuredClone(DOS);
  for (const campo of ["title", "service"]) {
    const sin = editar(DOS, 0, { [campo]: "" });
    assert.ok(!(campo in sin.testimonials[0]), `vaciar ${campo} borra la clave (queda ${JSON.stringify(sin.testimonials[0][campo])})`);
    assert.ok(!(campo in m.guardado(DOS, sin).testimonials[0]), `lo guardado no tiene ${campo}`);
    const con = editar(DOS, 0, { [campo]: "Nuevo" });
    assert.equal(con.testimonials[0][campo], "Nuevo", `un ${campo} no vacío se escribe`);
    assert.equal(m.guardado(DOS, con).testimonials[0][campo], "Nuevo", `lo guardado tiene el ${campo} nuevo`);
  }
  assert.deepEqual(DOS, antes, "editarResena no muta el config que recibe");
  // (2) La casilla la usa en el idioma base.
  const src = sinComentarios(RESENAS);
  assert.ok(/setConfig!?\(\s*\(\s*prev\s*\)\s*=>\s*editarResena\(\s*prev\b/.test(src), `${RESENAS}: el título y el servicio del idioma base se escriben con editarResena(prev, …) dentro de un setConfig (hoy update(i, { [campo]: valor }) deja «»)`);
});

test("`testimonials[].lang` —el idioma en que se escribió la reseña— tiene validador y casilla: `validateIdiomaResenas(config)`, encadenada a `validateConfig`, da error por cada `testimonials[i].lang` que no es he, en, ru ni ar y ninguno con uno de los cuatro o sin el campo; y la casilla de reseñas lo elige entre los cuatro idiomas con `editarResena` (vacío = el idioma base, sin la clave)", async () => {
  const m = await modulos();
  // (1) El validador. Hoy no existe: aquí está el rojo.
  assert.equal(typeof m.v.validateIdiomaResenas, "function", "config-validator.ts debe exportar validateIdiomaResenas");
  const validar = m.v.validateIdiomaResenas as (c: unknown) => Issue[];
  const con = (lang: unknown) => { const c = structuredClone(DOS); if (lang !== undefined) c.testimonials[1].lang = lang; return c; };
  for (const bueno of [undefined, "he", "en", "ru", "ar"]) assert.deepEqual(validar(con(bueno)), [], `lang ${JSON.stringify(bueno)}: sin error`);
  for (const malo of ["fr", "EN", "", 3]) {
    const e = validar(con(malo));
    assert.deepEqual(e.map((i) => [i.path, i.severity]), [["testimonials[1].lang", "error"]], `lang ${JSON.stringify(malo)}: un error en testimonials[1].lang (${JSON.stringify(e)})`);
    assert.ok(m.validateConfig(con(malo)).some((i) => i.path === "testimonials[1].lang" && i.severity === "error"), `lang ${JSON.stringify(malo)}: validateConfig lo encadena`);
  }
  // (2) La casilla.
  const mod = await importarModulo(RESENAS);
  const editar = mod.editarResena as (c: Cfg, i: number, patch: Cfg) => Cfg;
  assert.equal(typeof editar, "function", `${RESENAS} debe exportar editarResena`);
  assert.equal(editar(DOS, 1, { lang: "en" }).testimonials[1].lang, "en", "editarResena escribe lang");
  assert.ok(!("lang" in editar(con("en"), 1, { lang: "" }).testimonials[1]), "editarResena con lang vacío borra la clave (= el idioma base)");
  const src = sinComentarios(RESENAS);
  assert.ok(/<select\b/.test(src) && /editarResena\(\s*prev\s*,[^)]*\{\s*lang\b/.test(src), `${RESENAS}: un <select> escribe lang con editarResena(prev, i, { lang })`);
  for (const l of ["he", "en", "ru", "ar"]) assert.ok(new RegExp(`["'\`]${l}["'\`]`).test(src), `${RESENAS}: la casilla ofrece «${l}»`);
});

test("`validateFraseEquipo(config)`, encadenada a `validateConfig`, avisa (warning) por cada bio de `staff[]` —en la raíz y en `translations.<lang>.staff`, objeto o array— cuya primera oración pasa de 10 palabras cuando `sections.team.variant` es v6, y no avisa con 10 o menos ni con otra variante; y la casilla de equipo muestra esos avisos (CT-2)", async () => {
  const m = await modulos();
  // (1) El validador. Hoy no existe: aquí está el rojo.
  assert.equal(typeof m.v.validateFraseEquipo, "function", "config-validator.ts debe exportar validateFraseEquipo");
  const validar = m.v.validateFraseEquipo as (c: unknown) => Issue[];
  const once = "אחת שתיים שלוש ארבע חמש שש שבע שמונה תשע עשר אחת־עשרה. ועוד.";
  const diez = "One two three four five six seven eight nine ten. And more words after the first sentence.";
  const c: Cfg = {
    business: { type: "peluqueria" }, sections: { team: { variant: "v6" } },
    staff: [{ id: "noa", name: "נועה", bio: once }, { id: "maya", name: "מאיה", bio: "קצרה. ועוד." }],
    translations: {
      en: { staff: { noa: { bio: diez }, maya: { bio: "One two three four five six seven eight nine ten eleven twelve. Then." } } },
      ru: { staff: [{ id: "noa", bio: "Раз два три четыре пять шесть семь восемь девять десять одиннадцать." }] },
    },
  };
  const avisos = validar(c);
  assert.ok(avisos.every((i) => i.severity === "warning"), `CT-2 avisa, no bloquea (${JSON.stringify(avisos)})`);
  assert.deepEqual(avisos.map((i) => i.path).sort(), ["staff[0].bio", "translations.en.staff.maya.bio", "translations.ru.staff.noa.bio"].sort(), `avisa la raíz con 11 palabras, en (objeto) con 12 y ru (array) con 11; no la de 10 (${JSON.stringify(avisos)})`);
  assert.ok(m.validateConfig(c).some((i) => i.path === "staff[0].bio" && i.severity === "warning"), "validateConfig lo encadena");
  const otra = structuredClone(c); otra.sections.team.variant = "v1";
  assert.deepEqual(validar(otra), [], "con otra variante de team, sin aviso");
  // (2) La casilla de equipo lo muestra.
  const src = sinComentarios(EQUIPO);
  assert.ok(/\bvalidateFraseEquipo\(/.test(src) && /import[^;]*validateFraseEquipo[^;]*from\s*["']@\/lib\/config-validator["']/.test(src), `${EQUIPO}: importa validateFraseEquipo y muestra sus avisos`);
});

test("la casilla de variantes ofrece `v6` en `sections.team.variant` (team de peluquería) y en `sections.testimonials.variant` (reseñas en collage)", async () => {
  const mod = await importarModulo(VARIANTES);
  const secciones = mod.LAYOUT_VARIANT_SECTIONS as { path: string; variants: Record<string, { name: string } | undefined> }[];
  assert.ok(Array.isArray(secciones), `${VARIANTES} exporta LAYOUT_VARIANT_SECTIONS`);
  for (const path of ["sections.team.variant", "sections.testimonials.variant"]) {
    const s = secciones.find((x) => x.path === path);
    assert.ok(s, `precondición: ${path} está en la casilla`);
    assert.ok(s!.variants.v6?.name, `${path} ofrece v6 (hoy: ${Object.keys(s!.variants).join(", ")})`);
  }
});
