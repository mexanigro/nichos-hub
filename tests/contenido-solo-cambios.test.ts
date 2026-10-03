// CIERRE-TRAMO-01 · guard de C1 (D-220; caso S4 de la verificadora de CONTACTO-PIE-01). La pestaña Contenido manda sólo lo que cambió
// respecto de lo cargado, en el idioma base, en otro idioma y en el FAQ. Esto EJECUTA el camino de «Guardar»: lo que la pestaña carga
// (`contenidoDeCapa` y el FAQ de la capa), editado, el cuerpo que arma `cuerpoDeContenido` —el mismo que manda `handleSave`—,
// `paraFirestore` y la fusión `merge: true` modelada (como tests/contacto-pie-casillas.test.ts), en las dos direcciones: lo que otra
// pestaña guardó entre la carga y el guardado sigue ahí, y lo que se tocó (escribir, vaciar, el FAQ) sí llega y pisa.
// Sin navegador: los módulos con el cargador de .tsx de `./orden/arreglos-03/_comun.ts`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { FieldValue } from "firebase-admin/firestore";
import { importarModulo } from "./orden/arreglos-03/_comun.ts";

type Cfg = Record<string, any>;
type Faq = { question: string; answer: string };

const esMapa = (v: unknown): v is Cfg => !!v && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const esBorrar = (v: unknown) => v instanceof FieldValue && v.isEqual(FieldValue.delete());
/** `set(data, { merge: true })` de Firestore sobre `doc`. */
function fusionar(doc: Cfg, data: Cfg): Cfg {
  const out = structuredClone(doc);
  for (const [k, v] of Object.entries(data)) {
    if (esBorrar(v)) delete out[k];
    else if (esMapa(v) && Object.keys(v).length) out[k] = fusionar(esMapa(out[k]) ? out[k] : {}, v);
    else out[k] = structuredClone(v);
  }
  return out;
}

const inicial = (): Cfg => ({
  business: { type: "peluqueria" },
  brand: { name: "נועה", tagline: "LINEA", description: "DESC" },
  contact: { address: { street: "CALLE", district: "פלורנטין", cityStateZip: "תל אביב" } },
  hero: { titlePrefix: "x" },
  sections: { faq: { items: [{ question: "Q", answer: "A" }] } },
  translations: { en: { brand: { tagline: "EN-LINEA" }, hero: { titlePrefix: "x-en" }, sections: { faq: { items: [{ question: "Qe", answer: "Ae" }] } } } },
});

test("Contenido guardado con otra pestaña de por medio: conserva lo que la otra guardó y escribe sólo lo tocado (idioma base, otro idioma y FAQ)", async () => {
  const tab = await importarModulo("src/components/client-content-tab.tsx");
  const { paraFirestore } = (await importarModulo("src/lib/config-firestore.ts")) as { paraFirestore: (b: Cfg) => Cfg };
  const cargar = tab.contenidoDeCapa as (c: Cfg, niche: string, idioma: string, esBase: boolean) => Record<string, string>;
  const cuerpo = tab.cuerpoDeContenido as (cargado: Cfg, content: Record<string, string>, faq: Faq[], niche: string, idioma: string, esBase: boolean) => Cfg;
  const faqDe = (c: Cfg, idioma: string, esBase: boolean): Faq[] => structuredClone((esBase ? c : c.translations?.[idioma])?.sections?.faq?.items ?? []);

  for (const [idioma, esBase] of [["he", true], ["en", false]] as const) {
    let fs = inicial();
    const cargado = structuredClone(fs);
    const content = cargar(cargado, "peluqueria", idioma, esBase);
    const faq = faqDe(cargado, idioma, esBase);
    // Otra pestaña (Config, u otra ventana de Contenido) guarda la calle, la línea y la descripción entre la carga y el guardado.
    const capaOtra: Cfg = { brand: { tagline: `OTRA-${idioma}`, description: `OTRA-DESC-${idioma}` }, contact: { address: { street: `OTRA-CALLE-${idioma}` } } };
    fs = fusionar(fs, paraFirestore(esBase ? capaOtra : { translations: { [idioma]: capaOtra } }));
    const capa = (c: Cfg) => (esBase ? c : c.translations[idioma]);

    // (1) Sólo se toca el eyebrow: lo que guardó la otra pestaña sigue ahí, y el cuerpo lleva sólo el eyebrow.
    const b1 = cuerpo(cargado, { ...content, "hero.eyebrow": "EYEBROW" }, faq, "peluqueria", idioma, esBase);
    const fs1 = fusionar(fs, paraFirestore(b1));
    assert.deepEqual([capa(fs1).brand.tagline, capa(fs1).brand.description, capa(fs1).contact.address.street], [`OTRA-${idioma}`, `OTRA-DESC-${idioma}`, `OTRA-CALLE-${idioma}`], `${idioma}: lo que guardó la otra pestaña sigue ahí (cuerpo ${JSON.stringify(b1)})`);
    assert.equal(capa(fs1).hero.eyebrow, "EYEBROW", `${idioma}: el campo tocado llega`);
    assert.deepEqual(capa(fs1).sections.faq.items, faqDe(inicial(), idioma, esBase), `${idioma}: el FAQ sin tocar no viaja ni cambia`);
    assert.equal(JSON.stringify(b1).includes("faq"), false, `${idioma}: el FAQ sin tocar no va en el cuerpo`);

    // (2) La otra dirección: lo que sí se tocó llega y pisa — la línea escrita, el título vaciado y el FAQ cambiado.
    const nuevoFaq = [...faq, { question: "Q2", answer: "A2" }, { question: " ", answer: "" }];
    const b2 = cuerpo(cargado, { ...content, "brand.tagline": `MIA-${idioma}`, "hero.titlePrefix": "" }, nuevoFaq, "peluqueria", idioma, esBase);
    const fs2 = fusionar(fs, paraFirestore(b2));
    assert.equal(capa(fs2).brand.tagline, `MIA-${idioma}`, `${idioma}: la línea tocada pisa la de la otra pestaña`);
    assert.equal(capa(fs2).brand.description, `OTRA-DESC-${idioma}`, `${idioma}: la descripción sin tocar sigue siendo la de la otra pestaña`);
    if (esBase) assert.equal(fs2.hero.titlePrefix, "", "he: vaciar manda \"\" a la raíz");
    else assert.equal("titlePrefix" in fs2.translations.en.hero, false, "en: vaciar lo traducido lo borra de la capa");
    assert.deepEqual(capa(fs2).sections.faq.items, nuevoFaq.slice(0, -1), `${idioma}: el FAQ cambiado llega entero, sin la pregunta vacía`);

    // (3) Sin cambios, nada viaja.
    assert.deepEqual(cuerpo(cargado, { ...content }, faq, "peluqueria", idioma, esBase), {}, `${idioma}: sin cambios el cuerpo está vacío`);
  }
});
