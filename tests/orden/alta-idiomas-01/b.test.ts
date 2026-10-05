// ALTA-IDIOMAS-01 · B1, B2 (H) · Claude escribe SÓLO texto (punto 2). Sesión A (2026-10-05): rojo.
//
// El generador de hoy no tiene catálogo: el modelo devuelve el JSON que quiera y la pestaña lo funde en su estado, así que cualquier
// clave —un teléfono, un precio— se guardaría con «Guardar» (medido por lectura, D-236). B1 afirma el catálogo de lo que la página
// lee por idioma, `camposDeTexto(config, niche, idioma, base)`, separado de los datos (D-242): el texto, sí; precios, `priceMax`,
// duración, `mode`, ids, fotos, orden, teléfono, email y horarios, nunca. En el idioma base sólo lo vacío y nunca un hecho que la
// clienta no dio (la dirección, el nombre de una persona o de un servicio, el FAQ, las reseñas: D-238). Para la flota (D-241), los
// campos de la pestaña Contenido de su nicho. B2 lo ejecuta: la propuesta entera, aceptada, guardada con el cuerpo de la ficha y la
// fusión `merge: true` de Firestore modelada, cambia sólo texto; y una propuesta con rutas de dato las marca y no las manda.
import { test } from "node:test";
import assert from "node:assert/strict";
import { IDIOMAS, clienteFalso, cumplidor, existe, fixtureA, guardarEnFirestore, importarModulo, sinCapas, type Cfg, type Issue } from "./_comun.ts";

const MODULO = "src/lib/textos-claude.ts";
/** Último segmento de una ruta de texto (D-242); `sections.gallery.alts.<id>` aparte. */
const HOJAS_DE_TEXTO = new Set(["eyebrow", "titlePrefix", "titleHighlight", "titleSuffix", "subtitle", "ctaPrimary", "ctaSecondary", "title", "description", "tagline", "intro", "street", "district", "cityStateZip", "name", "specialty", "bio", "text", "service", "question", "answer"]);
const esTexto = (ruta: string) => /^sections\.gallery\.alts\.[^.]+$/.test(ruta) || HOJAS_DE_TEXTO.has(ruta.split(".").pop() ?? "");
const DATO = /(^|\.)(price|priceMax|duration|mode|id|photoUrl|image|images|src|rating|phone|email|hours|schedule|variant|surface|url|lang|popular|featured|selection|type|order)(\.|$)/;
const rutas = (m: Cfg, c: Cfg, niche: string, idioma: string, base = "he") => (m.camposDeTexto(c, niche, idioma, base) as { ruta: string }[]).map((x) => x.ruta);
const get = (o: unknown, p: string) => p.split(".").reduce<any>((a, k) => (a && typeof a === "object" ? a[k] : undefined), o);
/** El valor de una ruta en el idioma base (la raíz): los elementos de services/staff/testimonials y las piezas de galería, por id. */
function valorBase(c: Cfg, ruta: string): unknown {
  const [s, id, campo] = ruta.split(".");
  if (["services", "staff", "testimonials"].includes(s)) return (Array.isArray(c[s]) ? c[s] : []).find((x: Cfg) => x?.id === id)?.[campo];
  if (ruta.startsWith("sections.gallery.alts.")) return (c.sections?.gallery?.items ?? []).find((x: Cfg) => x?.id === ruta.split(".").pop())?.alt;
  return get(c, ruta);
}

