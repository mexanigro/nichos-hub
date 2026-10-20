// SIN-ALTA-01 · G1–G12 (H) · /pago y sus páginas: 250 sin alta, la marca de la landing, cinco idiomas, errores sin texto crudo.
// Sesión A (2026-10-20): tests rojos. G1, G2, G3, G5, G6 y G7 pintan PagoClient con renderToString (D-34). /pago/success y
// /pago/error leen el idioma de un contexto que en el servidor siempre es hebreo: se leen del fuente, y su CSS se resuelve con
// la cascada de globals.css sobre los ancestros del JSX (`cadenasJsx` + `gana`). Las marcas de texto por idioma están en § Interfaz.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FIRMA_LOGOMARK, IDIOMAS, arbol, bytes, cadenasJsx, clases, existe, fuente, gana, hermanosElemento, importarModulo, masProfundo,
  pintar, reglasCss, sha256, texto, todos, type Elemento, type Idioma, type Nodo,
} from "./_comun.ts";

const PAGO_CLIENT = "src/app/pago/[clientId]/pago-client.tsx";
const PAGO_PAGE = "src/app/pago/[clientId]/page.tsx";
const EXITO = "src/app/pago/success/page.tsx";
const ERROR = "src/app/pago/error/page.tsx";
const MI_CUENTA = "src/app/mi-cuenta/page.tsx";
const PAGO_IDIOMA = "src/lib/pago-idioma.ts";

async function pagoHtml(lang: Idioma): Promise<string> {
  const m = await importarModulo(PAGO_CLIENT);
  assert.ok(m?.default, `${PAGO_CLIENT} exporta PagoClient por defecto`);
  try {
    return await pintar(m.default, { clientId: "cli-prueba", clientDocId: "doc-prueba", businessName: "Salón Prueba", lang });
  } catch (e) {
    assert.fail(`PagoClient({ clientId, clientDocId, businessName, lang: "${lang}" }) no se pinta: ${(e as Error).message}`);
  }
}
async function contrato(lang: Idioma): Promise<string> {
  const m = await importarModulo("src/lib/contracts.ts");
  return m!.getContract(lang).text as string;
}
/** El texto que se ve, sin el contrato (que se afirma en C1–C6). */
async function textoSinContrato(lang: Idioma, html: string): Promise<string> {
  return texto(arbol(html)).replace(await contrato(lang), " ");
}

/** Marcas de G1 por idioma (§ Interfaz): cada grupo debe estar junto a «₪250» en un mismo elemento. */
const G1: Record<Idioma, { incluido: RegExp[]; primerMes: RegExp[]; mismaFecha: RegExp[]; cancelar: RegExp[] }> = {
  he: { incluido: [/הכל כלול/, /בלי דמי הקמה/], primerMes: [/החודש הראשון/, /(לתשלום|לשלם) עכשיו/, /חודש מלא/], mismaFecha: [/כל חודש/, /באותו תאריך/], cancelar: [/לבטל בכל עת/, /הימים שלא נוצלו/] },
  en: { incluido: [/everything included/i, /no setup fee/i], primerMes: [/first month/i, /due now|pay now/i, /full month/i], mismaFecha: [/every month/i, /same date/i], cancelar: [/cancel any ?time/i, /unused days/i] },
  es: { incluido: [/todo incluido/i, /sin alta/i], primerMes: [/primer mes/i, /a pagar ahora|pag[aá]s ahora/i, /mes entero|mes completo/i], mismaFecha: [/cada mes/i, /mism[ao] (d[ií]a|fecha)/i], cancelar: [/cancel[aá]s cuando quieras|cancelar cuando quieras/i, /d[ií]as que no usaste|d[ií]as no usados/i] },
  ru: { incluido: [/всё включено|все включено/i, /без платы за подключение/i], primerMes: [/первый месяц/i, /к оплате сейчас|оплатить сейчас/i, /полный месяц/i], mismaFecha: [/каждый месяц/i, /в ту же дату|в тот же день/i], cancelar: [/отменить можно в любой момент|в любой момент/i, /неиспользованные дни/i] },
  ar: { incluido: [/(كل شيء|الكل) (مشمول|شامل)|شامل (لكل شيء|كل شيء)/, /(بدون|دون|بلا|لا توجد) رسوم (ال)?(تأسيس|إنشاء)/], primerMes: [/الشهر الأول/, /الآن/, /شهر(اً|ا)? كامل(اً|ا)?/], mismaFecha: [/كل شهر/, /(التاريخ نفسه|نفس التاريخ)/], cancelar: [/الإلغاء[^.]{0,40}(في )?أي وقت/, /الأيام (غير المستخدمة|التي لم (تُ|ت)ستخدم)/] },
};
const ETIQUETAS_V8 = ["דמי הקמה (תשלום חד-פעמי)", "Setup fee (one-time)", "Alta (pago unico)", "Alta (pago único)", "Подключение (разовый платёж)"];
const OPCIONALES = /optional services|servicios opcionales|שירותים אופציונליים|дополнительные услуги|خدمات اختيارية|WhatsApp, (AI|IA|ИИ|בינה)/i;

