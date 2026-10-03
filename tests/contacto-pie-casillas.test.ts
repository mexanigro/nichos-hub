// CONTACTO-PIE-01 · guard de la condición 1 del revisor (aprobada por Liam, 2026-10-03). C3, C5 y E2 de la orden prueban las funciones y
// leen la casilla montada; esto EJECUTA el camino de cada casilla y lleva el resultado a lo que queda en Firestore con la fusión
// `merge: true` modelada (como tests/casillas-sin-huecos.test.ts, D-34), en las dos direcciones:
// (1) la dirección y la línea de la marca por idioma (pestaña Contenido): lo que la pestaña carga para un idioma (`contenidoDeCapa`),
//     editado y guardado con el cuerpo que arma `parcheDeContenido` —el mismo que manda `handleSave`—, pasa por `paraFirestore` y la
//     fusión: escribir llega a `translations.<lang>`, vaciar lo ya traducido lo borra (y el validador vuelve a avisar), el idioma base
//     escribe la raíz y sin cambios no se manda nada;
// (2) la casilla de variantes (`LayoutVariantsEditor`, un componente sin estado: se llama como función y se recorren sus elementos):
//     se toca el botón v6 de contacto y del pie en peluquería y lo guardado lo tiene; en barbería no hay ese botón, y con una v6 guardada
//     el bloque la nombra con «no está disponible para este nicho» y tocar v1 la borra.
// Sin navegador: los módulos con el cargador de .tsx de `./orden/arreglos-03/_comun.ts`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import { ROOT, importarModulo } from "./orden/arreglos-03/_comun.ts";

type Cfg = Record<string, any>;
type Issue = { path: string; message: string; severity: "error" | "warning" };

const esMapa = (v: unknown): v is Cfg => !!v && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const esBorrar = (v: unknown) => v instanceof FieldValue && v.isEqual(FieldValue.delete());
/** `set(data, { merge: true })` de Firestore sobre `doc` (copiado de tests/casillas-sin-huecos.test.ts). */
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

const DOC: Cfg = {
  business: { type: "peluqueria" },
  brand: { name: "נועה", tagline: "צבע ושיער" },
  contact: { phone: "+972 3-000-0000", address: { street: "רחוב פלורנטין", district: "פלורנטין", cityStateZip: "תל אביב–יפו" } },
  translations: { en: { sections: { faq: { title: "FAQ" } } } },
};

test("la pestaña Contenido guarda la dirección y la línea de la marca en cada idioma: lo que carga, editado y guardado con su cuerpo, queda en translations.<lang> después de la fusión; vaciarlo lo borra y el validador vuelve a avisar; el idioma base escribe la raíz; sin cambios no se manda nada", async () => {
  const tab = await importarModulo("src/components/client-content-tab.tsx");
  const cf = await importarModulo("src/lib/config-firestore.ts");
  const v = await importarModulo("src/lib/config-validator.ts");
  const cargar = tab.contenidoDeCapa as (c: Cfg, niche: string, idioma: string, esBase: boolean) => Record<string, string>;
  const parche = tab.parcheDeContenido as (content: Record<string, string>, previa: Record<string, string>, esBase: boolean, idioma: string) => Cfg;
  const paraFirestore = cf.paraFirestore as (c: Cfg) => Cfg;
  const validateConfig = v.validateConfig as (c: unknown) => Issue[];
  const de = (doc: Cfg, lang: string) => validateConfig(doc).filter((i) => i.path.startsWith(`translations.${lang}.`) && /contact\.address|brand\.tagline/.test(i.path)).map((i) => `${i.path} ${i.severity}`).sort();
  // «Guardar» en la casilla: lo que `handleSave` hace con lo que muestra la pestaña.
  const guardar = (doc: Cfg, idioma: string, esBase: boolean, editar: (c: Record<string, string>) => void) => {
    const previa = cargar(doc, "peluqueria", idioma, esBase);
    const content = { ...previa }; editar(content);
    const body = parche(content, previa, esBase, idioma);
    return { body, doc: Object.keys(body).length ? fusionar(doc, paraFirestore(porJson(body))) : doc };
  };

  // Antes: la capa en existe sin la dirección ni la línea → cuatro avisos.
  assert.equal(de(DOC, "en").filter((x) => x.endsWith("warning")).length, 4, `la capa en sin dirección ni línea avisa por cada campo (${de(DOC, "en")})`);
  // (a) Escribir en inglés.
  const en = guardar(DOC, "en", false, (c) => Object.assign(c, { "contact.address.street": "Florentin St", "contact.address.district": "Florentin", "contact.address.cityStateZip": "Tel Aviv-Yafo", "brand.tagline": "Colour & hair" }));
  assert.deepEqual(en.doc.translations.en.contact.address, { street: "Florentin St", district: "Florentin", cityStateZip: "Tel Aviv-Yafo" }, "la dirección en inglés quedó en translations.en");
  assert.equal(en.doc.translations.en.brand.tagline, "Colour & hair", "la línea en inglés quedó en translations.en");
  assert.equal(en.doc.translations.en.sections.faq.title, "FAQ", "la fusión no tocó el resto de la capa");
  assert.equal(en.doc.contact.address.street, "רחוב פלורנטין", "la raíz sigue en hebreo");
  assert.deepEqual(de(en.doc, "en"), [], "con la capa completa, el validador no dice nada");
  assert.deepEqual(cargar(en.doc, "peluqueria", "en", false)["brand.tagline"], "Colour & hair", "al volver a abrir la pestaña en inglés, se ve lo guardado");
  // (b) Vaciar lo ya traducido: se borra en Firestore y vuelve el aviso.
  const vacia = guardar(en.doc, "en", false, (c) => { c["brand.tagline"] = ""; });
  assert.equal(vacia.body.translations.en.brand.tagline, null, "vaciar manda null");
  assert.ok(!("tagline" in (vacia.doc.translations.en.brand ?? {})), "y Firestore borra la clave");
  assert.deepEqual(de(vacia.doc, "en"), ["translations.en.brand.tagline warning"], "el validador vuelve a avisar por la línea que falta");
  // (c) El idioma base escribe la raíz, no la capa.
  const base = guardar(DOC, "he", true, (c) => { c["contact.address.street"] = "רחוב המנופים"; });
  assert.equal(base.doc.contact.address.street, "רחוב המנופים", "en el idioma base, la raíz");
  assert.deepEqual(base.doc.translations, DOC.translations, "y la capa en no cambia");
  // (d) Sin cambios, nada que mandar.
  assert.deepEqual(guardar(en.doc, "en", false, () => {}).body.translations.en.contact.address.street, "Florentin St", "lo cargado se reenvía igual");
  assert.deepEqual(guardar({ ...DOC, translations: {} }, "ru", false, () => {}).body, {}, "una capa vacía sin cambios: cuerpo vacío (no se manda)");
  // (e) La casilla usa ese camino: handleSave arma el cuerpo con parcheDeContenido y lo que carga con contenidoDeCapa.
  const fuente = readFileSync(resolve(ROOT, "src/components/client-content-tab.tsx"), "utf8");
  const save = fuente.slice(fuente.indexOf("async function handleSave"), fuente.indexOf("async function handleGenerate"));
  assert.match(save, /parcheDeContenido\(content, contenidoDeCapa\(rawConfig, niche, editLang, isBase\), isBase, editLang\)/, "handleSave usa parcheDeContenido y contenidoDeCapa");
});

