// Utilidades de la orden SIN-ALTA-01 (sesión A, 2026-10-20). Sólo H: T no cambia en esta orden.
// Se llama `_comun.ts` y no `_util.ts` (regla heredada de CONEXION-05 y VERDAD-09: la copia promovida
// `tests/verdad-08-a.test.ts` recorre los `tests/orden/*/_util.ts`).
// Caja negra: nada importa src/* de forma estática. Los módulos de src se cargan con `importarModulo` (import() dinámico con un
// cargador de .ts/.tsx, copiado y recortado de `../crm-03/_comun.ts`); los .tsx se pintan con `renderToString` de react-dom/server.
// Lo que toca Firestore (rutas de Next) se lee del fuente del árbol, como `tests/orden/alta-idiomas-01/a.test.ts`; donde la hoja
// pide comportamiento de la ficha o de /payments, la expresión JSX se extrae del fuente y se evalúa (`evaluarBloque`).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { existsSync, readFileSync } from "node:fs";
import { register } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { ROOT } from "../verdad-02/_util.ts";

export { ROOT } from "../verdad-02/_util.ts";

export const fuente = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");
export const existe = (rel: string) => existsSync(resolve(ROOT, rel));
export const bytes = (rel: string) => readFileSync(resolve(ROOT, rel));
export const sha256 = (b: Buffer) => createHash("sha256").update(b).digest("hex");

/** Los cinco idiomas de /pago y del contrato. */
export const IDIOMAS = ["he", "en", "es", "ru", "ar"] as const;
export type Idioma = (typeof IDIOMAS)[number];

// ─── El cargador de .ts/.tsx (de ../crm-03/_comun.ts; `next/font/google` se reemplaza por un doble que no carga nada) ────────
function fuenteCargador(raiz: string): string {
  const ts = resolve(raiz, "node_modules/typescript/lib/typescript.js");
  if (!existsSync(ts)) throw new Error(`no existe ${ts}: el cargador de .tsx necesita typescript en node_modules`);
  return `import ts from ${JSON.stringify(pathToFileURL(ts).href)};
import { readFile } from "node:fs/promises";
import { statSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve as res, dirname } from "node:path";
const RAIZ = ${JSON.stringify(raiz.replace(/\\/g, "/"))};
const EXT = ["", ".tsx", ".ts", "/index.tsx", "/index.ts"];
const VITE = 'import.meta.env ??= { DEV: false, PROD: true, SSR: false, MODE: "test" };\\n';
const FUENTE = /import\\s*\\{([^}]*)\\}\\s*from\\s*["']next\\/font\\/google["'];?/g;
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
  let source = await readFile(new URL(url), "utf8");
  if (!tsx && !source.includes("import.meta.env") && !FUENTE.test(source)) return next(url, context);
  FUENTE.lastIndex = 0;
  source = source.replace(FUENTE, (_m, nombres) => nombres.split(",").map((n) => n.trim()).filter(Boolean)
    .map((n) => "const " + n + " = () => ({ className: '', variable: '', style: {} });").join("\\n"));
  const { outputText } = ts.transpileModule(tsx ? source : VITE + source, { fileName: url, compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, verbatimModuleSyntax: tsx } });
  return { format: "module", source: outputText, shortCircuit: true };
}
`;
}
let registrado = false;
/** El módulo de `rel` (relativo al repo), con el cargador de .ts/.tsx; undefined si el archivo no existe. */
export async function importarModulo(rel: string): Promise<Record<string, any> | undefined> {
  if (!existe(rel)) return undefined;
  if (!registrado) { register("data:text/javascript," + encodeURIComponent(fuenteCargador(ROOT)), { parentURL: pathToFileURL(ROOT + "/").href }); registrado = true; }
  return (await import(pathToFileURL(resolve(ROOT, rel)).href)) as Record<string, any>;
}
const desdeRaiz = (espec: string) => import(pathToFileURL(resolve(ROOT, "node_modules", espec)).href);
export async function react(): Promise<any> { return ((await desdeRaiz("react/index.js")) as any).default; }
/** renderToString de react-dom/server del repo. Un error al pintar sale como Error con el mensaje original. */
export async function pintar(componente: any, props: Record<string, unknown>): Promise<string> {
  const React = await react();
  const server = ((await desdeRaiz("react-dom/server.node.js")) as any).default ?? (await desdeRaiz("react-dom/server.node.js"));
  return server.renderToString(React.createElement(componente, props));
}

