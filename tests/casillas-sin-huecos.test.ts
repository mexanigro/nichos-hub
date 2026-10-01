// TEAM-RESENAS-01 · guard de la condición 1 del revisor (aprobada por Liam, 2026-10-01). E1–E3 de la orden prueban las funciones
// puras y leen el texto de las casillas; esto EJECUTA lo que llama cada casilla —`accionesServicios`, `accionesEquipo` y
// `accionesResenas`, con un `setConfig` que guarda el estado como React— y lleva el resultado a lo que queda en Firestore con la
// fusión `merge: true` modelada (como tests/textos-huerfanos.test.ts, D-34), en las dos direcciones:
// (1) borrar el último no se puede: con un elemento, la acción no cambia nada y lo guardado conserva la lista y sus textos; con dos,
//     borra uno y lo guardado no conserva nada de él;
// (2) `editar` del título o el servicio: vacío borra la clave también en lo guardado; no vacío lo escribe;
// (3) `idioma`: un idioma de los cuatro se guarda y valida; vacío borra la clave (= el idioma base); y el validador rechaza uno que
//     no es de los cuatro.
// Y que las casillas llaman a esas acciones. Sin navegador: los módulos con el cargador de .tsx de `./orden/arreglos-03/_comun.ts`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import { ROOT, importarModulo } from "./orden/arreglos-03/_comun.ts";

type Cfg = Record<string, any>;
type Issue = { path: string; message: string; severity: "error" | "warning" };
type SetCfg = (fn: (prev: Cfg) => Cfg) => void;

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
const DOS: Cfg = (() => {
  const c = structuredClone(UNO);
  c.services.push({ id: "color", name: "צבע", price: 200, duration: 60 });
  c.staff.push({ id: "maya", name: "מאיה", specialty: "תלתלים", bio: "תלתלים." });
  c.testimonials.push({ id: "r2", name: "מיכל ר.", rating: 5, text: "מדויק.", service: "צבע" });
  c.translations.en.services.color = { name: "Colour" };
  c.translations.en.staff.maya = { specialty: "Curls" };
  c.translations.en.testimonials.r2 = { text: "Precise." };
  return c;
})();

const esMapa = (v: unknown): v is Cfg => !!v && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const esBorrar = (v: unknown) => v instanceof FieldValue && v.isEqual(FieldValue.delete());
/** `set(data, { merge: true })` de Firestore sobre `doc` (copiado de tests/textos-huerfanos.test.ts). */
function fusionar(doc: Cfg, data: Cfg): Cfg {
  const out = structuredClone(doc);
  for (const [k, v] of Object.entries(data)) {
    if (esBorrar(v)) delete out[k];
    else if (esMapa(v) && Object.keys(v).length) out[k] = fusionar(esMapa(out[k]) ? out[k] : {}, v);
    else out[k] = structuredClone(v);
  }
  return out;
}
const porJson = (c: Cfg): Cfg => JSON.parse(JSON.stringify(c));
const idsEnCapa = (c: Cfg, lang: string, sec: string): string[] => {
  const v = c.translations?.[lang]?.[sec];
  return Array.isArray(v) ? v.map((x: Cfg) => x.id) : v ? Object.keys(v).filter((k) => v[k] != null) : [];
};

async function modulos() {
  const [sv, eq, rs, t, cf, v] = await Promise.all([
    importarModulo("src/components/config-editors/services-editor.tsx"),
    importarModulo("src/components/config-editors/staff-editor.tsx"),
    importarModulo("src/components/config-editors/testimonials-editor.tsx"),
    importarModulo("src/lib/textos-idioma.ts"),
    importarModulo("src/lib/config-firestore.ts"),
    importarModulo("src/lib/config-validator.ts"),
  ]);
  const validateConfig = v.validateConfig as (c: unknown) => Issue[];
  const borradosIdioma = t.borradosIdioma as (a: Cfg, b: Cfg) => Cfg, paraFirestore = cf.paraFirestore as (c: Cfg) => Cfg;
  return {
    acciones: {
      services: sv.accionesServicios as (s: SetCfg) => { quitar: (i: number) => void },
      staff: eq.accionesEquipo as (s: SetCfg) => { quitar: (i: number) => void },
      testimonials: rs.accionesResenas as (s: SetCfg) => { quitar: (i: number) => void; editar: (i: number, p: Cfg) => void; idioma: (i: number, l: string) => void },
    },
    errores: (c: Cfg) => validateConfig(c).filter((i) => i.severity === "error").map((i) => `${i.path}: ${i.message}`),
    guardado: (antes: Cfg, ahora: Cfg) => fusionar(antes, paraFirestore(borradosIdioma(antes, porJson(ahora)))),
  };
}
/** El estado de la ficha, como React: cada setConfig aplica el updater sobre el vigente; cuenta las llamadas. */
function ficha(inicial: Cfg) {
  const f = { estado: structuredClone(inicial), llamadas: 0, set: ((fn) => { f.llamadas++; f.estado = fn(f.estado); }) as SetCfg };
  return f;
}

