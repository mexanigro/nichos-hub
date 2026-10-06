// Utilidades de la orden VENTA-01 (sesión A, 2026-10-06). Se llama `_comun.ts` y no `_util.ts` (regla heredada de CONEXION-05 y
// VERDAD-09: la copia promovida `tests/verdad-08-a.test.ts` recorre los `tests/orden/*/_util.ts` de las aprobadas).
// COPIADO (no importado: esa carpeta queda congelada al aprobarse su orden) y RECORTADO de `tests/orden/plantilla-01/_comun.ts`: la
// lectura de CLAUDE.md, el cargador de .ts/.tsx de H, `envDe`, `dbReal` y `vercel` (la API de Vercel en LECTURA). Lo suyo: el plugin
// de SEO de T tal como está en T 3222922 (`t-3222922/`, copiado byte a byte —el plugin con extensión .mts para que el `tsc` de H, que
// no tiene `vite`, no lo compile—, inciso l) corrido sobre el `index.html` de ese mismo commit con las variables que se le pasen.
// Caja negra: nada importa src/*, tools/* ni scripts/* de forma estática; los módulos de H se importan con `import()` dinámico dentro
// del test. Sólo en H (esta orden no tiene afirmaciones en T: lo de T va con la orden de higiene).
import { existsSync, readFileSync } from "node:fs";
import { register } from "node:module";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT } from "../verdad-02/_util.ts";

export { ROOT, git } from "../verdad-02/_util.ts";

/** Esta orden. */
export const ORDEN = "venta-01";
/** Commit aprobado de PLANTILLA-01 (Liam, 2026-10-06) y su último rojo en H. */
export const PLANTILLA_01 = { aprobado: { T: "3222922", H: "96cef4b" }, rojo: { H: "f6ed7fc" } };
/** La demo de PLANTILLA-01 (W1 de esa orden): la que se redespliega en W1 de ésta. */
export const DEMO = "demo-demo-plantilla-a-f87b89e8";
/** La guía de una web nueva, en el registro (fuera de los repos), por su ruta fija. */
export const GUIA = "C:/Users/liama/Desktop/Nichos/bloque-05/GUIA-WEB-NUEVA.md";
/** Lo que el link de una web de peluquería no puede decir (el default de T: `seo-defaults.ts`, peluqueria), en los cuatro idiomas. */
export const AJENO = ["Studio Noa", "רמת גן", "Ramat Gan", "Рамат-Ган", "رمات غان"];

/** Fuente de un archivo del repo propio, y si existe. */
export const fuente = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");
export const existe = (rel: string) => existsSync(resolve(ROOT, rel));

