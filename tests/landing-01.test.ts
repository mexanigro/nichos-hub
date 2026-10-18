// LANDING-01 (2026-10-18): arzac.studio dice lo que se vende hoy. Guard del precio (sale de src/lib/pricing.ts, nunca a mano),
// de la paridad de los cinco idiomas, de lo que se borró (mascota, agente, rediseño, manifiesto, logos, fundador) y de lo que
// la landing no puede prometer (agente de IA, Cardcom sin certificar, alta).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { MONTHLY_AMOUNT } from "../src/lib/pricing.ts";
import { aplicarPrecios, precio } from "../src/lib/i18n/precios.ts";
import { LEGAL } from "../src/lib/i18n/legal.ts";
import { es } from "../src/lib/i18n/locales/es.ts";
import { en } from "../src/lib/i18n/locales/en.ts";
import { he } from "../src/lib/i18n/locales/he.ts";
import { ru } from "../src/lib/i18n/locales/ru.ts";
import { ar } from "../src/lib/i18n/locales/ar.ts";

const ROOT = resolve(import.meta.dirname, "..");
const leer = (p: string) => readFileSync(resolve(ROOT, p), "utf8");
const LOCALES = { es, en, he, ru, ar } as const;
type L = keyof typeof LOCALES;
const CLAVES = ["meta", "a11y", "nav", "hero", "showcase", "crm", "everything", "process", "pricing", "faq", "final", "foot"] as const;
const landing = (t: object) => Object.fromEntries(CLAVES.map((k) => [k, (t as Record<string, unknown>)[k]]));
const textos = (v: unknown): string[] =>
  typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(textos) : v && typeof v === "object" ? Object.values(v).flatMap(textos) : [];
// Cualquier cifra de cuota o de alta escrita a mano: 250, 1500 / 1,500 / 1.500 / 1 500, 1000, y las mismas en dígitos árabe-índicos.
const CIFRA = /(^|[^\d])(250|1[.,\s ]?500|1[.,\s ]?000)(?!\d)|[٢][٥][٠]|[١][,٬.]?[٥][٠][٠]/;

function forma(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(forma);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, forma(x)]));
  return typeof v;
}

test("los cinco locales tienen la misma forma en las claves de la landing (mismas claves, mismo largo de cada lista) y ninguna de las secciones borradas", () => {
  const base = forma(landing(es));
  for (const [l, t] of Object.entries(LOCALES)) {
    assert.deepEqual(forma(landing(t)), base, `${l}: misma forma que es`);
    for (const k of ["agent", "evergreen", "manifesto", "founder", "techStack", "whyLabel", "statusLine"])
      assert.ok(!(k in t), `${l}: la clave ${k} se borró`);
  }
});

test("ningún texto de la landing ni de /terms y /privacy escribe la cuota o un alta a mano: la cuota es {precio} y sale de MONTHLY_AMOUNT", () => {
  for (const [l, t] of Object.entries(LOCALES)) {
    for (const s of textos(landing(t))) assert.ok(!CIFRA.test(s), `${l}: cifra escrita a mano en «${s}»`);
    assert.ok(textos(landing(t)).some((s) => s.includes("{precio}")), `${l}: la landing nombra la cuota con {precio}`);
  }
  for (const [l, d] of Object.entries(LEGAL)) for (const s of textos(d)) assert.ok(!CIFRA.test(s), `legal ${l}: cifra escrita a mano en «${s}»`);
});

test("con aplicarPrecios el precio de la landing en los cinco idiomas es MONTHLY_AMOUNT: el plan, el hero, el FAQ y el título; no queda ningún {precio}; y sigue al monto (con otro monto, sale el otro)", () => {
  for (const [l, crudo] of Object.entries(LOCALES) as [L, typeof es][]) {
    const t = aplicarPrecios(crudo, l);
    assert.equal(t.pricing.plans[0].price, MONTHLY_AMOUNT, `${l}: plans[0].price`);
    for (const s of [t.hero.sub, t.pricing.sub, t.meta.title, t.everything.title]) assert.ok(s.includes(precio(l)), `${l}: «${s}» lleva ${precio(l)}`);
    assert.ok(t.faq.items.some((i) => i.a.includes(String(MONTHLY_AMOUNT))), `${l}: el FAQ dice la cuota`);
    assert.ok(!textos(t).some((s) => s.includes("{precio}")), `${l}: no queda {precio} sin reemplazar`);
    assert.ok(precio(l).includes(String(MONTHLY_AMOUNT)));
    const otro = aplicarPrecios(crudo, l, 999);
    assert.ok(otro.hero.sub.includes("999") && !otro.hero.sub.includes(String(MONTHLY_AMOUNT)), `${l}: el hero sigue al monto`);
    assert.equal(otro.pricing.plans[0].price, 999);
  }
});

