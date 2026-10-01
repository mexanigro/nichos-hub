// SERVICIOS-GALERIA-01 · copia promovida (TEAM-RESENAS-01, 2026-10-01, D-174). La orden quedó aprobada por Liam el 2026-10-01
// (T 428f62d · H 563f230) y su carpeta está congelada; esto es la copia editable que corre `npm test` todos los días.
// Recorte: entera.
// SERVICIOS-GALERIA-01 · E1, E2 (H) · el id de un servicio y lo que deja huérfano. Sesión A (2026-10-01): tests rojos.
//
// ARREGLOS-03 D-154, «Fuera» (Liam, 2026-09-30): defecto que bloquea el guardado, con su afirmación en esta hoja. Medido por A el
// 2026-10-01 con las funciones y el validador reales de H 064acb5: `quitarServicio(config, 1)` (borrar «blowdry» de
// [cut, blowdry, color]) deja `sections.services.images` con las tres fotos —la de «color» pasa a ser la de «blowdry», porque la
// foto aparea por posición—, `featured` con «blowdry» y el `serviceId` «blowdry» de la galería: `validateConfig` da 2 errores y
// `hasBlockingIssues` = true. Cambiar el id «cut» → «corte» desde la casilla (`update(i, { id })`, services-editor.tsx:821) da 3
// errores (featured, serviceId, translations.en.services.cut) y bloquea.
// Y reordenar (`move()`, `onChange(moveItem(services, …))`) mueve services[] pero no la foto: queda con otro servicio (Liam, respuesta a
// A, 2026-10-01: entra en esta afirmación).
// D-164: `quitarServicio(config, i)` (ya existe), `renombrarServicio(config, i, id)` y `moverServicio(config, desde, hasta)` (nuevas),
// puras y exportadas por la casilla, dejan consistentes la raíz, `sections.services.images` (la foto de cada servicio sigue con su
// servicio), `featured` (el orden se conserva), el `serviceId` de cada pieza de la galería y el texto por idioma
// (`quitarTextoIdioma` / `renombrarTextoIdioma`). Un id nuevo vacío o que ya es de otro servicio no mueve nada de lo de otro
// servicio (como D-154: no se pisa; el validador lo nombra).
// Y el guardado: el PUT escribe con `merge: true` (una clave que falta se CONSERVA en Firestore), así que lo que la ficha manda
// —`borradosIdioma(antes, ahora)`, client-config-tab.tsx— tiene que dejar el documento guardado sin ninguna referencia al id viejo.
// La fusión se modela con la regla de Firestore, copiada de tests/textos-huerfanos.test.ts (D-34: sin Firestore ni navegador).
// Caja negra: los módulos con el cargador de `_comun.ts`. Sólo en H (inciso n). No escribe nada.
import { test } from "node:test";
import assert from "node:assert/strict";
import { FieldValue } from "firebase-admin/firestore";
import { fuente, importarModulo } from "./orden/servicios-galeria-01/_comun.ts";

type Issue = { path: string; message: string; severity: "error" | "warning" };
type Cfg = Record<string, any>;
const CASILLA = "src/components/config-editors/services-editor.tsx";
const S = "https://firebasestorage.googleapis.com/v0/b/x/o/clients%2Fprueba%2Fmedia%2Fservices%2F";

/** Un cliente con tres servicios, su foto por posición, dos destacados, dos piezas de galería atadas a un servicio y texto por idioma
 *  (`en` y `ru` objeto por id, `ar` array con `id`). */