/** El elemento más profundo cuyo texto cumple todas las marcas y además lleva «₪250», fuera del contrato (que también las tiene). */
function junto(raiz: Nodo, marcas: RegExp[], contratoTexto: string): Nodo | undefined {
  const inicio = contratoTexto.slice(0, 40);
  return masProfundo(raiz, (t) => !t.includes(inicio) && t.includes("₪250") && marcas.every((r) => r.test(t)));
}

test("PagoClient renderizado en servidor en he, en, es, ru y ar muestra ₪250 por mes con su «todo incluido, sin alta», el primer mes ₪250 a pagar ahora que cubre un mes entero, la fila «cada mes, en la misma fecha» con ₪250 y la nota de que se cancela cuando quiere y se devuelven los días no usados; no muestra ningún importe de alta ni la etiqueta de alta del v8.0 («דמי הקמה (תשלום חד-פעמי)», «Setup fee (one-time)», «Alta (pago unico)», «Подключение (разовый платёж)») ni la línea de servicios opcionales", async () => {
  const src = fuente(PAGO_CLIENT);
  for (const e of ETIQUETAS_V8) assert.ok(!src.includes(e), `PagoClient sin la etiqueta del v8.0 «${e}»`);
  for (const l of IDIOMAS) {
    const html = await pagoHtml(l);
    const visible = await textoSinContrato(l, html);
    const raiz = arbol(html);
    const g = G1[l];
    const ct = await contrato(l);
    assert.ok(junto(raiz, g.incluido, ct), `${l}: «₪250» por mes junto a «todo incluido, sin alta» (${g.incluido.join(" ")})`);
    assert.ok(junto(raiz, g.primerMes, ct), `${l}: el primer mes ₪250 a pagar ahora que cubre un mes entero (${g.primerMes.join(" ")})`);
    assert.ok(junto(raiz, g.mismaFecha, ct), `${l}: la fila «cada mes, en la misma fecha» con ₪250 (${g.mismaFecha.join(" ")})`);
    assert.ok(g.cancelar.every((r) => r.test(visible)), `${l}: la nota de que se cancela cuando quiere y se devuelven los días no usados (${g.cancelar.join(" ")})`);
    assert.ok(!/1[,.\s  ]?[05]00\b/.test(visible), `${l}: ningún importe de alta («${visible.match(/1[,.\s  ]?[05]00\b/)?.[0]}»)`);
    for (const e of ETIQUETAS_V8) assert.ok(!visible.includes(e), `${l}: sin la etiqueta del v8.0 «${e}»`);
    assert.ok(!OPCIONALES.test(visible), `${l}: sin la línea de servicios opcionales («${visible.match(OPCIONALES)?.[0]}»)`);
  }
});