// ─── HTML: un árbol mínimo para leer lo que pinta renderToString ───────────────────────────────────────────────────────────────
export type Nodo = { tag: string; attrs: Record<string, string>; hijos: (Nodo | string)[]; padre?: Nodo };
const VACIOS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#x27": "'", "#39": "'", nbsp: " " };
export const desescapar = (s: string) => s.replace(/&(amp|lt|gt|quot|#x27|#39|nbsp);/g, (_m, e) => ENT[e]);
export function arbol(html: string): Nodo {
  const raiz: Nodo = { tag: "#raiz", attrs: {}, hijos: [] };
  let actual = raiz;
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*(\/?)>|([^<]+)/g;
  for (const m of html.matchAll(re)) {
    if (m[0].startsWith("<!--")) continue;
    if (m[1]) { let n: Nodo | undefined = actual; while (n && n.tag !== m[1].toLowerCase()) n = n.padre; if (n?.padre) actual = n.padre; continue; }
    if (m[2]) {
      const attrs: Record<string, string> = {};
      for (const a of (m[3] ?? "").matchAll(/([^\s=>/]+)(?:="([^"]*)")?/g)) attrs[a[1]] = desescapar(a[2] ?? "");
      const nodo: Nodo = { tag: m[2].toLowerCase(), attrs, hijos: [], padre: actual };
      actual.hijos.push(nodo);
      if (!m[4] && !VACIOS.has(nodo.tag)) actual = nodo;
      continue;
    }
    if (m[5]) actual.hijos.push(desescapar(m[5]));
  }
  return raiz;
}
export const texto = (n: Nodo | string): string => (typeof n === "string" ? n : n.hijos.map(texto).join(""));
export const clases = (n: Nodo) => (n.attrs.class ?? "").split(/\s+/).filter(Boolean);
export function todos(n: Nodo, pred: (x: Nodo) => boolean, out: Nodo[] = []): Nodo[] {
  for (const h of n.hijos) if (typeof h !== "string") { if (pred(h)) out.push(h); todos(h, pred, out); }
  return out;
}
/** El nodo más profundo cuyo texto cumple `pred` (el elemento que «lleva» ese texto). */
export function masProfundo(n: Nodo, pred: (t: string) => boolean): Nodo | undefined {
  const candidatos = todos(n, (x) => pred(texto(x)));
  return candidatos.find((c) => !todos(c, (x) => pred(texto(x))).length);
}
export const hermanosElemento = (n: Nodo) => (n.padre?.hijos ?? []).filter((h): h is Nodo => typeof h !== "string");
/** Firma de LogoMark (src/components/landing/logo-mark.tsx): el trazo de la A. */
export const FIRMA_LOGOMARK = "M60 12L16 108";

// ─── CSS: reglas, especificidad y cascada sobre una cadena de ancestros leída del JSX ─────────────────────────────────────────
export type Regla = { sel: string; decl: Record<string, string>; orden: number };
export function reglasCss(css: string): Regla[] {
  const limpio = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: Regla[] = [];
  const recorrer = (s: string) => {
    let i = 0;
    while (i < s.length) {
      const a = s.indexOf("{", i);
      if (a < 0) break;
      const pre = s.slice(i, a).trim();
      let prof = 1, j = a + 1;
      for (; j < s.length && prof > 0; j++) { if (s[j] === "{") prof++; else if (s[j] === "}") prof--; }
      const cuerpo = s.slice(a + 1, j - 1);
      if (/^@(media|supports|layer)\b/.test(pre)) recorrer(cuerpo);
      else if (!pre.startsWith("@") && !cuerpo.includes("{")) {
        const decl: Record<string, string> = {};
        for (const d of cuerpo.split(";")) { const k = d.indexOf(":"); if (k > 0) decl[d.slice(0, k).trim().toLowerCase()] = d.slice(k + 1).trim(); }
        out.push({ sel: pre, decl, orden: out.length });
      }
      i = j;
    }
  };
  recorrer(limpio);
  return out;
}
/** Parte por comas de primer nivel (no dentro de paréntesis ni corchetes). */
export function partir(s: string, sep = ","): string[] {
  const out: string[] = []; let prof = 0, ini = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(" || c === "[") prof++; else if (c === ")" || c === "]") prof--;
    else if (c === sep && prof === 0) { out.push(s.slice(ini, i).trim()); ini = i + 1; }
  }
  out.push(s.slice(ini).trim());
  return out.filter(Boolean);
}
/** Especificidad [ids, clases/atributos/pseudoclases, tipos/pseudoelementos]; :is/:not toman la mayor de su lista, :where vale 0. */
export function especificidad(sel: string): [number, number, number] {
  let s = sel;
  const extra: [number, number, number] = [0, 0, 0];
  s = s.replace(/:(is|not|has|where)\(((?:[^()]|\([^()]*\))*)\)/g, (_m, f, dentro) => {
    if (f !== "where") { const max = partir(dentro).map(especificidad).sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2]).pop() ?? [0, 0, 0]; extra[0] += max[0]; extra[1] += max[1]; extra[2] += max[2]; }
    return " ";
  });
  const ids = (s.match(/#[\w-]+/g) ?? []).length;
  const cls = (s.match(/\.[\w-]+/g) ?? []).length + (s.match(/\[[^\]]*\]/g) ?? []).length + (s.replace(/::[\w-]+/g, "").match(/:[\w-]+/g) ?? []).length;
  const tipos = (s.replace(/\[[^\]]*\]/g, "").replace(/[.#:][\w-]+/g, "").match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) ?? []).length + (s.match(/::[\w-]+/g) ?? []).length;
  return [ids + extra[0], cls + extra[1], tipos + extra[2]];
}
/** Variantes de un selector con cada :is(...) desplegado (la especificidad se toma del selector original). */
export function variantes(sel: string): string[] {
  const m = sel.match(/:is\(((?:[^()]|\([^()]*\))*)\)/);
  if (!m || m.index === undefined) return [sel];
  return partir(m[1]).flatMap((alt) => variantes(sel.slice(0, m.index) + alt + sel.slice(m.index! + m[0].length)));
}
export type Elemento = { tag: string; clases: string[]; dir?: string };
type Compuesto = { tag?: string; clases: string[]; attrs: [string, string | undefined][]; pseudo: string[]; pe?: string };
function compuesto(c: string): Compuesto | null {
  const out: Compuesto = { clases: [], attrs: [], pseudo: [] };
  const m = c.match(/^([a-zA-Z][\w-]*|\*)?/);
  if (m?.[1] && m[1] !== "*") out.tag = m[1].toLowerCase();
  for (const t of c.slice(m?.[0].length ?? 0).matchAll(/\.([\w-]+)|\[([\w-]+)(?:=["']?([^"'\]]*)["']?)?\]|::([\w-]+)|:([\w-]+)(\([^)]*\))?/g)) {
    if (t[1]) out.clases.push(t[1]);
    else if (t[2]) out.attrs.push([t[2], t[3]]);
    else if (t[4]) out.pe = t[4];
    else if (t[5]) out.pseudo.push(t[5]);
  }
  return out;
}
function cumple(c: Compuesto, e: Elemento): boolean {
  if (c.pseudo.length) return false; // :hover, :where(...) sin desplegar, etc.: estado estático → no aplica
  if (c.tag && c.tag !== e.tag) return false;
  if (!c.clases.every((x) => e.clases.includes(x))) return false;
  return c.attrs.every(([k, v]) => (k === "dir" ? e.dir !== undefined && (v === undefined || e.dir === v) : false));
}
/** ¿La variante `sel` alcanza al último elemento de `cadena` (con el pseudoelemento `pe`, si hay)? Sólo combinadores « » y «>». */
export function alcanza(sel: string, cadena: Elemento[], pe?: string): boolean {
  const toks = sel.replace(/\s*>\s*/g, " > ").trim().split(/\s+/);
  const comps: { c: Compuesto; comb: string }[] = [];
  let comb = " ";
  for (const t of toks) { if (t === ">" || t === "+" || t === "~") { comb = t; continue; } const c = compuesto(t); if (!c) return false; comps.push({ c, comb }); comb = " "; }
  if (comps.some((x) => x.comb === "+" || x.comb === "~")) return false;
  const ultimo = comps[comps.length - 1];
  if ((ultimo.c.pe ?? undefined) !== pe) return false;
  const coincide = (k: number, idx: number): boolean => {
    if (!cumple(comps[k].c, cadena[idx])) return false;
    if (k === 0) return true;
    if (comps[k].comb === ">") return idx > 0 && coincide(k - 1, idx - 1);
    for (let j = idx - 1; j >= 0; j--) if (coincide(k - 1, j)) return true;
    return false;
  };
  return coincide(comps.length - 1, cadena.length - 1);
}
/** El valor que gana para `prop` (o la primera de `props` que declare una regla) sobre el último elemento de la cadena. */
export function gana(reglas: Regla[], cadena: Elemento[], props: string[], pe?: string): { valor: string; regla: Regla } | undefined {
  let mejor: { valor: string; regla: Regla; esp: [number, number, number] } | undefined;
  for (const r of reglas) {
    const prop = props.find((p) => r.decl[p] !== undefined);
    if (!prop) continue;
    for (const s of partir(r.sel)) {
      if (!variantes(s).some((v) => alcanza(v, cadena, pe))) continue;
      const esp = especificidad(s);
      const cmp = mejor ? esp[0] - mejor.esp[0] || esp[1] - mejor.esp[1] || esp[2] - mejor.esp[2] || r.orden - mejor.regla.orden : 1;
      if (cmp >= 0) mejor = { valor: r.decl[prop], regla: r, esp };
    }
  }
  return mejor && { valor: mejor.valor, regla: mejor.regla };
}
/** Cadenas de ancestros (de afuera hacia adentro) de cada elemento JSX de `src` que cumple `pred`, leyendo las etiquetas del fuente.
 *  `dir={dir}` se resuelve con `dir`. Las llaves de los atributos se saltean enteras (también las flechas `=>`). */
export function cadenasJsx(src: string, pred: (e: Elemento) => boolean, dir: string, base: Elemento[] = [], out: Elemento[][] = []): Elemento[][] {
  const pila: Elemento[] = [...base];
  let i = 0;
  while (i < src.length) {
    const lt = src.indexOf("<", i);
    if (lt < 0) break;
    const cierre = src.slice(lt).match(/^<\/([A-Za-z][\w.]*)?\s*>/);
    if (cierre) {
      const tag = (cierre[1] ?? "").toLowerCase();
      const k = pila.map((e) => e.tag).lastIndexOf(tag);
      if (k >= 0) pila.length = k;
      i = lt + cierre[0].length;
      continue;
    }
    const ap = src.slice(lt).match(/^<([A-Za-z][\w.]*)/);
    if (!ap) { i = lt + 1; continue; }
    let j = lt + ap[0].length, prof = 0, comilla = "";
    for (; j < src.length; j++) {
      const c = src[j];
      if (comilla) { if (c === comilla) comilla = ""; continue; }
      if (prof === 0 && (c === '"' || c === "'")) { comilla = c; continue; }
      if (c === "{") prof++; else if (c === "}") prof--;
      else if (prof === 0 && c === ">") break;
    }
    const attrs = src.slice(lt + ap[0].length, j);
    const auto = attrs.trimEnd().endsWith("/");
    // JSX dentro de un atributo (p. ej. `<Suspense fallback={<div …>…</div>}>`): se pinta en el lugar del elemento, con sus mismos ancestros.
    for (let k = 0; k < attrs.length; k++) {
      if (attrs[k] !== "{") continue;
      let p = 0, f = k;
      for (; f < attrs.length; f++) { if (attrs[f] === "{") p++; else if (attrs[f] === "}" && --p === 0) break; }
      const dentro = attrs.slice(k + 1, f);
      if (/<[A-Za-z]/.test(dentro)) cadenasJsx(dentro, pred, dir, pila, out);
      k = f;
    }
    const cls = attrs.match(/className="([^"]*)"/)?.[1] ?? attrs.match(/className=\{`([^`]*)`\}/)?.[1].replace(/\$\{[^}]*\}/g, " ") ?? "";
    const dirAttr = /\bdir=\{dir\}/.test(attrs) ? dir : attrs.match(/\bdir="([^"]*)"/)?.[1];
    const el: Elemento = { tag: ap[1].toLowerCase(), clases: cls.split(/\s+/).filter(Boolean), dir: dirAttr };
    if (pred(el)) out.push([...pila, el]);
    if (!auto) pila.push(el);
    i = j + 1;
  }
  return out;
}