test("`camposDeTexto` lista los textos que la página lee por idioma y ningún dato: con el fixture A sin capas, en inglés trae el hero, los encabezados, la marca, la dirección, el nombre y la frase de cada servicio, el nombre, la especialidad y la bio de cada persona, cada reseña y su servicio, el título de Instagram y el alt de cada pieza de la galería, y ninguna ruta de precio, priceMax, duración, mode, id, foto, orden, teléfono, email ni horario; en el idioma base, sólo lo que está vacío y ningún hecho (dirección, nombres, FAQ, reseñas); y para barbería, los campos de la pestaña Contenido de su nicho", async () => {
  assert.ok(existe(MODULO), `falta ${MODULO} (D-242): hoy no hay catálogo y cualquier clave que devuelva Claude se guarda`);
  const m = await importarModulo(MODULO);
  const A = sinCapas(fixtureA());
  // (1) Inglés: todo el texto.
  const en = new Set(rutas(m, A, "peluqueria", "en"));
  // A2 (D-247): también el título de Instagram (instagram-v6, sin campo en Contenido) y el servicio de cada reseña (testimonials-v6).
  const pide: string[] = ["hero.eyebrow", "hero.titlePrefix", "hero.titleHighlight", "hero.subtitle", "hero.ctaPrimary", "hero.ctaSecondary", "sections.team.title", "sections.instagram.title", "brand.tagline", "brand.description", "contact.address.street", "contact.address.district", "contact.address.cityStateZip"];
  for (const s of A.services) pide.push(`services.${s.id}.name`, `services.${s.id}.description`);
  for (const s of A.staff) pide.push(`staff.${s.id}.name`, `staff.${s.id}.specialty`, `staff.${s.id}.bio`);
  for (const r of A.testimonials) pide.push(`testimonials.${r.id}.text`, ...(r.service ? [`testimonials.${r.id}.service`] : []));
  for (const g of A.sections.gallery.items) pide.push(`sections.gallery.alts.${g.id}`);
  const faltan = pide.filter((r) => !en.has(r));
  assert.deepEqual(faltan, [], `camposDeTexto(A, "peluqueria", "en", "he") trae todo el texto (faltan ${faltan.length})`);
  // (2) Ningún dato, en ningún idioma.
  for (const l of IDIOMAS) {
    const malas = rutas(m, A, "peluqueria", l).filter((r) => DATO.test(r) || !esTexto(r));
    assert.deepEqual(malas, [], `camposDeTexto en ${l} no trae datos (D-242)`);
  }
  // (3) El idioma base: sólo lo vacío, y ningún hecho que la clienta no dio.
  const he = rutas(m, A, "peluqueria", "he");
  assert.ok(he.includes("sections.team.title"), "en el idioma base trae lo vacío (sections.team.title no está en la raíz de A: D-238)");
  const llenas = he.filter((r) => { const v = valorBase(A, r); return typeof v === "string" && v.trim() !== ""; });
  assert.deepEqual(llenas, [], "en el idioma base no reescribe lo que la clienta escribió (D-238)");
  const hechos = he.filter((r) => /^contact\.address\.|^staff\.[^.]+\.name$|^services\.[^.]+\.name$|^sections\.faq\.items|^testimonials\./.test(r));
  assert.deepEqual(hechos, [], "en el idioma base no completa hechos: dirección, nombres, FAQ ni reseñas (D-238)");
  // (4) La flota (D-241): barbería, sin nada escrito, recibe los campos de su pestaña Contenido (menos la dirección, que es un hecho).
  const tab = await importarModulo("src/components/client-content-tab.tsx");
  const contenido = (tab.seccionesDeContenido("barberia") as { fields: { path: string }[] }[]).flatMap((s) => s.fields.map((f) => f.path)).filter((p) => !p.startsWith("contact.address."));
  const barberia = new Set(rutas(m, { business: { type: "barberia" } }, "barberia", "he"));
  assert.deepEqual(contenido.filter((p) => !barberia.has(p)), [], "para barbería, camposDeTexto trae los campos de Contenido de su nicho (D-241)");
});