test("/pago/<clientId> y mi-cuenta llevan la marca de la landing —LogoMark y «Arzac studio» en serif, como /pago/success— y ninguna usa /logo-icon.svg ni el «ARZAC .studio»", async () => {
  assert.ok(!fuente(PAGO_CLIENT).includes("/logo-icon.svg"), "/pago/<clientId> no usa /logo-icon.svg");
  const html = await pagoHtml("he");
  assert.ok(!html.includes("/logo-icon.svg"), "/pago/<clientId> no usa /logo-icon.svg");
  assert.ok(!/>\s*ARZAC\s*</.test(html) && !html.includes(".studio"), "/pago/<clientId> sin «ARZAC .studio»");
  const marca = todos(arbol(html), (n) => n.tag === "a" && n.attrs.href === "/")[0];
  assert.ok(marca, "/pago/<clientId> tiene la marca enlazada a la portada");
  const sinSep = (n: Nodo) => texto(n).replace(/\s+/g, " ").trim();
  assert.ok(todos(marca, (n) => n.tag === "path" && (n.attrs.d ?? "").startsWith(FIRMA_LOGOMARK)).length, "la marca de /pago es LogoMark");
  assert.equal(sinSep(marca), "Arzac studio", "la marca de /pago dice «Arzac studio»");
  assert.ok(todos(marca, (n) => n.tag === "em" && texto(n) === "studio").length, "«studio» en cursiva, como /pago/success");
  assert.ok(clases(marca).includes("pago-brand") || /serif/.test(marca.attrs.style ?? ""), "en serif (la clase pago-brand de /pago/success)");
  const mc = fuente(MI_CUENTA);
  assert.ok(!mc.includes("/logo-icon.svg"), "mi-cuenta no usa /logo-icon.svg");
  assert.ok(!/>\s*ARZAC\s*</.test(mc) && !mc.includes(">.studio<"), "mi-cuenta sin «ARZAC .studio»");
  assert.match(mc, /<LogoMark\b/, "mi-cuenta pinta LogoMark");
  assert.match(mc, /Arzac\s*<em\b[^>]*>studio<\/em>/, "mi-cuenta dice «Arzac studio»");
  assert.match(mc, /serif/, "mi-cuenta en serif");
  const exito = fuente(EXITO);
  assert.match(exito, /className="pago-brand"[\s\S]{0,200}<LogoMark\b[\s\S]{0,120}Arzac <em>studio<\/em>/, "/pago/success sigue con su marca");
});

