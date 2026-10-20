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

test("fuera de la landing tampoco se promete lo que no se vende: el embudo público cerrado sin la compra web, el asistente de ventas con la oferta de hoy, los mails y los textos de cobro sin agente, sin Google Business, sin «una hora» ni 24 h, y la vitrina sin enlazar demos", () => {
  // El embudo público (formulario → vista previa → deploy) cerrado mientras la venta sea en persona.
  assert.match(leer("src/app/onboarding/free/page.tsx"), /if \(!isWebCheckoutEnabled\(\)\) redirect\(/, "/onboarding/free redirige");
  assert.match(leer("src/app/onboarding/preview/layout.tsx"), /if \(!isWebCheckoutEnabled\(\)\) redirect\(/, "/onboarding/preview redirige");
  assert.match(leer("src/app/onboarding/free/layout.tsx"), /robots: \{ index: false, follow: false \}/, "/onboarding/free sin indexar");
  for (const f of ["src/app/api/onboarding/route.ts", "src/app/api/free/lead/route.ts"])
    assert.match(leer(f), /if \(!isWebCheckoutEnabled\(\)\) return NextResponse\.json\([^)]*\{ status: 403 \}\)/, `${f} responde 403`);
  // El asistente de ventas: la cuota de pricing.ts, sin alta, y el agente sólo como «no lo ofrecemos».
  const asistente = leer("src/app/api/sales-assistant/route.ts");
  assert.match(asistente, /\$\{MONTHLY_AMOUNT\} ₪ por mes, todo incluido\. Sin alta/);
  assert.ok(!/1,500|1\.500|Alta única|claude-sonnet-4-5-20250514|español, ruso|web de prueba/.test(asistente), "sin alta, sin el modelo viejo, sin español como idioma de la web");
  assert.match(asistente, /model: MODELO_TEXTOS/);
  // Mails y textos de cobro y estado.
  const mails = leer("src/lib/email-templates.ts");
  assert.ok(!/Agente|24hs/.test(mails), "mails sin «Agente» ni 24 h");
  for (const [l, t] of Object.entries(LOCALES)) {
    const visibles = textos([t.pagoOk, t.pago.footerSecurity, t.status.reviewBody, t.wizard.noClientIdSub]);
    for (const s of visibles) assert.ok(!/Google Business|PCI|una hora|the hour|תוך שעה|в течение часа|خلال ساعة|\b24\b|bienvenida|welcome email|ברכה|приветствен|الترحيب/.test(s), `${l}: «${s}»`);
    // La compra web (/onboarding/pago, hoy redirigida) dice el v9: la cuota es {precio}, sin alta ni v8, sin «la más grande» ni «desde el dashboard».
    const compra = textos([t.pago.contractBody, t.pago.paymentSub, t.pago.cardPlaceholder, t.pago.whyTrustItems]);
    for (const s of compra) assert.ok(!CIFRA.test(s) && !/v8|dashboard|הגדול|дашборд|крупнейш|أكبر|لوحة التحكم|largest|más grande/.test(s), `${l} compra web: «${s}»`);
    assert.ok(t.pago.contractBody.includes("{precio}"), `${l}: la compra web nombra la cuota con {precio}`);
  }
  // El logo del JSON-LD es la A de la landing (el ícono), no el wordmark viejo.
  assert.match(leer("src/app/page.tsx"), /logo: "https:\/\/arzac\.studio\/icon-512\.png"/);
  assert.ok(existsSync(resolve(ROOT, "public/icon-512.png")) && !existsSync(resolve(ROOT, "public/logo.png")), "icon-512.png sí, logo.png no");
  // La vitrina: el marco de las demos queda, sin enlaces ni urls.
  const vitrina = leer("src/components/landing/showcase.tsx") + leer("src/lib/sites.ts");
  assert.ok(!/href=|arzac\.studio|vercel\.app/.test(vitrina), "la vitrina no enlaza demos");
  assert.ok(!existsSync(resolve(ROOT, "scripts/generate-og.mjs")), "el script viejo de og (agente AI, cero alta) no vuelve");
});