const CONFIG: Cfg = {
  business: { type: "peluqueria" },
  brand: { name: "Salón" },
  services: [
    { id: "cut", name: "תספורת", price: 120, duration: 30 },
    { id: "blowdry", name: "פן", price: 80, duration: 30 },
    { id: "color", name: "צבע", price: 200, duration: 60 },
  ],
  sections: {
    services: { images: [`${S}servicio-1.jpg?alt=media`, `${S}servicio-2.jpg?alt=media`, `${S}servicio-3.jpg?alt=media`], featured: ["cut", "blowdry"], surface: "velo" },
    gallery: { items: [
      { id: "g1", src: `${S}galeria-1.jpg?alt=media`, type: "color", alt: "א", serviceId: "blowdry" },
      { id: "g2", src: `${S}galeria-2.jpg?alt=media`, type: "color", alt: "ב", serviceId: "cut" },
    ] },
  },
  gallery: [`${S}galeria-1.jpg?alt=media`, `${S}galeria-2.jpg?alt=media`],
  translations: {
    en: { services: { cut: { name: "Haircut" }, blowdry: { name: "Blow-dry" }, color: { name: "Colour" } } },
    ru: { services: { blowdry: { name: "Укладка" } } },
    ar: { services: [{ id: "cut", name: "قص" }, { id: "blowdry", name: "سشوار" }] },
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
/** Lo que el hub manda por JSON: sin las claves `undefined`. */
const porJson = (c: Cfg): Cfg => JSON.parse(JSON.stringify(c));
/** Cada string del documento, con su ruta. */
const textos = (v: unknown, ruta = ""): [string, string][] =>
  typeof v === "string" ? [[ruta, v]] : v && typeof v === "object" ? Object.entries(v as Cfg).flatMap(([k, x]) => textos(x, ruta ? `${ruta}.${k}` : k)) : [];
/** Claves de `translations.<lang>.services` (objeto por id o array con `id`). */
const idsEnCapa = (c: Cfg, lang: string): string[] => {
  const v = c.translations?.[lang]?.services;
  return Array.isArray(v) ? v.map((x: Cfg) => x.id) : v ? Object.keys(v).filter((k) => v[k] != null) : [];
};

async function modulos() {
  const ed = await importarModulo(CASILLA);
  const t = await importarModulo("src/lib/textos-idioma.ts");
  const cf = await importarModulo("src/lib/config-firestore.ts");
  const v = await importarModulo("src/lib/config-validator.ts");
  const validateConfig = v.validateConfig as (c: unknown) => Issue[];
  return {
    ed, borradosIdioma: t.borradosIdioma as (a: unknown, b: Cfg) => Cfg, paraFirestore: cf.paraFirestore as (b: Cfg) => Cfg,
    errores: (c: Cfg) => validateConfig(c).filter((i) => i.severity === "error").map((i) => `${i.path}: ${i.message}`),
    bloquea: (c: Cfg) => (v.hasBlockingIssues as (i: Issue[]) => boolean)(validateConfig(c)),
  };
}

test("`quitarServicio(config, i)`, `renombrarServicio(config, i, id)` y `moverServicio(config, desde, hasta)`, exportadas por la casilla de servicios, son puras y dejan consistentes la raíz, la foto de cada servicio en `sections.services.images` (sigue con su servicio al borrar uno anterior y al mover), `sections.services.featured` (con su orden), el `serviceId` de cada pieza de la galería y el texto por idioma; un id nuevo vacío o de otro servicio no mueve nada de lo de otro servicio; y lo que la ficha guarda —`borradosIdioma(antes, ahora)` fusionado con `merge: true` sobre el documento— no conserva ninguna referencia al id viejo y no bloquea, cuando sin ellas el guardado se bloquea", async () => {
  const m = await modulos();
  // (1) La función nueva. Hoy no existe: aquí está el rojo.
  assert.equal(typeof m.ed.renombrarServicio, "function", `${CASILLA} debe exportar renombrarServicio (exporta: ${Object.keys(m.ed).filter((k) => /^[a-z]/.test(k)).join(", ")})`);
  assert.equal(typeof m.ed.moverServicio, "function", `${CASILLA} debe exportar moverServicio`);
  const quitar = m.ed.quitarServicio as (c: Cfg, i: number) => Cfg;
  const renombrar = m.ed.renombrarServicio as (c: Cfg, i: number, id: string) => Cfg;
  const antes = structuredClone(CONFIG);
  assert.deepEqual(m.errores(CONFIG), [], "precondición: el cliente de prueba no da ningún error");

  // (2) La otra dirección (lo que pasa sin ellas): borrar o renombrar sólo en la raíz bloquea el guardado.
  const soloBorrar: Cfg = { ...structuredClone(CONFIG), services: CONFIG.services.filter((s: Cfg) => s.id !== "blowdry") };
  const soloRenombrar: Cfg = { ...structuredClone(CONFIG), services: CONFIG.services.map((s: Cfg) => (s.id === "cut" ? { ...s, id: "corte" } : s)) };
  assert.equal(m.bloquea(soloBorrar), true, `control: borrar «blowdry» sólo de la raíz bloquea (${m.errores(soloBorrar).join(" | ")})`);
  assert.equal(m.bloquea(soloRenombrar), true, `control: renombrar «cut» sólo en la raíz bloquea (${m.errores(soloRenombrar).join(" | ")})`);

  /** Lo que queda en Firestore después de guardar `ahora` sobre el documento `antes`, como lo hace la ficha. */
  const guardado = (ahora: Cfg) => fusionar(CONFIG, m.paraFirestore(m.borradosIdioma(CONFIG, porJson(ahora))));
  const sinRefs = (c: Cfg, id: string, donde: string) => {
    assert.ok(!c.services.some((s: Cfg) => s.id === id), `${donde}: «${id}» ya no está en services`);
    assert.ok(!(c.sections?.services?.featured ?? []).includes(id), `${donde}: featured no nombra «${id}» (${JSON.stringify(c.sections?.services?.featured)})`);
    assert.ok(!c.sections.gallery.items.some((x: Cfg) => x.serviceId === id), `${donde}: ninguna pieza de la galería apunta a «${id}»`);
    for (const l of ["en", "ru", "ar"]) assert.ok(!idsEnCapa(c, l).includes(id), `${donde}: translations.${l}.services no conserva «${id}»`);
    assert.deepEqual(m.errores(c), [], `${donde}: validateConfig no da error`);
    assert.equal(m.bloquea(c), false, `${donde}: el guardado no se bloquea`);
  };

  // (3) Borrar «blowdry» (posición 1).
  const b = quitar(CONFIG, 1);
  assert.deepEqual(b.services.map((s: Cfg) => s.id), ["cut", "color"], "borrar: la raíz pierde «blowdry»");
  assert.deepEqual(b.sections.services.images, [CONFIG.sections.services.images[0], CONFIG.sections.services.images[2]], "borrar: la foto de «blowdry» se va y la de «color» sigue con «color» (aparea por posición)");
  assert.deepEqual(b.sections.services.featured, ["cut"], "borrar: featured pierde «blowdry» y conserva el orden");
  assert.equal(b.sections.gallery.items[0].serviceId, undefined, "borrar: la pieza que abría «blowdry» queda sin servicio (sin la clave)");
  assert.equal(b.sections.gallery.items[1].serviceId, "cut", "borrar: la pieza de «cut» no cambia");
  assert.deepEqual(b.sections.gallery.items.map((x: Cfg) => x.src), CONFIG.sections.gallery.items.map((x: Cfg) => x.src), "borrar: las piezas de la galería siguen todas");
  sinRefs(b, "blowdry", "borrar (lo que queda en la ficha)");
  sinRefs(guardado(b), "blowdry", "borrar (lo que queda en Firestore)");

  // (4) Borrar el único destacado: featured no puede quedar con el id viejo en Firestore (merge conserva la clave que falta).
  const unico: Cfg = structuredClone(CONFIG); unico.sections.services.featured = ["blowdry"];
  const bu = quitar(unico, 1);
  const gu = fusionar(unico, m.paraFirestore(m.borradosIdioma(unico, porJson(bu))));
  assert.ok(!(gu.sections?.services?.featured ?? []).includes("blowdry"), `borrar el único destacado: Firestore no conserva featured ["blowdry"] (queda ${JSON.stringify(gu.sections?.services?.featured)})`);
  assert.equal(m.bloquea(gu), false, "borrar el único destacado: lo guardado no bloquea");

  // (5) Renombrar «cut» → «corte» (posición 0).
  const r = renombrar(CONFIG, 0, "corte");
  assert.deepEqual(r.services.map((s: Cfg) => s.id), ["corte", "blowdry", "color"], "renombrar: la raíz cambia el id");
  assert.equal(r.services[0].name, "תספורת", "renombrar: el resto del servicio no cambia");
  assert.deepEqual(r.sections.services.images, CONFIG.sections.services.images, "renombrar: las fotos no cambian");
  assert.deepEqual(r.sections.services.featured, ["corte", "blowdry"], "renombrar: featured cambia el id en su lugar");
  assert.equal(r.sections.gallery.items[1].serviceId, "corte", "renombrar: la pieza de «cut» apunta a «corte»");
  assert.equal(r.sections.gallery.items[0].serviceId, "blowdry", "renombrar: la otra pieza no cambia");
  assert.deepEqual([idsEnCapa(r, "en"), idsEnCapa(r, "ar")].map((x) => x.sort()), [["blowdry", "color", "corte"], ["blowdry", "corte"]], "renombrar: el texto por idioma pasa a «corte» (en objeto, ar array)");
  assert.ok(textos(r).some(([ruta, v]) => /translations\.en\.services\.corte\.name$/.test(ruta) && v === "Haircut"), "renombrar: en conserva su texto bajo «corte»");
  sinRefs(r, "cut", "renombrar (lo que queda en la ficha)");
  sinRefs(guardado(r), "cut", "renombrar (lo que queda en Firestore)");

  // (6) No pisa: un id nuevo vacío o de otro servicio no mueve nada de lo de ese otro servicio.
  const choque = renombrar(CONFIG, 0, "blowdry");
  assert.deepEqual(choque.sections.services.featured, ["cut", "blowdry"].map((x) => x), "id de otro servicio: featured no cambia (no se pisa)");
  assert.equal(choque.sections.gallery.items[0].serviceId, "blowdry", "id de otro servicio: la pieza de «blowdry» sigue con «blowdry»");
  assert.equal(choque.translations.en.services.blowdry.name, "Blow-dry", "id de otro servicio: el texto en de «blowdry» no se pisa");
  const vacio = renombrar(CONFIG, 0, "");
  assert.deepEqual(vacio.sections.services.featured, CONFIG.sections.services.featured, "id vacío: featured no cambia");
  assert.equal(vacio.sections.gallery.items[1].serviceId, "cut", "id vacío: la pieza no cambia");

  // (7) Mover «color» (posición 2) al principio: su foto va con él; los ids, featured, la galería y el texto no cambian.
  const mv = m.ed.moverServicio as (c: Cfg, desde: number, hasta: number) => Cfg;
  const soloMover: Cfg = { ...structuredClone(CONFIG), services: [CONFIG.services[2], CONFIG.services[0], CONFIG.services[1]] };
  assert.deepEqual(soloMover.sections.services.images, CONFIG.sections.services.images, "control: mover sólo services deja las fotos donde estaban (la de «cut» pasa a «color»)");
  const mo = mv(CONFIG, 2, 0);
  assert.deepEqual(mo.services.map((s: Cfg) => s.id), ["color", "cut", "blowdry"], "mover: el orden de la raíz cambia");
  const [i1, i2, i3] = CONFIG.sections.services.images;
  assert.deepEqual(mo.sections.services.images, [i3, i1, i2], "mover: cada foto sigue con su servicio");
  assert.deepEqual(mo.sections.services.featured, CONFIG.sections.services.featured, "mover: featured no cambia");
  assert.deepEqual(mo.sections.gallery, CONFIG.sections.gallery, "mover: la galería no cambia");
  assert.deepEqual(mo.translations, CONFIG.translations, "mover: el texto por idioma (por id) no cambia");
  assert.equal(m.bloquea(mo), false, "mover: el guardado no se bloquea");
  const gm = guardado(mo);
  assert.deepEqual(gm.sections.services.images, [i3, i1, i2], "mover: Firestore guarda cada foto con su servicio");

  // (8) Puras.
  assert.deepEqual(CONFIG, antes, "quitarServicio, renombrarServicio y moverServicio no mutan el config que reciben");
});

test("la casilla de servicios aplica `quitarServicio` al borrar, `renombrarServicio` al cambiar el id y `moverServicio` al reordenar, cada una dentro de un único `setConfig`, y la ficha sigue guardando `borradosIdioma(antes, ahora)`", () => {
  const src = fuente(CASILLA).replace(/\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, "");
  // (1) El campo del id: hoy `onChange={(v) => update(i, { id: v })}`, que cambia sólo la raíz. Aquí está el rojo.
  // (assert.ok y no assert.match: el mensaje de falla no vuelca la fuente entera.)
  assert.ok(/\brenombrarServicio\(\s*prev\b[^)]*\)/.test(src), `${CASILLA}: el campo «ID (slug, unico)» cambia el id con renombrarServicio(prev, …) dentro de un setConfig (hoy update(i, { id: v }) cambia sólo la raíz)`);
  assert.ok(!/update\(\s*i\s*,\s*\{\s*id\s*:/.test(src), `${CASILLA}: el id ya no se cambia con update(i, { id }) (sólo la raíz)`);
  const dentroDeSetConfig = (fn: string) => new RegExp(`(?:setConfig|escribir)\\(\\s*\\(\\s*prev\\s*\\)\\s*=>\\s*${fn}\\(`).test(src);
  assert.ok(dentroDeSetConfig("renombrarServicio"), `${CASILLA}: renombrarServicio se aplica dentro de un único setConfig (o escribir)`);
  assert.ok(dentroDeSetConfig("quitarServicio"), `${CASILLA}: remove() aplica quitarServicio dentro de un único setConfig (o escribir)`);
  assert.ok(dentroDeSetConfig("moverServicio"), `${CASILLA}: move() aplica moverServicio dentro de un único setConfig (o escribir) (hoy onChange(moveItem(services, …)) mueve sólo la raíz)`);
  assert.ok(!/onChange\(\s*moveItem\(\s*services\b/.test(src), `${CASILLA}: el orden ya no se cambia con onChange(moveItem(services, …)) (sólo la raíz)`);
  // (2) El guardado sigue pasando por borradosIdioma.
  assert.ok(/borradosIdioma\(\s*originalConfigRef\.current\s*,\s*payload\s*\)/.test(fuente("src/components/client-config-tab.tsx")), "client-config-tab.tsx: el PUT manda borradosIdioma(originalConfigRef.current, payload)");
});