/** Sección «## <titulo>» de un texto markdown (hasta el siguiente «## »). */
export function seccionDeTexto(texto: string, titulo: string): string | undefined {
  const i = texto.search(new RegExp(`^## ${titulo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m"));
  if (i < 0) return undefined;
  const resto = texto.slice(i + 3);
  const j = resto.search(/^## /m);
  return j < 0 ? resto : resto.slice(0, j);
}
/** El párrafo «**<ID> (AAAA-MM-DD):** …» de § Puertas automáticas de un CLAUDE.md, o undefined. */
export function parrafoDe(texto: string, id: string): string | undefined {
  const puertas = seccionDeTexto(texto, "Puertas automáticas (HIGIENE-01, 2026-09-18)") ?? "";
  return puertas.split(/\r?\n/).find((l) => new RegExp(`^\\*\\*${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\(\\d{4}-\\d{2}-\\d{2}\\):\\*\\*`).test(l));
}
/** Cuerpo del bloque ```ini de CONTRATO-DECLARADO en un CLAUDE.md dado. */
export function bloqueDe(texto: string): string {
  const m = texto.match(/<!--\s*CONTRATO-DECLARADO[\s\S]*?-->\s*```ini\r?\n([\s\S]*?)```/);
  if (!m) throw new Error("CLAUDE.md sin bloque CONTRATO-DECLARADO");
  return m[1];
}

// ─── El cargador de .ts/.tsx de H, copiado de ../plantilla-01/_comun.ts ─────────────────────────────────────────────────────────
export function fuenteCargadorTsx(raiz: string, dev = false): string {
  const ts = resolve(raiz, "node_modules/typescript/lib/typescript.js");
  if (!existsSync(ts)) throw new Error(`no existe ${ts}: el cargador de .tsx necesita typescript en node_modules`);
  return `import ts from ${JSON.stringify(pathToFileURL(ts).href)};
import { readFile } from "node:fs/promises";
import { statSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve as res, dirname } from "node:path";
const RAIZ = ${JSON.stringify(raiz.replace(/\\/g, "/"))};
const EXT = ["", ".tsx", ".ts", "/index.tsx", "/index.ts"];
const VITE = 'import.meta.env ??= { DEV: ${dev ? "true" : "false"}, PROD: ${dev ? "false" : "true"}, SSR: false, MODE: "test" };\\n';
function probar(base) {
  for (const e of EXT) { try { if (statSync(base + e).isFile()) return base + e; } catch {} }
  return null;
}
export async function resolve(spec, context, next) {
  if (spec.startsWith("@/")) { const p = probar(res(RAIZ, "src", spec.slice(2))); if (p) return { url: pathToFileURL(p).href, shortCircuit: true }; }
  if (spec.startsWith(".") && context.parentURL && context.parentURL.startsWith("file:")) {
    const p = probar(res(dirname(fileURLToPath(context.parentURL)), spec));
    if (p) return { url: pathToFileURL(p).href, shortCircuit: true };
  }
  return next(spec, context);
}
export async function load(url, context, next) {
  const tsx = /\\.tsx$/i.test(url);
  if (!tsx && !/\\.ts$/i.test(url)) return next(url, context);
  const source = await readFile(new URL(url), "utf8");
  if (!tsx && !source.includes("import.meta.env")) return next(url, context);
  const { outputText } = ts.transpileModule(tsx ? source : VITE + source, { fileName: url, compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, verbatimModuleSyntax: tsx } });
  return { format: "module", source: outputText, shortCircuit: true };
}
`;
}
let registrado = false;
/** Registra el hook una vez en este proceso. */
function registrar() {
  if (!registrado) { register("data:text/javascript," + encodeURIComponent(fuenteCargadorTsx(ROOT)), { parentURL: pathToFileURL(ROOT + "/").href }); registrado = true; }
}
/** El módulo de `rel` (relativo al repo propio), con el cargador de H. */
export async function importarModulo(rel: string): Promise<Record<string, any>> {
  registrar();
  return (await import(pathToFileURL(resolve(ROOT, rel)).href)) as Record<string, any>;
}

export type Cfg = Record<string, any>;
export type Variable = { key: string; value: string; target: string[]; type: string };

// ─── El plugin de SEO de T 3222922 ───────────────────────────────────────────────────────────────────────────────────────────────
const T_COPIA = resolve(ROOT, "tests", "orden", ORDEN, "t-3222922");
/** El `index.html` que arma `seoMetaPlugin()` de T 3222922 en el build, con estas variables en el entorno (las demás, sin tocar). */
export async function htmlDeT(vars: Record<string, string>): Promise<string> {
  registrar(); // el cargador resuelve el import sin extensión del plugin («../src/lib/seo-defaults»)
  const { seoMetaPlugin } = (await import(pathToFileURL(join(T_COPIA, "scripts", "vite-plugin-seo.mts")).href)) as Cfg;
  const claves = ["VITE_ACTIVE_NICHE", "VITE_UI_LANGUAGE", "VITE_BRAND_NAME", "VITE_BRAND_TAGLINE", "VITE_BRAND_DESCRIPTION", "VITE_OG_IMAGE", "VITE_APP_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL", "VITE_FAVICON_EMOJI", "VITE_THEME_ACCENT"];
  const antes = Object.fromEntries(claves.map((k) => [k, process.env[k]]));
  try {
    for (const k of claves) delete process.env[k];
    Object.assign(process.env, vars);
    return seoMetaPlugin().transformIndexHtml.handler(readFileSync(join(T_COPIA, "index.html"), "utf8")) as string;
  } finally {
    for (const k of claves) { if (antes[k] === undefined) delete process.env[k]; else process.env[k] = antes[k]; }
  }
}
/** Deshace el escape de HTML que hace el plugin (`&amp;`, `&lt;`, `&gt;`, `&quot;`). */
export const desescapar = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
/** Lo que el link muestra: el title, og:title, og:description y og:image de un HTML, ya sin escapar; y cuántos head y title tiene. */
export function link(html: string) {
  const g = (re: RegExp) => { const m = html.match(re); return m ? desescapar(m[1]) : undefined; };
  return {
    heads: (html.match(/<head[\s>]/gi) ?? []).length,
    titles: (html.match(/<title>/gi) ?? []).length,
    title: g(/<title>([^<]*)<\/title>/i),
    ogTitle: g(/<meta\s+property="og:title"\s+content="([^"]*)"/i),
    ogDescription: g(/<meta\s+property="og:description"\s+content="([^"]*)"/i),
    ogImage: g(/<meta\s+property="og:image"\s+content="([^"]*)"/i),
  };
}

// ─── Lo remoto, sólo en LECTURA (W1, «, webs») ──────────────────────────────────────────────────────────────────────────────────
/** Las variables de `.env.local` de H (sin imprimirlas). */
export function envDe(raiz: string): Record<string, string> {
  const abs = join(raiz, ".env.local");
  if (!existsSync(abs)) throw new Error(`falta ${abs}: sin él no se puede leer Firestore ni la API de Vercel`);
  const out: Record<string, string> = {};
  for (const linea of readFileSync(abs, "utf8").split(/\r?\n/)) {
    const t = linea.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[t.slice(0, i).trim()] = v;
  }
  return out;
}
/** El Firestore real por el Admin SDK de H: sólo `.get()` y consultas. */
export async function dbReal(): Promise<any> {
  for (const [k, v] of Object.entries(envDe(ROOT))) if (k.startsWith("FIREBASE_") || k.startsWith("NEXT_PUBLIC_FIREBASE_")) process.env[k] ??= v;
  return (await importarModulo("src/lib/firebase-admin.ts")).db;
}
/** GET a la API de Vercel (SÓLO lectura: nunca POST, PATCH ni DELETE), con el team del `.env.local` de H. */
export async function vercel(ruta: string): Promise<{ status: number; json: Cfg }> {
  const env = envDe(ROOT);
  if (!env.VERCEL_TOKEN) throw new Error("falta VERCEL_TOKEN en el .env.local de H: sin él no se puede leer el estado del deploy");
  const url = new URL(ruta, "https://api.vercel.com");
  if (env.VERCEL_TEAM_ID) url.searchParams.set("teamId", env.VERCEL_TEAM_ID);
  const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}` }, signal: AbortSignal.timeout(20000) });
  const texto = await r.text();
  let json: Cfg = {};
  try { json = JSON.parse(texto) as Cfg; } catch { json = { _texto: texto.slice(0, 400) }; }
  return { status: r.status, json };
}
