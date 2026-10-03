// CIERRE-TRAMO-01 · C1, C3 (H) · la pestaña Contenido manda sólo lo que cambió (el caso S4 de la verificadora), la dirección del idioma
// base validada y la descripción de la marca en cada idioma. Sesión A (2026-10-03): tests rojos.
//
// C1 (c1 de la verificadora; Liam, D-220: «base, otros idiomas y FAQ»): `C:/t/verif7/p8-modelo.ts` midió, con la fusión `merge: true` de
// Firestore modelada, que con Contenido cargado ANTES de que Config guarde la dirección y la línea, guardar después Contenido con otro
// campo las devuelve a su valor anterior: `parcheDeContenido` manda en el idioma base TODOS los campos, en otro idioma todos los no
// vacíos, y el FAQ viaja siempre entero. Aquí se EJECUTA el camino (condición 1 del revisor de SERVICIOS-GALERIA-01): las funciones
// reales de la pestaña (`contenidoDeCapa`, `parcheDeContenido` y la nueva `faqDeContenido`), las de Config (`borradosIdioma`) y la que
// prepara el cuerpo para Firestore (`paraFirestore`), contra un documento en memoria que se funde como `set(…, { merge: true })`
// (`FieldValue.delete()` borra; un mapa se funde clave a clave; un array o un valor reemplazan).
// C3 (c2 de la verificadora; Liam, D-219): la dirección de la raíz no tenía validador, y la descripción de la marca no se podía escribir
// en otro idioma desde el hub. Las reglas, como D-205 para la dirección y la línea por idioma.
// Caja negra: las funciones de H por `import()` dinámico (el cargador de .ts/.tsx de `_comun.ts`). Sólo en H (inciso n). No escribe nada.
import { test } from "node:test";
import assert from "node:assert/strict";
import { importarModulo } from "./_comun.ts";

type Cfg = Record<string, any>;
type Issue = { path: string; severity: "error" | "warning" };
type Contenido = Record<string, string>;
const CONTENIDO = "src/components/client-content-tab.tsx";
const porJson = (c: Cfg): Cfg => JSON.parse(JSON.stringify(c));