type El = { type: unknown; key?: string | null; props: Cfg };
const elementos = (n: unknown, out: El[] = []): El[] => {
  if (Array.isArray(n)) n.forEach((x) => elementos(x, out));
  else if (n && typeof n === "object" && "props" in (n as Cfg)) { out.push(n as El); elementos((n as El).props.children, out); }
  return out;
};
const texto = (n: unknown): string => Array.isArray(n) ? n.map(texto).join("") : typeof n === "string" || typeof n === "number" ? String(n) : n && typeof n === "object" && "props" in (n as Cfg) ? texto((n as El).props.children) : "";

test("la casilla de variantes: tocar v6 de contacto y del pie en peluquería lo guarda; en barbería no está el botón, y con una v6 guardada el bloque la nombra con «no está disponible para este nicho» y tocar v1 la borra", async () => {
  const mod = await importarModulo("src/components/config-editors/layout-variants-editor.tsx");
  const Editor = mod.LayoutVariantsEditor as (p: Cfg) => El;
  const cf = await importarModulo("src/lib/config-firestore.ts");
  const paraFirestore = cf.paraFirestore as (c: Cfg) => Cfg;
  const get = (doc: Cfg, path: string) => path.split(".").reduce((a: any, k) => a?.[k], doc);
  /** Monta la casilla sobre `doc`, toca el botón `v` del bloque `path` y devuelve el doc guardado (o null si el botón no está). */
  const tocar = (doc: Cfg, niche: string, path: string, v: string): Cfg | null => {
    let escrito: Cfg | null = null;
    const arbol = Editor({ getNested: (p: string) => get(doc, p), updateNested: (p: string, valor: unknown) => { const parche: Cfg = {}; const ks = p.split("."); let o = parche; for (const k of ks.slice(0, -1)) o = o[k] = {}; o[ks[ks.length - 1]] = valor; escrito = fusionar(doc, paraFirestore(porJson(parche))); }, niche });
    const bloque = elementos(arbol).find((e) => e.key === path);
    const boton = bloque && elementos(bloque.props.children).find((e) => e.type === "button" && texto(e.props.children) === v);
    if (!boton) return null;
    boton.props.onClick();
    return escrito;
  };
  const bloque = (doc: Cfg, niche: string, path: string) => texto(elementos(Editor({ getNested: (p: string) => get(doc, p), updateNested: () => {}, niche })).find((e) => e.key === path)?.props.children);

  for (const path of ["sections.contact.variant", "footer.variant"]) {
    const pelu = tocar({ business: { type: "peluqueria" } }, "peluqueria", path, "v6");
    assert.ok(pelu, `peluquería: el bloque ${path} tiene el botón v6`);
    assert.equal(get(pelu!, path), "v6", `peluquería: tocar v6 guarda ${path} = v6`);
    assert.doesNotMatch(bloque(pelu!, "peluqueria", path), /no está disponible/, `peluquería: con ${path} = v6, sin la frase`);
    assert.equal(tocar({ business: { type: "barberia" } }, "barberia", path, "v6"), null, `barbería: ${path} no tiene el botón v6`);
    const ajeno = { ...porJson(pelu!), business: { type: "barberia" } };
    const t = bloque(ajeno, "barberia", path);
    assert.match(t, /no está disponible para este nicho/, `barbería con ${path} = v6 guardado: la casilla lo dice (${t.slice(0, 80)})`);
    assert.ok(!t.includes("Original"), `barbería con ${path} = v6 guardado: no muestra «Original»`);
    const v1 = tocar(ajeno, "barberia", path, "v1");
    assert.ok(v1 && get(v1, path) === undefined, `barbería: tocar v1 borra ${path} (queda ${v1 && get(v1, path)})`);
    assert.doesNotMatch(bloque(v1!, "barberia", path), /no está disponible/, "y la frase se va");
  }
});
