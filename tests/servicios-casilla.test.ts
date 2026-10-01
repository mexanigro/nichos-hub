// SERVICIOS-GALERIA-01 · guard de la condición 1 del revisor (aprobada por Liam, 2026-10-01). E2 de la orden sólo lee el texto de
// la casilla; esto EJECUTA el camino del handler: `accionesServicios(setConfig)` es lo que la casilla de servicios llama al borrar
// (`remove`), al cambiar el id (el campo «ID (slug, unico)») y al reordenar (`move`). Con un `setConfig` que guarda el estado como
// React (aplica el updater sobre el estado vigente) se borra, se renombra y se mueve sobre un cliente con fotos, destacados,
// `serviceId` de galería y capas por idioma (objeto y array); cada acción es UN `setConfig`, y lo que queda en la ficha y lo que
// queda en Firestore (la fusión `merge: true`, modelada como tests/textos-huerfanos.test.ts, D-34) pasa `validateConfig` sin errores.
// Sin navegador: los módulos con el cargador de .tsx de `./orden/arreglos-03/_comun.ts`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import { ROOT, importarModulo } from "./orden/arreglos-03/_comun.ts";

type Cfg = Record<string, any>;
type Issue = { path: string; message: string; severity: "error" | "warning" };
const S = "https://firebasestorage.googleapis.com/v0/b/x/o/clients%2Fprueba%2Fmedia%2Fservices%2F";
const foto = (n: string) => `${S}${n}.jpg?alt=media`;

const CONFIG: Cfg = {
  business: { type: "peluqueria" },
  brand: { name: "Salón" },
  services: [
    { id: "cut", name: "תספורת", price: 120, duration: 30 },
    { id: "blowdry", name: "פן", price: 80, duration: 30 },
    { id: "color", name: "צבע", price: 200, duration: 60 },
    { id: "kids", name: "ילדים", price: 60, duration: 20 },
  ],
  sections: {
    services: { images: [foto("cut"), foto("blowdry"), foto("color"), foto("kids")], featured: ["color", "cut"], surface: "velo" },
    gallery: { items: [
      { id: "g1", src: foto("g1"), type: "color", alt: "א", serviceId: "blowdry" },
      { id: "g2", src: foto("g2"), type: "color", alt: "ב", serviceId: "cut" },
      { id: "g3", src: foto("g3"), type: "color", alt: "ג", serviceId: "color" },
    ] },
  },
  gallery: [foto("g1"), foto("g2"), foto("g3")],
  translations: {
    en: { services: { cut: { name: "Haircut" }, blowdry: { name: "Blow-dry" }, color: { name: "Colour" } } },
    ru: { services: { blowdry: { name: "Укладка" }, kids: { name: "Детская" } } },
    ar: { services: [{ id: "cut", name: "قص" }, { id: "blowdry", name: "سشوار" }, { id: "color", name: "صبغة" }] },
  },
};

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
const idsEnCapa = (c: Cfg, lang: string): string[] => {
  const v = c.translations?.[lang]?.services;
  return Array.isArray(v) ? v.map((x: Cfg) => x.id) : v ? Object.keys(v).filter((k) => v[k] != null) : [];
};