test("la pestaña Contenido manda sólo lo que cambió respecto de lo cargado, en el idioma base, en otro idioma y en el FAQ: con Contenido cargado antes de que Config guarde la dirección y la línea de la marca, guardar después Contenido con otro campo cambiado deja la dirección y la línea que guardó Config y escribe el campo cambiado; un FAQ sin cambios no viaja y uno cambiado sí; vaciar un campo con valor sigue llegando (`\"\"` en la base, `null` en otro idioma); y sin cambios el cuerpo está vacío", async () => {
  const tab = await importarModulo(CONTENIDO);
  const cargar = tab.contenidoDeCapa as (c: Cfg, niche: string, idioma: string, esBase: boolean) => Contenido;
  const parche = tab.parcheDeContenido as (content: Contenido, previa: Contenido, esBase: boolean, idioma: string) => Cfg;
  const { paraFirestore } = (await importarModulo("src/lib/config-firestore.ts")) as { paraFirestore: (b: Cfg) => Cfg };
  const { borradosIdioma } = (await importarModulo("src/lib/textos-idioma.ts")) as { borradosIdioma: (a: unknown, b: Cfg) => Cfg };
  const FIRESTORE = "firebase-admin/firestore";
  const { FieldValue } = (await import(FIRESTORE)) as { FieldValue: any };
  const esMapa = (v: unknown): v is Cfg => !!v && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
  const esBorrar = (v: any) => v instanceof FieldValue && v.isEqual(FieldValue.delete());
  const fusionar = (doc: Cfg, data: Cfg): Cfg => {
    const out = structuredClone(doc);
    for (const [k, v] of Object.entries(data)) {
      if (esBorrar(v)) delete out[k];
      else if (esMapa(v) && Object.keys(v).length) out[k] = fusionar(esMapa(out[k]) ? out[k] : {}, v);
      else out[k] = structuredClone(v);
    }
    return out;
  };
  let FS: Cfg = {};
  const GET = () => porJson(FS);
  const PUT = (body: Cfg) => { if (Object.keys(body).length) FS = fusionar(FS, paraFirestore(porJson(body))); };
  const inicial = (): Cfg => ({
    business: { type: "peluqueria" },
    brand: { name: "נועה", tagline: "LINEA-VIEJA" },
    contact: { phone: "+972 3-000-0000", address: { street: "CALLE-VIEJA", district: "פלורנטין", cityStateZip: "תל אביב–יפו" } },
    hero: { titlePrefix: "x" },
    sections: { faq: { items: [{ question: "Q", answer: "A" }] } },
    translations: { en: { brand: { tagline: "EN-VIEJA" }, hero: { titlePrefix: "x-en" }, sections: { faq: { items: [{ question: "Qe", answer: "Ae" }] } } } },
  });

  // (1) El caso S4 en el idioma base. Hoy Contenido devuelve la dirección y la línea a su valor viejo: aquí está el rojo.
  FS = inicial();
  const rawBase = GET();
  const previaBase = cargar(rawBase, "peluqueria", "he", true);
  const config = GET();
  config.contact.address.street = "CALLE-NUEVA"; config.brand.tagline = "LINEA-NUEVA";
  PUT(borradosIdioma(rawBase, config));
  const cuerpoBase = parche({ ...previaBase, "hero.eyebrow": "EYEBROW" }, previaBase, true, "he");
  PUT(cuerpoBase);
  assert.deepEqual([FS.contact.address.street, FS.brand.tagline], ["CALLE-NUEVA", "LINEA-NUEVA"], `idioma base: la dirección y la línea que guardó Config siguen ahí después de guardar Contenido (cuerpo de Contenido: ${JSON.stringify(cuerpoBase)})`);
  assert.equal(FS.hero.eyebrow, "EYEBROW", "idioma base: el campo cambiado llega");
  assert.deepEqual(cuerpoBase, { hero: { eyebrow: "EYEBROW" } }, "idioma base: el cuerpo lleva sólo el campo cambiado");

  // (2) Lo mismo en otro idioma: Contenido en inglés cargado antes de que otra ventana guarde la línea en inglés.
  FS = inicial();
  const previaEn = cargar(GET(), "peluqueria", "en", false);
  PUT({ translations: { en: { brand: { tagline: "EN-NUEVA" } } } });
  const cuerpoEn = parche({ ...previaEn, "hero.eyebrow": "EYEBROW-EN" }, previaEn, false, "en");
  PUT(cuerpoEn);
  assert.equal(FS.translations.en.brand.tagline, "EN-NUEVA", `otro idioma: la línea que guardó la otra ventana sigue ahí (cuerpo de Contenido: ${JSON.stringify(cuerpoEn)})`);
  assert.deepEqual(cuerpoEn, { translations: { en: { hero: { eyebrow: "EYEBROW-EN" } } } }, "otro idioma: el cuerpo lleva sólo el campo cambiado");

  // (3) Vaciar sigue llegando, y sin cambios no viaja nada.
  assert.deepEqual(parche({ ...previaBase, "hero.titlePrefix": "" }, previaBase, true, "he"), { hero: { titlePrefix: "" } }, "idioma base: vaciar un campo con valor manda \"\"");
  assert.deepEqual(parche({ ...previaEn, "hero.titlePrefix": "" }, previaEn, false, "en"), { translations: { en: { hero: { titlePrefix: null } } } }, "otro idioma: vaciar un campo traducido manda null");
  assert.deepEqual(parche({ ...previaBase }, previaBase, true, "he"), {}, "idioma base sin cambios: cuerpo vacío");
  assert.deepEqual(parche({ ...previaEn }, previaEn, false, "en"), {}, "otro idioma sin cambios: cuerpo vacío");

  // (4) El FAQ: sólo si cambió (D-220).
  const faq = tab.faqDeContenido as ((items: unknown[], previos: unknown[], esBase: boolean, idioma: string) => Cfg) | undefined;
  assert.equal(typeof faq, "function", `${CONTENIDO} exporta faqDeContenido(items, previos, esBase, idioma)`);
  const items = [{ question: "Q", answer: "A" }];
  assert.deepEqual(faq!(items, structuredClone(items), true, "he"), {}, "un FAQ sin cambios no viaja");
  const otros = [{ question: "Q", answer: "A2" }];
  assert.deepEqual(faq!(otros, items, true, "he"), { sections: { faq: { items: otros } } }, "un FAQ cambiado viaja entero, en la raíz");
  assert.deepEqual(faq!(otros, items, false, "en"), { translations: { en: { sections: { faq: { items: otros } } } } }, "en otro idioma, en su capa");
});