// ─── Una expresión JSX del fuente, evaluada ───────────────────────────────────────────────────────────────────────────────────
/** El bloque `{…}` más chico del fuente que contiene todas las agujas (llaves contadas, sin mirar cadenas). */
export function bloqueConteniendo(src: string, agujas: string[]): string | undefined {
  let mejor: [number, number] | undefined;
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== "{" || src[i - 1] === "$") continue;
    let prof = 0, j = i;
    for (; j < src.length; j++) { if (src[j] === "{") prof++; else if (src[j] === "}" && --prof === 0) break; }
    const dentro = src.slice(i + 1, j);
    if (agujas.every((a) => dentro.includes(a)) && (!mejor || j - i < mejor[1] - mejor[0])) mejor = [i, j];
  }
  return mejor && src.slice(mejor[0] + 1, mejor[1]);
}
/** Evalúa `{expr}` como hijo de un fragmento y devuelve el texto que pinta, con las variables de `vars` (lo demás, de globalThis). */
export async function evaluarBloque(expr: string, vars: Record<string, unknown>): Promise<string> {
  const ts = ((await import(pathToFileURL(resolve(ROOT, "node_modules/typescript/lib/typescript.js")).href)) as any).default;
  const React = await react();
  const server = ((await import(pathToFileURL(resolve(ROOT, "node_modules/react-dom/server.node.js")).href)) as any);
  const js = ts.transpileModule(`__r = (<>{${expr}}</>);`, { fileName: "bloque.tsx", compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  const todasLasVars: Record<string, unknown> = { React, ...vars, __r: undefined };
  const alcance = new Proxy(todasLasVars, {
    has: () => true,
    get: (t, k) => (k === Symbol.unscopables ? undefined : k in t ? t[k as string] : (globalThis as any)[k]),
    set: (t, k, v) => { t[k as string] = v; return true; },
  });
  new Function("alcance", `with (alcance) { ${js} }`)(alcance);
  return desescapar((server.renderToStaticMarkup ?? server.default.renderToStaticMarkup)(todasLasVars.__r as any).replace(/<[^>]+>/g, ""));
}

// ─── CLAUDE.md ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** Sección «## <prefijo>…» de un markdown (hasta el siguiente «## »). */
export function seccion(texto: string, prefijo: string): string | undefined {
  const i = texto.search(new RegExp(`^## ${prefijo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m"));
  if (i < 0) return undefined;
  const resto = texto.slice(i + 3);
  const j = resto.search(/^## /m);
  return j < 0 ? resto : resto.slice(0, j);
}