test("aplicar la propuesta entera —aceptada, guardada con `cuerpoDePropuesta` y la fusión de Firestore— cambia sólo texto: ids, precios, priceMax, duración, mode, fotos, orden y cantidad de servicios, equipo, reseñas y galería, teléfono, email y horarios quedan iguales en la raíz, y cada capa lleva sólo texto; y una propuesta con rutas de dato (contact.phone, services.cut.price, un servicio que no existe) las da como error y no las manda", async () => {
  assert.ok(existe(MODULO), `falta ${MODULO} (D-242)`);
  const m = await importarModulo(MODULO);
  const A = sinCapas(fixtureA());
  const { cliente } = clienteFalso(cumplidor);
  const { propuesta, errores } = await m.escribirTextos(cliente, { config: A, niche: "peluqueria", base: "he" });
  assert.deepEqual((errores as Issue[]).filter((e) => e.severity === "error"), [], "la propuesta de un modelo que cumple no tiene errores");
  const aceptados = IDIOMAS.flatMap((l) => Object.keys(propuesta[l] ?? {}).map((r) => `${l}:${r}`));
  const doc = await guardarEnFirestore(A, m.cuerpoDePropuesta(A, "peluqueria", "he", propuesta, aceptados));

  // (1) Llegó el texto: base a la raíz, los demás a su capa.
  assert.equal(doc.sections?.team?.title, propuesta.he["sections.team.title"], "el idioma base completa la raíz");
  assert.equal(doc.translations?.ru?.hero?.subtitle, propuesta.ru["hero.subtitle"], "ru: hero.subtitle en translations.ru");
  assert.equal(doc.translations?.en?.services?.[A.services[0].id]?.name, propuesta.en[`services.${A.services[0].id}.name`], "en: el nombre de un servicio en translations.en.services.<id>");
  // (2) La raíz: todo lo que no es texto, igual.
  /** La raíz sin ninguna hoja de texto (ni la dirección, ni el alt de las piezas) y sin los objetos que quedan vacíos: lo que queda
   *  son los datos. */
  const sinTexto = (c: Cfg): Cfg => {
    const { translations: _t, ...r } = structuredClone(c);
    delete r.contact?.address;
    const podar = (o: unknown): unknown => {
      if (Array.isArray(o)) return o.map(podar);
      if (!o || typeof o !== "object") return o;
      const out: Cfg = {};
      for (const [k, v] of Object.entries(o)) {
        if (typeof v === "string" && (HOJAS_DE_TEXTO.has(k) || k === "alt")) continue;
        const p = podar(v);
        if (p && typeof p === "object" && !Array.isArray(p) && !Object.keys(p).length) continue;
        out[k] = p;
      }
      return out;
    };
    return podar(r) as Cfg;
  };
  assert.deepEqual(sinTexto(doc), sinTexto(A), "en la raíz, ningún dato cambió (ids, precios, priceMax, duración, mode, fotos, orden, cantidad, teléfono, email, horarios)");
  assert.deepEqual(doc.testimonials, A.testimonials, "las reseñas de la raíz quedan como las escribió su autora");
  // (3) Cada capa: sólo texto, y por id.
  for (const l of ["en", "ru", "ar"]) {
    const hojas: string[] = [];
    const juntar = (o: unknown, p: string) => { if (o && typeof o === "object" && !Array.isArray(o)) for (const [k, v] of Object.entries(o)) juntar(v, p ? `${p}.${k}` : k); else hojas.push(p); };
    juntar(doc.translations?.[l], "");
    const malas = hojas.filter((h) => DATO.test(h) || !esTexto(h));
    assert.deepEqual(malas, [], `translations.${l} lleva sólo texto`);
    assert.ok(!Array.isArray(doc.translations?.[l]?.services), `translations.${l}.services es un objeto por id`);
  }
  // (4) Rutas de dato en la propuesta: error, y no se mandan.
  const mala = { en: { "contact.phone": "cero cinco", "services.cut.price": "uno", "services.inventado.name": "Servicio nuevo", "hero.subtitle": "Color con calma" } };
  const caminos = (m.validarPropuesta(A, "peluqueria", "he", mala) as Issue[]).filter((e) => e.severity === "error").map((e) => e.path);
  for (const p of ["en:contact.phone", "en:services.cut.price", "en:services.inventado.name"]) assert.ok(caminos.includes(p), `validarPropuesta da error en ${p} (es dato o no existe; hubo: ${caminos.join(", ")})`);
  assert.ok(!caminos.includes("en:hero.subtitle"), "un texto válido no da error");
  const doc2 = await guardarEnFirestore(A, m.cuerpoDePropuesta(A, "peluqueria", "he", mala, Object.keys(mala.en).map((r) => `en:${r}`)));
  assert.equal(doc2.contact.phone, A.contact.phone, "el teléfono no cambia");
  assert.deepEqual(doc2.services, A.services, "los servicios de la raíz no cambian");
  assert.equal(doc2.translations?.en?.services, undefined, "no aparece un servicio que no existe ni un precio en la capa");
  assert.equal(doc2.translations?.en?.contact, undefined, "el teléfono no llega a la capa");
  assert.equal(doc2.translations?.en?.hero?.subtitle, "Color con calma", "lo válido sí se guarda");
});