test("el hub valida la dirección del idioma base y escribe la descripción de la marca en cada idioma: `validateConfig` da error por una `contact.address` de la raíz que no es un objeto, por un campo suyo que no es calle, barrio ni ciudad y por uno que no es texto, y nada con la dirección bien escrita; la pestaña Contenido tiene `brand.description` para todos los nichos y su guardado en otro idioma la escribe en `translations.<lang>.brand.description`; y `validateTextosPorIdioma` da error por una `translations.<lang>.brand.description` que no es texto y avisa cuando la raíz la tiene y la capa de ese idioma existe sin ella; sin nada de eso, nada", async () => {
  const v = await importarModulo("src/lib/config-validator.ts");
  const validateConfig = v.validateConfig as (c: unknown) => Issue[];
  const validar = v.validateTextosPorIdioma as (c: unknown) => Issue[];
  const base = { business: { type: "peluqueria" }, brand: { name: "נועה" }, contact: { phone: "+972 3-000-0000" } };
  const dir = (issues: Issue[]) => issues.filter((i) => /^contact\.address(\.|$)/.test(i.path)).map((i) => [i.path, i.severity]).sort();
  // (1) La dirección de la raíz. Hoy validateConfig no la mira: aquí está el rojo.
  assert.deepEqual(dir(validateConfig({ ...base, contact: { ...base.contact, address: { street: 7, numero: "12", district: "פלורנטין" } } })), [["contact.address.numero", "error"], ["contact.address.street", "error"]], "validateConfig: un campo que no es calle, barrio ni ciudad y uno que no es texto son error");
  assert.deepEqual(dir(validateConfig({ ...base, contact: { ...base.contact, address: "רחוב פלורנטין" } })), [["contact.address", "error"]], "validateConfig: una dirección que no es un objeto es error");
  assert.deepEqual(dir(validateConfig({ ...base, contact: { ...base.contact, address: { street: "רחוב פלורנטין", district: "פלורנטין", cityStateZip: "תל אביב–יפו" } } })), [], "validateConfig: la dirección bien escrita, nada");
  assert.deepEqual(dir(validateConfig(base)), [], "validateConfig: sin dirección, nada");

  // (2) La casilla: brand.description en Contenido para todos los nichos, y su guardado en otro idioma.
  const tab = await importarModulo(CONTENIDO);
  const secciones = tab.seccionesDeContenido as (niche: string) => { fields: { path: string }[] }[];
  for (const niche of ["peluqueria", "barberia", "cafeteria", "remodelaciones"]) {
    assert.ok(secciones(niche).flatMap((s) => s.fields.map((f) => f.path)).includes("brand.description"), `${niche}: la pestaña Contenido tiene brand.description`);
  }
  const parche = tab.parcheDeContenido as (content: Contenido, previa: Contenido, esBase: boolean, idioma: string) => Cfg;
  assert.deepEqual(parche({ "brand.description": "Noa — a hair salon" }, {}, false, "en"), { translations: { en: { brand: { description: "Noa — a hair salon" } } } }, "en otro idioma, la descripción va a translations.en.brand.description");

  // (3) El validador de la capa, en las dos direcciones.
  const desc = (issues: Issue[]) => issues.filter((i) => /\.brand\.description$/.test(i.path)).map((i) => [i.path, i.severity]).sort();
  const raiz = { ...base, brand: { ...base.brand, description: "נועה — מספרה לנשים" } };
  assert.deepEqual(desc(validar({ ...raiz, translations: { en: { brand: { description: 5 } } } })), [["translations.en.brand.description", "error"]], "una descripción que no es texto es error");
  assert.deepEqual(desc(validar({ ...raiz, translations: { ru: { sections: { faq: { title: "Вопросы" } } } } })), [["translations.ru.brand.description", "warning"]], "la capa ru existe sin la descripción que tiene la raíz: aviso");
  assert.deepEqual(desc(validar({ ...raiz, translations: { en: { brand: { description: "Noa — a hair salon" } } } })), [], "la capa con su descripción: nada");
  assert.deepEqual(desc(validar({ ...raiz, translations: { en: { brand: { description: null } } } })).filter(([, s]) => s === "error"), [], "null es un borrado, no un error");
  assert.deepEqual(desc(validar({ ...base, translations: { en: { sections: { faq: { title: "FAQ" } } } } })), [], "sin descripción en la raíz: nada que avisar");
});