test("lo que llaman las casillas de servicios, equipo y reseñas al borrar no borra el último —ni en la ficha ni en lo guardado— y con dos o más borra uno sin dejar nada de él en lo guardado", async () => {
  const m = await modulos();
  for (const sec of ["services", "staff", "testimonials"] as const) {
    // Con uno: la acción corre (un setConfig) y no cambia nada.
    const f1 = ficha(UNO);
    m.acciones[sec](f1.set).quitar(0);
    assert.equal(f1.llamadas, 1, `${sec}: borrar es un único setConfig`);
    assert.deepEqual(f1.estado[sec], UNO[sec], `${sec}: con un solo elemento, la ficha conserva la lista`);
    const g1 = m.guardado(UNO, f1.estado);
    assert.deepEqual(g1[sec], UNO[sec], `${sec}: con un solo elemento, lo guardado conserva la lista`);
    for (const l of ["en", "ar"]) assert.deepEqual(idsEnCapa(g1, l, sec), idsEnCapa(UNO, l, sec), `${sec}: lo guardado conserva translations.${l}.${sec}`);
    // Con dos: borra el primero y lo guardado no conserva nada de él.
    const f2 = ficha(DOS);
    const id = DOS[sec][0].id;
    m.acciones[sec](f2.set).quitar(0);
    const g2 = m.guardado(DOS, f2.estado);
    assert.deepEqual(g2[sec].map((x: Cfg) => x.id), [DOS[sec][1].id], `${sec}: con dos, lo guardado tiene sólo «${DOS[sec][1].id}»`);
    for (const l of ["en", "ar"]) assert.ok(!idsEnCapa(g2, l, sec).includes(id), `${sec}: lo guardado no conserva translations.${l}.${sec}.${id}`);
    assert.deepEqual(m.errores(g2), [], `${sec}: lo guardado no da error`);
  }
});

test("lo que llama la casilla de reseñas al escribir el título o el servicio y al elegir el idioma: vacío borra la clave también en lo guardado, un valor lo escribe, y el idioma se guarda sólo si es uno de los cuatro", async () => {
  const m = await modulos();
  for (const campo of ["title", "service"]) {
    const f = ficha(DOS);
    m.acciones.testimonials(f.set).editar(0, { [campo]: "" });
    assert.equal(f.llamadas, 1, `${campo}: un único setConfig`);
    assert.ok(!(campo in m.guardado(DOS, f.estado).testimonials[0]), `vaciar ${campo}: lo guardado no tiene la clave`);
    m.acciones.testimonials(f.set).editar(0, { [campo]: "Nuevo" });
    assert.equal(m.guardado(DOS, f.estado).testimonials[0][campo], "Nuevo", `${campo} no vacío: lo guardado lo tiene`);
  }
  const f = ficha(DOS);
  m.acciones.testimonials(f.set).idioma(1, "en");
  const g = m.guardado(DOS, f.estado);
  assert.equal(g.testimonials[1].lang, "en", "idioma en: lo guardado lo tiene");
  assert.deepEqual(m.errores(g), [], "idioma en: sin error");
  m.acciones.testimonials(f.set).idioma(1, "");
  assert.ok(!("lang" in m.guardado(g, f.estado).testimonials[1]), "idioma vacío: lo guardado no tiene la clave (= el idioma base)");
  m.acciones.testimonials(f.set).idioma(1, "fr");
  assert.ok(m.errores(f.estado).some((e) => e.startsWith("testimonials[1].lang:")), "un idioma que no es de los cuatro: validateConfig da error en testimonials[1].lang");
});

test("las casillas llaman a esas acciones: servicios y equipo al borrar, reseñas al borrar, al escribir el título o el servicio del idioma base y en el <select> del idioma", () => {
  const src = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");
  const eq = src("src/components/config-editors/staff-editor.tsx");
  assert.match(eq, /if \(setConfig\) accionesEquipo\(setConfig\)\.quitar\(index\);/, "equipo: remove() llama a accionesEquipo(setConfig).quitar");
  const rs = src("src/components/config-editors/testimonials-editor.tsx");
  assert.match(rs, /const acciones = setConfig \? accionesResenas\(setConfig\) : null;/, "reseñas: la casilla arma sus acciones con su setConfig");
  assert.match(rs, /if \(acciones\) return acciones\.quitar\(index\);/, "reseñas: remove() llama a acciones.quitar");
  assert.match(rs, /if \(!otro && acciones\) return acciones\.editar\(i, \{ \[campo\]: valor \}\);/, "reseñas: el título y el servicio del idioma base van por acciones.editar");
  assert.match(rs, /<select[\s\S]{0,200}onChange=\{\(e\) => acciones\.idioma\(i, e\.target\.value\)\}/, "reseñas: el <select> del idioma llama a acciones.idioma");
  assert.match(src("src/components/config-editors/services-editor.tsx"), /function remove\(index: number\) \{\s*acciones\.quitar\(index\);\s*\}/, "servicios: remove() llama a acciones.quitar");
});