test("lo que la casilla de servicios llama al borrar, renombrar y mover (accionesServicios) deja la ficha y lo guardado sin referencias viejas, cada acción en un único setConfig, y validateConfig sin errores", async () => {
  const ed = await importarModulo("src/components/config-editors/services-editor.tsx");
  const v = await importarModulo("src/lib/config-validator.ts");
  const t = await importarModulo("src/lib/textos-idioma.ts");
  const cf = await importarModulo("src/lib/config-firestore.ts");
  const errores = (c: Cfg) => ((v.validateConfig as (c: unknown) => Issue[])(c)).filter((i) => i.severity === "error").map((i) => `${i.path}: ${i.message}`);
  assert.deepEqual(errores(CONFIG), [], "precondición: el cliente de prueba no da ningún error");

  // El estado de la ficha, como React: cada setConfig aplica el updater sobre el vigente.
  let estado: Cfg = structuredClone(CONFIG);
  let llamadas = 0;
  const acciones = (ed.accionesServicios as (s: (fn: (prev: Cfg) => Cfg) => void) => { quitar: (i: number) => void; renombrar: (i: number, id: string) => void; mover: (a: number, b: number) => void })((fn: (prev: Cfg) => Cfg) => { llamadas++; estado = fn(estado); });
  const una = (nombre: string, f: () => void) => { const n = llamadas; f(); assert.equal(llamadas - n, 1, `${nombre}: un único setConfig`); };

  // Borrar «blowdry» (posición 1): su foto, su pieza de galería y su texto se van; los demás siguen con lo suyo.
  una("borrar", () => acciones.quitar(1));
  assert.deepEqual(estado.services.map((s: Cfg) => s.id), ["cut", "color", "kids"]);
  assert.deepEqual(estado.sections.services.images, [foto("cut"), foto("color"), foto("kids")], "borrar: cada foto sigue con su servicio");
  assert.equal(estado.sections.gallery.items[0].serviceId, undefined, "borrar: la pieza de «blowdry» queda sin servicio");
  for (const l of ["en", "ru", "ar"]) assert.ok(!idsEnCapa(estado, l).includes("blowdry"), `borrar: ${l} sin «blowdry»`);

  // Renombrar «cut» → «corte» (posición 0), tecla por tecla como la casilla: «cut» → «cu» → «c» → «co» → «corte».
  for (const id of ["cu", "c", "co", "cor", "corte"]) una(`renombrar a «${id}»`, () => acciones.renombrar(0, id));
  assert.deepEqual(estado.sections.services.featured, ["color", "corte"], "renombrar: featured cambia el id en su lugar");
  assert.equal(estado.sections.gallery.items[1].serviceId, "corte", "renombrar: la pieza de «cut» apunta a «corte»");
  assert.equal(estado.translations.en.services.corte.name, "Haircut", "renombrar: el texto en (objeto) pasa a «corte»");
  assert.ok(idsEnCapa(estado, "ar").includes("corte") && !idsEnCapa(estado, "ar").includes("cut"), "renombrar: el texto ar (array) pasa a «corte»");

  // Mover «kids» (posición 2) al principio: su foto va con él.
  una("mover", () => acciones.mover(2, 0));
  assert.deepEqual(estado.services.map((s: Cfg) => s.id), ["kids", "corte", "color"]);
  assert.deepEqual(estado.sections.services.images, [foto("kids"), foto("cut"), foto("color")], "mover: cada foto sigue con su servicio");

  assert.deepEqual(errores(estado), [], "lo que queda en la ficha: validateConfig sin errores");
  const guardado = fusionar(CONFIG, (cf.paraFirestore as (c: Cfg) => Cfg)((t.borradosIdioma as (a: Cfg, b: Cfg) => Cfg)(CONFIG, porJson(estado))));
  for (const viejo of ["cut", "blowdry"]) {
    assert.ok(!JSON.stringify(guardado.sections).includes(`"${viejo}"`), `lo guardado: ninguna sección nombra «${viejo}»`);
    for (const l of ["en", "ru", "ar"]) assert.ok(!idsEnCapa(guardado, l).includes(viejo), `lo guardado: translations.${l}.services sin «${viejo}»`);
  }
  assert.deepEqual(guardado.sections.services.images, [foto("kids"), foto("cut"), foto("color")], "lo guardado: cada foto con su servicio");
  assert.deepEqual(errores(guardado), [], "lo que queda en Firestore: validateConfig sin errores");
});

test("la casilla de servicios llama a accionesServicios en remove(), en move() y en el campo del id", () => {
  const src = readFileSync(resolve(ROOT, "src/components/config-editors/services-editor.tsx"), "utf8");
  assert.match(src, /const acciones = accionesServicios\(setConfig\);/, "la casilla arma sus acciones con su setConfig");
  assert.match(src, /function remove\(index: number\) \{\s*acciones\.quitar\(index\);\s*\}/, "remove() llama a acciones.quitar");
  assert.match(src, /function move\(from: number, dir: -1 \| 1\) \{\s*acciones\.mover\(from, from \+ dir\);\s*\}/, "move() llama a acciones.mover");
  assert.match(src, /label="ID \(slug, unico\)"\s*value=\{s\.id\}\s*onChange=\{\(v\) => acciones\.renombrar\(i, v\)\}/, "el campo del id llama a acciones.renombrar");
});