test("la portada, el layout y los componentes de la landing no escriben precios a mano: page.tsx y layout.tsx toman MONTHLY_AMOUNT y el JSON-LD no ofrece alta", () => {
  const archivos = ["src/app/page.tsx", "src/app/layout.tsx", "src/components/landing/legal-page.tsx",
    ...readdirSync(resolve(ROOT, "src/components/landing")).map((f) => `src/components/landing/${f}`)];
  for (const f of archivos) {
    const sinComentarios = leer(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    assert.ok(!/(^|[^\d.])(250|1,?500|1\.500)(?![\d])/.test(sinComentarios.replace(/width=\{?\d+|height=\{?\d+|\d+px|w=\d+/g, "")), `${f}: precio escrito a mano`);
  }
  for (const f of ["src/app/page.tsx", "src/app/layout.tsx"]) assert.match(leer(f), /import \{ MONTHLY_AMOUNT \} from "@\/lib\/pricing"/, `${f} importa MONTHLY_AMOUNT`);
  const page = leer("src/app/page.tsx");
  assert.ok(!/הקמה חד-פעמית/.test(page), "page.tsx: sin «הקמה חד-פעמית»");
  assert.equal((page.match(/"@type": "Offer"/g) || []).length, 1, "un solo Offer: la cuota");
  assert.match(page, /images: \[\{ url: "\/og\.png"/, "page.tsx declara og:image");
});

test("lo que se borró no vuelve: la mascota (componente y public/mascot), el agente, el rediseño, el manifiesto, los logos de tecnología y el fundador", () => {
  for (const f of ["mascot", "agent-section", "evergreen", "manifesto", "tech-stack", "founder"])
    assert.ok(!existsSync(resolve(ROOT, `src/components/landing/${f}.tsx`)), `${f}.tsx borrado`);
  assert.ok(!existsSync(resolve(ROOT, "public/mascot")), "public/mascot borrado");
  const css = leer("src/app/globals.css");
  assert.ok(!/at-mascot|at-fresh|at-agent|at-mani|at-stack|at-founder|at-why/.test(css), "sin CSS de las secciones borradas");
  assert.ok(!/\.at\[data-vp/.test(css) && !/data-vp/.test(leer("src/components/landing/atelier-page.tsx")), "el escritorio va por @media, no por data-vp (CLS)");
});

test("la landing y los legales no prometen lo que no se vende: ni agente ni IA, ni Cardcom, ni alta, en los cinco idiomas", () => {
  // «ИИ» va aparte y sensible a mayúsculas: con /i, «фотографии» lo contiene.
  const PROHIBIDO_I = /\bIA\b|\bAI\b|agente|\bagents?\b|סוכן|בינה מלאכותית|агент|وكيل|ذكاء اصطناعي|Cardcom|alta única|setup fee:|הקמה חד-פעמית|разовое подключение|رسوم تأسيس لمرة/i;
  const PROHIBIDO = { test: (s: string) => PROHIBIDO_I.test(s) || /(^|[^А-Яа-яЁё])ИИ([^А-Яа-яЁё]|$)/.test(s) };
  for (const [l, t] of Object.entries(LOCALES)) for (const s of textos(landing(t))) assert.ok(!PROHIBIDO.test(s), `${l}: «${s}»`);
  for (const [l, d] of Object.entries(LEGAL)) for (const s of textos(d)) assert.ok(!PROHIBIDO.test(s.replace(/Anthropic: [^.]*\./, "")), `legal ${l}: «${s}»`);
});

test("el FAQ y los legales tienen las mismas preguntas y secciones en los cinco idiomas", () => {
  const n = (l: L) => LOCALES[l].faq.items.length;
  for (const l of Object.keys(LOCALES) as L[]) assert.equal(n(l), n("es"), `${l}: FAQ`);
  for (const l of Object.keys(LEGAL) as L[]) {
    assert.equal(LEGAL[l].terms.sections.length, LEGAL.es.terms.sections.length, `${l}: terms`);
    assert.equal(LEGAL[l].privacy.sections.length, LEGAL.es.privacy.sections.length, `${l}: privacy`);
    LEGAL[l].terms.sections.forEach((s, i) => assert.equal(s.li?.length ?? 0, LEGAL.es.terms.sections[i].li?.length ?? 0, `${l}: terms §${i + 1}`));
    LEGAL[l].privacy.sections.forEach((s, i) => assert.equal(s.li?.length ?? 0, LEGAL.es.privacy.sections[i].li?.length ?? 0, `${l}: privacy §${i + 1}`));
  }
});

test("la pestaña sigue al idioma aunque Next reponga el <title> del servidor, y el lector de pantalla no lee lo que no se ve: imágenes ocultas sin alt, respuestas cerradas del FAQ ocultas, contador y pasos sin invertir en RTL", () => {
  const page = leer("src/components/landing/atelier-page.tsx");
  assert.match(page, /document\.title !== titulo\) document\.title = titulo/, "repone el título del idioma");
  assert.match(page, /new MutationObserver\(reponer\)[\s\S]*mo\.observe\(document\.head/, "vigila el <head>, donde Next reescribe el título");
  const show = leer("src/components/landing/showcase.tsx"), crm = leer("src/components/landing/crm-section.tsx"), faq = leer("src/components/landing/faq.tsx");
  assert.match(show, /alt=\{s\.id === active \? t\.showcase\.sites\[s\.id\]\.name : ""\}/, "ejemplos: sólo la imagen visible tiene alt");
  assert.equal((crm.match(/alt=\{v\.id === active \?/g) || []).length, 2, "CRM: sólo la imagen visible tiene alt, en las dos escenas");
  assert.match(faq, /aria-hidden=\{!isOpen\} inert=\{!isOpen\}/, "FAQ: la respuesta cerrada no se lee ni recibe foco");
  assert.match(show, /className="count" dir="ltr"/, "el contador 05 / 06 no se invierte en RTL");
  assert.match(leer("src/app/globals.css"), /\.at-plan li::before \{ content: "—" \/ "";/, "el guion decorativo no se lee");
});