test("en el resumen de /pago la frase del primer mes va en su propia línea debajo del título y el precio, y en el contrato plegado el degradado está dentro de la caja recortada (la caja es relative y el degradado absolute abajo, sin margen negativo)", async () => {
  assert.ok(!/marginTop:\s*"-/.test(fuente(PAGO_CLIENT)), "el degradado del contrato plegado sin margen negativo");
  const html = await pagoHtml("he");
  const raiz = arbol(html);
  const frase = masProfundo(raiz, (t) => /חודש מלא/.test(t) && !/החודש הראשון/.test(t) && !t.includes("₪"));
  assert.ok(frase, "la frase del primer mes («… חודש מלא …») va en un elemento propio, sin el título ni el precio");
  assert.ok(!/^(span|em|strong|b|i)$/.test(frase.tag), `la frase va en un bloque propio, no en <${frase.tag}> dentro de la fila`);
  assert.ok(!clases(frase.padre!).includes("flex"), "la frase no está en la fila flex del título y el precio");
  const hermanos = hermanosElemento(frase);
  const antes = hermanos.slice(0, hermanos.indexOf(frase));
  assert.ok(antes.some((h) => /החודש הראשון/.test(texto(h)) && texto(h).includes("₪250")), "debajo de la fila con el título del primer mes y ₪250");
  const grad = todos(raiz, (n) => clases(n).includes("bg-gradient-to-t"));
  assert.equal(grad.length, 1, "un degradado en el contrato plegado");
  const g = grad[0];
  assert.ok(clases(g).includes("absolute") && clases(g).includes("bottom-0"), "el degradado es absolute abajo");
  assert.ok(!/margin|position/i.test(g.attrs.style ?? ""), `el degradado sin margen negativo ni position en línea (style="${g.attrs.style ?? ""}")`);
  const caja = g.padre!;
  assert.ok(clases(caja).includes("relative") && clases(caja).includes("overflow-hidden"), `el degradado está dentro de la caja recortada relative (class="${caja.attrs.class}")`);
  assert.ok(texto(caja).includes((await contrato("he")).slice(0, 40)), "esa caja es la del contrato");
});

test("el ícono de la pestaña y de la app es la A del logo de la landing: src/app/icon.png (512 × 512) y src/app/apple-icon.png (180 × 180) existen y el manifest declara sólo /icon-192.png y /icon-512.png, que existen en public/ con esos tamaños; el manifest no nombra /logo-icon.png ni /favicon.ico y su descripción no dice «הקמה»", async () => {
  const dims = (rel: string) => { const b = bytes(rel); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
  // La A del logo: el mismo blob que public/icon-512.png (el logo del JSON-LD de LANDING-01).
  assert.equal(sha256(bytes("src/app/icon.png")), sha256(bytes("public/icon-512.png")), "src/app/icon.png es la A (los mismos bytes que public/icon-512.png)");
  assert.deepEqual(dims("src/app/icon.png"), [512, 512]);
  assert.ok(existe("src/app/apple-icon.png"), "src/app/apple-icon.png existe");
  assert.deepEqual(dims("src/app/apple-icon.png"), [180, 180]);
  assert.notEqual(sha256(bytes("src/app/apple-icon.png")), "5dc43224c1fa682ceef0c2a95a5c3be05f1ce10fec8adcb6bafd681ef833d759", "src/app/apple-icon.png ya no es el erizo");
  for (const [rel, n] of [["public/icon-192.png", 192], ["public/icon-512.png", 512]] as const) {
    assert.ok(existe(rel), `${rel} existe`);
    assert.deepEqual(dims(rel), [n, n], `${rel} mide ${n} × ${n}`);
  }
  const m = await importarModulo("src/app/manifest.ts");
  const man = m!.default();
  assert.deepEqual(man.icons.map((i: { src: string }) => i.src).sort(), ["/icon-192.png", "/icon-512.png"], "el manifest declara sólo /icon-192.png y /icon-512.png");
  assert.ok(!/logo-icon\.png|favicon\.ico/.test(JSON.stringify(man)), "el manifest no nombra /logo-icon.png ni /favicon.ico");
  assert.ok(!String(man.description).includes("הקמה"), "la descripción del manifest no dice «הקמה»");
});

test("el español de /pago está escrito como original: el contrato en español lleva «Suscripción», «sección», «días», «rescisión» y «Jurisdicción» y no «Suscripcion», «seccion», «dias», «rescision» ni «Jurisdiccion», y la casilla de aceptación en español dice «Leí y acepto los términos del acuerdo»", async () => {
  const es = await contrato("es");
  for (const w of ["Suscripción", "sección", "días", "rescisión", "Jurisdicción"]) assert.ok(es.includes(w), `el contrato en español lleva «${w}»`);
  for (const w of ["Suscripcion", "seccion", "dias", "rescision", "Jurisdiccion"]) assert.ok(!new RegExp(`\\b${w}\\b`).test(es), `el contrato en español no lleva «${w}»`);
  assert.ok(texto(arbol(await pagoHtml("es"))).includes("Leí y acepto los términos del acuerdo"), "la casilla dice «Leí y acepto los términos del acuerdo»");
});

/** Los cuatro idiomas de las webs por idioma de /pago (nombres o códigos), y el español que no va (§ Interfaz). */
const CUATRO: Record<Idioma, RegExp[]> = {
  he: [/עברית/, /אנגלית/, /רוסית/, /ערבית/], en: [/Hebrew/i, /English/i, /Russian/i, /Arabic/i], es: [/hebreo/i, /inglés/i, /ruso/i, /árabe/i],
  ru: [/иврит/i, /английск/i, /русск/i, /арабск/i], ar: [/العبرية/, /الإنجليزية/, /الروسية/, /العربية/],
};
const CODIGOS = [/\bHE\b/, /\bEN\b/, /\bRU\b/, /\bAR\b/];
const ESPANOL = /\bES\b|ספרדית|Spanish|español|испанск|الإسبانية/i;

test("/pago tiene árabe: /pago/<clientId> de una ficha con language \"ar\" se pinta con dir=\"rtl\", los textos de PagoClient en árabe escritos como original y el contrato árabe, y la lista de lo incluido dice cuatro idiomas (hebreo, inglés, ruso y árabe) en los cinco idiomas de /pago, sin «5» ni «ES»", async () => {
  const id = (await importarModulo(PAGO_IDIOMA)) ?? {};
  assert.equal(typeof id.idiomaDePago, "function", `${PAGO_IDIOMA} exporta idiomaDePago (§ Interfaz)`);
  assert.equal(id.idiomaDePago("ar"), "ar", "una ficha con language \"ar\" abre /pago en árabe");
  for (const l of ["he", "es", "ru", "en"]) assert.equal(id.idiomaDePago(l), l);
  assert.equal(id.idiomaDePago(undefined), "en");
  assert.match(fuente(PAGO_PAGE), /idiomaDePago\(/, `${PAGO_PAGE} toma el idioma con idiomaDePago`);
  const ar = await pagoHtml("ar");
  const raizAr = arbol(ar);
  const primero = (r: Nodo) => r.hijos.find((h): h is Nodo => typeof h !== "string")!;
  assert.equal(primero(raizAr).attrs.dir, "rtl", "/pago en árabe va con dir=\"rtl\"");
  assert.equal(primero(arbol(await pagoHtml("he"))).attrs.dir, "rtl");
  for (const l of ["en", "es", "ru"] as const) assert.equal(primero(arbol(await pagoHtml(l))).attrs.dir, "ltr", `/pago en ${l} va con dir="ltr"`);
  assert.ok(texto(raizAr).includes(await contrato("ar")), "/pago en árabe muestra el contrato árabe");
  // Ningún texto del inglés queda en la página árabe (no es el inglés de respaldo), salvo lo que comparte con el hebreo (la marca, CRM).
  const visibleAr = await textoSinContrato("ar", ar);
  const enHtml = await pagoHtml("en");
  const enContrato = await contrato("en");
  const compartido = await textoSinContrato("he", await pagoHtml("he"));
  const restos = todos(arbol(enHtml), () => true).flatMap((n) => n.hijos.filter((h): h is string => typeof h === "string"))
    .map((s) => s.trim()).filter((s) => /[A-Za-z]{3,}/.test(s) && !enContrato.includes(s) && !compartido.includes(s) && visibleAr.includes(s));
  assert.deepEqual(restos, [], "textos del inglés en la página árabe");
  assert.ok((visibleAr.match(/[؀-ۿ]+/g) ?? []).length >= 20, "los textos de PagoClient están en árabe");
  for (const l of IDIOMAS) {
    const lis = todos(arbol(await pagoHtml(l)), (n) => n.tag === "li" && (CUATRO[l].some((r) => r.test(texto(n))) || CODIGOS.filter((r) => r.test(texto(n))).length >= 2 || /\b5\b/.test(texto(n))));
    assert.equal(lis.length, 1, `${l}: un ítem de idiomas en la lista de lo incluido (${lis.map(texto).join(" | ")})`);
    const t = texto(lis[0]);
    assert.ok(CUATRO[l].every((r) => r.test(t)) || CODIGOS.every((r) => r.test(t)), `${l}: «${t}» nombra hebreo, inglés, ruso y árabe`);
    assert.ok(!ESPANOL.test(t) && !/5|٥/.test(t), `${l}: «${t}» sin «5» ni «ES»`);
  }
});

test("/pago no muestra al cliente el texto crudo de un error: cuando /api/payments/contract o /api/cardcom/create-payment fallan, o no vuelve la url de pago, PagoClient muestra el mensaje de error de su idioma y nunca «Contract failed», «Payment setup failed», «No payment URL received» ni el error que mandó el servidor; /pago/success, cuando la verificación falla, tampoco muestra el error del servidor", async () => {
  const src = fuente(PAGO_CLIENT);
  for (const s of ["Contract failed", "Payment setup failed", "No payment URL received"]) assert.ok(!src.includes(s), `PagoClient no tiene «${s}»`);
  assert.ok(!/data\??\.error|\.message\b/.test(src), "PagoClient no muestra el error que mandó el servidor (data.error, e.message)");
  const llamadas = [...src.matchAll(/setError\(([^()]*)\)/g)].map((m) => m[1].trim());
  assert.ok(llamadas.includes("t.error"), "PagoClient pone el mensaje de su idioma (setError(t.error))");
  assert.deepEqual(llamadas.filter((a) => a !== '""' && a !== "t.error"), [], "PagoClient sólo pone \"\" o t.error como error");
  const mensajes = [...src.matchAll(/\berror:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(mensajes).size, 5, `un mensaje de error por idioma (${mensajes.join(" | ")})`);
  for (const [nombre, r] of [["hebreo", /[֐-׿]/], ["árabe", /[؀-ۿ]/], ["ruso", /[Ѐ-ӿ]/]] as const) assert.ok(mensajes.some((m) => r.test(m)), `hay mensaje de error en ${nombre}`);
  for (const l of IDIOMAS) await pagoHtml(l);
  const exito = fuente(EXITO);
  assert.ok(!/data\??\.error|"Verification failed"|"Network error"|\{error\s*\|\|/.test(exito), "/pago/success no muestra el error del servidor");
});

test("el título de la pestaña de /pago/<clientId> dice «Arzac Studio» una sola vez y la palabra del pago en el idioma de la ficha (תשלום, Payment, Pago, Оплата, الدفع), con la descripción en ese idioma", async () => {
  const id = (await importarModulo(PAGO_IDIOMA)) ?? {};
  assert.equal(typeof id.metadataDePago, "function", `${PAGO_IDIOMA} exporta metadataDePago (§ Interfaz)`);
  const page = fuente(PAGO_PAGE);
  assert.match(page, /export\s+async\s+function\s+generateMetadata\b/, `${PAGO_PAGE} exporta generateMetadata`);
  assert.match(page, /metadataDePago\(/, "generateMetadata usa metadataDePago");
  const PALABRA: Record<Idioma, string> = { he: "תשלום", en: "Payment", es: "Pago", ru: "Оплата", ar: "الدفع" };
  const ESCRITURA: Record<Idioma, RegExp> = { he: /[֐-׿]{3,}/, ar: /[؀-ۿ]{3,}/, ru: /[Ѐ-ӿ]{3,}/, en: /^[^Ѐ-ۿ]*[A-Za-z]{3,}/, es: /^[^Ѐ-ۿ]*[A-Za-z]{3,}/ };
  const descripciones = new Set<string>();
  for (const l of IDIOMAS) {
    const md = id.metadataDePago(l);
    const titulo = md?.title?.absolute;
    assert.equal(typeof titulo, "string", `${l}: title.absolute (el título entero de la pestaña, sin la plantilla «%s | Arzac Studio»)`);
    assert.equal(titulo.split("Arzac Studio").length - 1, 1, `${l}: «${titulo}» dice «Arzac Studio» una sola vez`);
    assert.ok(titulo.includes(PALABRA[l]), `${l}: «${titulo}» dice «${PALABRA[l]}»`);
    assert.match(String(md.description ?? ""), ESCRITURA[l], `${l}: la descripción «${md.description}» en ese idioma`);
    descripciones.add(String(md.description));
  }
  assert.equal(descripciones.size, 5, "una descripción distinta por idioma");
  assert.notEqual(id.metadataDePago("es").description, "Complete your subscription payment");
});

test("/pago/error no muestra ninguna referencia de pago inventada: no hay «ARZ-PAY-» en su fuente", () => {
  assert.ok(!fuente(ERROR).includes("ARZ-PAY-"), "/pago/error sin «ARZ-PAY-»");
});

const css = () => reglasCss(fuente("src/app/globals.css"));
const BLANCO = /\bwhite\b|#fff(fff)?\b|rgba?\(\s*255\s*,\s*255\s*,\s*255/i;
/** `locale === "es" ? "…" : locale === "en" ? "…" : … : "…"` → el texto de cada idioma (el último, sin condición, es el árabe). */
function porIdioma(src: string, nombre: string): Partial<Record<Idioma, string>> | undefined {
  const m = src.match(new RegExp(`const ${nombre}\\s*=\\s*([\\s\\S]*?);\\n`));
  if (!m) return undefined;
  const out: Partial<Record<Idioma, string>> = {};
  for (const p of m[1].matchAll(/locale\s*===\s*"(\w\w)"\s*\?\s*"([^"]*)"/g)) out[p[1] as Idioma] = p[2];
  const ult = m[1].match(/:\s*"([^"]*)"\s*$/);
  if (ult) for (const l of IDIOMAS) if (!(l in out)) out[l] = ult[1];
  return out;
}

test("/pago/success y /pago/error en hebreo y árabe apuntan sus flechas hacia adelante (← en los botones y en la lista de consejos), el estado «verificando» de /pago/success tiene un subtítulo distinto de su título en los cinco idiomas y su botón secundario vuelve al inicio en vez de repetir WhatsApp; en /pago/error con clientId «hablar con Liam» abre WhatsApp, y la ruedita de carga sola en la página no es blanca", () => {
  const reglas = css();
  const exito = fuente(EXITO), error = fuente(ERROR);
  for (const [nombre, src] of [["/pago/success", exito], ["/pago/error", error]] as const) {
    for (const cadena of cadenasJsx(src, (e) => e.clases.includes("pago-btn-arrow"), "rtl")) {
      const t = gana(reglas, cadena, ["transform"])?.valor ?? "none";
      assert.match(t, /scaleX\(\s*-1\s*\)|rotate\(\s*180deg\s*\)|rotateY\(\s*180deg\s*\)/, `${nombre} en RTL: la flecha del botón apunta a la izquierda (transform «${t}»)`);
    }
    for (const cadena of cadenasJsx(src, (e) => e.clases.includes("pago-btn-arrow"), "ltr")) {
      const t = gana(reglas, cadena, ["transform"])?.valor ?? "none";
      assert.ok(!/scaleX\(\s*-1|rotate/.test(t), `${nombre} en LTR la flecha sigue a la derecha (transform «${t}»)`);
    }
  }
  const tips = cadenasJsx(error, (e) => e.tag === "li", "rtl").filter((c) => c.some((e) => e.clases.includes("pgerr-tips")));
  assert.ok(tips.length, "/pago/error tiene la lista de consejos");
  for (const c of tips) assert.match(gana(reglas, c, ["content"], "before")?.valor ?? "", /←|\\2190/, "/pago/error en RTL: los consejos con ←");
  for (const c of cadenasJsx(error, (e) => e.tag === "li", "ltr").filter((c) => c.some((e) => e.clases.includes("pgerr-tips")))) {
    assert.match(gana(reglas, c, ["content"], "before")?.valor ?? "", /→|\\2192/, "/pago/error en LTR: los consejos con →");
  }
  // El estado «verificando» (el pendiente: «Estamos verificando tu pago»): subtítulo ≠ título, y el secundario a la portada.
  const ini = exito.indexOf('status === "pending"');
  assert.ok(ini >= 0, "/pago/success tiene el estado pendiente");
  const bloque = exito.slice(ini, exito.indexOf("\n  }\n", ini));
  const par = bloque.match(/<div className="eyebrow">\{(\w+)\}<\/div>\s*<h1>\{(\w+)\}/);
  assert.ok(par, "el estado pendiente tiene subtítulo (eyebrow) y título (h1) por idioma");
  const sub = porIdioma(exito, par[1]), tit = porIdioma(exito, par[2]);
  assert.ok(sub && tit, `«${par[1]}» y «${par[2]}» con un texto por idioma`);
  for (const l of IDIOMAS) {
    assert.ok(sub[l] && tit[l], `${l}: subtítulo y título del estado pendiente`);
    assert.notEqual(sub[l], tit[l], `${l}: el subtítulo del estado «verificando» no repite el título («${tit[l]}»)`);
  }
  assert.match(tit.es ?? "", /verificando/i, "es el estado «verificando»");
  const fantasma = bloque.match(/<a href="([^"]*)" className="pago-btn pago-btn-ghost"[^>]*>\{([\w.]+)\}<\/a>/);
  assert.ok(fantasma, "el estado pendiente tiene un botón secundario");
  assert.equal(fantasma[1], "/", "el botón secundario vuelve al inicio");
  assert.notEqual(fantasma[2], "t.pagoErr.ctaSecondary", "el botón secundario no repite «hablar con Liam» (WhatsApp)");
  const volver = porIdioma(exito, fantasma[2]);
  assert.ok(volver && IDIOMAS.every((l) => volver[l] && !/whatsapp|וואטסאפ|واتساب|Liam|ליאם|Лиам|ليام/i.test(volver[l]!)), `el botón secundario dice volver al inicio en los cinco idiomas (${JSON.stringify(volver)})`);
  assert.match(error, /clientId\s*\?\s*\(\s*<a href=\{whatsappHref\(\)\}[^>]*>\{t\.pagoErr\.ctaSecondary\}<\/a>/, "/pago/error con clientId: «hablar con Liam» abre WhatsApp");
  for (const [nombre, src] of [["/pago/success", exito], ["/pago/error", error]] as const) {
    assert.ok(!/<a href="\/"[^>]*>\{t\.pagoErr\.ctaSecondary\}<\/a>/.test(src), `${nombre}: «hablar con Liam» no lleva a la portada`);
    const solas = cadenasJsx(src, (e) => e.clases.includes("pago-spinner"), "rtl").filter((c) => !c.some((e) => e.tag === "button"));
    assert.ok(solas.length, `${nombre} tiene la ruedita de carga`);
    for (const c of solas) {
      const borde = gana(reglas, c, ["border-color", "border"])?.valor ?? "";
      assert.ok(!BLANCO.test(borde), `${nombre}: la ruedita sola dentro de ${c.slice(0, -1).map((e: Elemento) => `${e.tag}.${e.clases.join(".")}`).join(" > ")} es blanca («${borde}»)`);
    }
  }
});

test("en las páginas de /pago en hebreo y árabe el subtítulo chico, el pie y la referencia van sin espaciado entre letras (letter-spacing normal bajo .pago[dir=\"rtl\"])", () => {
  const reglas = css();
  let vistos = 0;
  for (const [nombre, src] of [["/pago/success", fuente(EXITO)], ["/pago/error", fuente(ERROR)]] as const) {
    for (const cadena of cadenasJsx(src, (e) => ["eyebrow", "pago-foot", "pgerr-ref"].some((c) => e.clases.includes(c)), "rtl")) {
      vistos++;
      const g = gana(reglas, cadena, ["letter-spacing"]);
      const el = cadena[cadena.length - 1];
      assert.ok(!g || /^(normal|0(px|em)?)$/.test(g.valor), `${nombre} en RTL: .${el.clases.join(".")} con letter-spacing «${g?.valor}» (regla «${g?.regla.sel}»)`);
      assert.ok(g && /\.pago\[dir=["']?rtl["']?\]/.test(g.regla.sel), `${nombre}: el letter-spacing normal de .${el.clases.join(".")} sale de una regla bajo .pago[dir="rtl"]`);
    }
  }
  assert.ok(vistos >= 5, `subtítulos, pies y referencias encontrados en /pago/success y /pago/error (${vistos})`);
});

test("mi-cuenta ya no dice que el sitio se desactiva a los 30 días de cancelar: dice que la web baja el día de la cancelación y que se devuelven los días no usados", () => {
  const mc = fuente(MI_CUENTA);
  assert.ok(!/desactivar[áa] después de 30 días|30 días/.test(mc), "mi-cuenta no dice que el sitio se desactiva a los 30 días");
  const i = mc.indexOf("Zona de riesgo");
  assert.ok(i >= 0, "mi-cuenta tiene la zona de cancelación");
  const zona = mc.slice(i, mc.indexOf("Solicitar cancelación", i) >>> 0);
  assert.match(zona, /(baja|se apaga|deja de (estar|funcionar)|se desactiva)[^<]{0,60}(el mismo día|ese (mismo )?día|el día (en )?que|el día de la cancelación)|(el mismo día|ese (mismo )?día|el día (en )?que cancel)[^<]{0,60}(baja|se apaga|deja de|se desactiva)/i,
    "dice que la web baja el día de la cancelación");
  assert.match(zona, /devolv[^<]{0,60}d[ií]as (que no usaste|no usados)|d[ií]as (que no usaste|no usados)[^<]{0,60}devolv/i, "dice que se devuelven los días no usados");
});
