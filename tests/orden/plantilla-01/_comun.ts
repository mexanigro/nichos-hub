// Utilidades de la orden PLANTILLA-01 (sesión A, 2026-10-05). Se llama `_comun.ts` y no `_util.ts` (regla heredada de CONEXION-05 y
// VERDAD-09: la copia promovida `tests/verdad-08-a.test.ts` recorre los `tests/orden/*/_util.ts` de las aprobadas).
// COPIADO (no importado: esas carpetas quedan congeladas al aprobarse su orden) y RECORTADO de `tests/orden/alta-idiomas-01/_comun.ts`
// (la identidad del repo, la lectura de CLAUDE.md, el cargador de .ts/.tsx de H, la fusión `merge: true` de Firestore, el cliente de
// Anthropic falso, `envDe` y `leerDoc`) y de `tests/orden/e2e-01/_comun.ts` (`vercel`: la API de Vercel en LECTURA); y ampliado con lo
// suyo: un Firestore EN MEMORIA (`dbFalsa`) y un Storage EN MEMORIA (`bucketFalso`) que se inyectan —npm test no sale a la red—, los
// fixtures A y C copiados byte a byte de T 3222922 a esta carpeta (inciso l), el tenant de una plantilla armado como lo arma
// `scripts/b4-tenant.ts create --fixture`, un cliente recién dado de alta por `buildProvisionDocs` (lo que escribe el alta, D-251) y la
// regla de D-253: qué texto nombra a una plantilla.
// Caja negra: nada importa src/*, tools/* ni scripts/* de forma estática; los módulos de H se importan con `import()` dinámico dentro
// del test. Sólo en H (inciso n: esta orden no tiene afirmaciones en T, D-249). Los especificadores de paquetes que el `tsc` no debe
// resolver (firebase-admin) van en una variable.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { register } from "node:module";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, git } from "../verdad-02/_util.ts";

export { ROOT, git } from "../verdad-02/_util.ts";

/** Esta orden. */
export const ORDEN = "plantilla-01";
/** Commit aprobado de ALTA-IDIOMAS-01 (Liam, 2026-10-05) y su último rojo en H. */
export const ALTA_IDIOMAS_01 = { aprobado: { T: "3222922", H: "5502f02" }, rojo: { H: "8dc015c" } };
/** Los cuatro idiomas de una web (inciso r). */
export const IDIOMAS = ["he", "en", "ru", "ar"] as const;
/** El id del tenant de cada plantilla (`config/{id}` en Firestore, D-16). */
export const PLANTILLAS = { a: "test-b4-peluqueria-a", c: "test-b4-peluqueria-c" } as const;
export type Paleta = keyof typeof PLANTILLAS;
/** El cliente de los tests: su `config/{id}` y su documento de `hub_clients`, que el alta crea con un id al azar (medido: el demo de
 *  ALTA-IDIOMAS-01 es `bE9tKe6XEnGgR6ZuM6B8` con `clientId` `demo-demo-alta-idiomas-f2dfb64e`). */
export const CLIENTE = "demo-salon-de-prueba-0001";
export const HUB_DOC = "hubDocAzar0001";
/** Raíz real de T por ruta fija (sólo para leer, como hueco.mjs). */
export const RAIZ_T = "C:/Users/liama/Desktop/Nichos/Barber-shop-template-main";

/** Fuente de un archivo del repo propio, y si existe. */
export const fuente = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");
export const existe = (rel: string) => existsSync(resolve(ROOT, rel));

/** Sección «## <titulo>» de un CLAUDE.md dado (hasta el siguiente «## »). */
export function seccionDeTexto(texto: string, titulo: string): string {
  const i = texto.search(new RegExp(`^## ${titulo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m"));
  if (i < 0) throw new Error(`CLAUDE.md sin sección «## ${titulo}»`);
  const resto = texto.slice(i + 3);
  const j = resto.search(/^## /m);
  return j < 0 ? resto : resto.slice(0, j);
}
/** El párrafo «**<ID> (AAAA-MM-DD):** …» de § Puertas automáticas, o undefined. */
export function parrafoDe(texto: string, id: string): string | undefined {
  const puertas = seccionDeTexto(texto, "Puertas automáticas");
  return puertas.split(/\r?\n/).find((l) => new RegExp(`^\\*\\*${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\(\\d{4}-\\d{2}-\\d{2}\\):\\*\\*`).test(l));
}
/** Cuerpo del bloque ```ini de CONTRATO-DECLARADO en un CLAUDE.md dado. */
export function bloqueDe(texto: string): string {
  const m = texto.match(/<!--\s*CONTRATO-DECLARADO[\s\S]*?-->\s*```ini\r?\n([\s\S]*?)```/);
  if (!m) throw new Error("CLAUDE.md sin bloque CONTRATO-DECLARADO");
  return m[1];
}

// ─── El cargador de .ts/.tsx de H, copiado de ../alta-idiomas-01/_comun.ts ──────────────────────────────────────────────────────
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
const registrado = new Set<string>();
/** Registra el hook una vez por raíz en este proceso y devuelve el módulo de `rel` (relativo al repo propio). */
export async function importarModulo(rel: string, dev = false): Promise<Record<string, any>> {
  const clave = `${ROOT}|${dev}`;
  if (!registrado.has(clave)) { register("data:text/javascript," + encodeURIComponent(fuenteCargadorTsx(ROOT, dev)), { parentURL: pathToFileURL(ROOT + "/").href }); registrado.add(clave); }
  return (await import(pathToFileURL(resolve(ROOT, rel)).href)) as Record<string, any>;
}

// ─── Los datos: fixtures, el tenant de una plantilla y el cliente que crea el alta ──────────────────────────────────────────────
export type Cfg = Record<string, any>;
export type Issue = { path: string; message: string; severity: "error" | "warning" };
export const porJson = <T>(c: T): T => JSON.parse(JSON.stringify(c));

/** El fixture de la paleta `p`, copiado byte a byte de `T dev-fixtures/peluqueria-paleta-<p>.json` (T 3222922) a esta carpeta. */
export const fixture = (p: Paleta): Cfg => JSON.parse(readFileSync(resolve(ROOT, "tests", "orden", ORDEN, `peluqueria-paleta-${p}.json`), "utf8"));

/** `config/test-b4-peluqueria-<p>` como lo escribe `scripts/b4-tenant.ts create --fixture` (lo que `recrear` dejó en Firestore,
 *  medido el 2026-10-05: las claves del fixture más las del alta —adminEmail, activeTheme, businessRules, features, language, splash—). */
export async function tenantDePlantilla(p: Paleta): Promise<Cfg> {
  const { buildProvisionDocs } = await importarModulo("src/lib/provisioning.ts");
  const fx = fixture(p), id = PLANTILLAS[p];
  const docs = buildProvisionDocs({
    businessName: fx.brand?.name ?? id, niche: "peluqueria", mode: fx.business?.mode === "solo" ? "solo" : "team", slug: id,
    domain: `${id}.arzac.studio`, language: "he", phone: fx.contact?.phone ?? "+972 3-000-0000", email: "website@arzac.studio",
    address: fx.contact?.address ?? "", tagline: fx.brand?.tagline ?? "", description: "tenant de prueba",
  });
  return porJson({ ...docs.config, ...fx, business: { ...docs.config.business, ...(fx.business ?? {}) } });
}

/** El cliente de peluquería recién dado de alta (`buildProvisionDocs`, como `/api/clients/provision`), más lo que la ficha le pudo
 *  agregar antes de crear desde plantilla: una reseña de la clienta con su capa en inglés, la especialidad de Noa en inglés y un texto
 *  viejo en el hero. La identidad es distinta de la de las plantillas en cada campo (teléfono, email, dirección, nombre). */
export async function clienteDeAlta(id = CLIENTE, niche = "peluqueria"): Promise<{ hub: Cfg; config: Cfg }> {
  const { buildProvisionDocs } = await importarModulo("src/lib/provisioning.ts");
  const docs = buildProvisionDocs({
    businessName: "סלון הבדיקה", niche, mode: "team", slug: id, domain: `${id}.arzac.studio`, language: "he",
    phone: "+972 3-000-0001", email: "salon@example.com", address: "רחוב הבדיקה 1", tagline: "", description: "", adminEmail: "duena@example.com",
  });
  const config: Cfg = porJson(docs.config);
  config.testimonials = [{ id: "r1", name: "לקוחה", text: "שירות נהדר ואווירה טובה", rating: 5, lang: "he" }];
  config.translations = { en: { testimonials: { r1: { text: "Great service and a good atmosphere" } }, staff: { noa: { specialty: "Colour" } } } };
  config.hero = { eyebrow: "טקסט ישן של הלקוחה" };
  return { hub: porJson({ ...docs.hubClient, createdAt: "2026-10-05T00:00:00.000Z", activationDate: "2026-10-05T00:00:00.000Z" }), config };
}

/** Lo que el cliente CONSERVA al crear desde plantilla (D-252): su identidad, su equipo y sus reseñas, con sus capas por idioma. */
export const CONSERVA = ["business", "brand", "contact", "adminEmail", "language", "status", "businessRules", "hours", "staff", "testimonials"];
export const CONSERVA_CAPA = ["brand", "contact", "staff", "testimonials"];
/** ¿La hoja `ruta` (con puntos, índices incluidos) es de lo que el cliente conserva? */
export function esConserva(ruta: string): boolean {
  const p = ruta.split(".");
  if (CONSERVA.includes(p[0])) return true;
  return p[0] === "translations" && p.length > 2 && CONSERVA_CAPA.includes(p[2]);
}

/** Las hojas de un objeto: [ruta con puntos (los índices de array también), valor]. Un objeto o array vacío no es hoja. */
export function hojas(v: unknown, ruta = ""): [string, unknown][] {
  if (Array.isArray(v)) return v.flatMap((x, i) => hojas(x, ruta ? `${ruta}.${i}` : String(i)));
  if (v && typeof v === "object") return Object.entries(v as Cfg).flatMap(([k, x]) => hojas(x, ruta ? `${ruta}.${k}` : k));
  return [[ruta, v]];
}
export const leer = (o: unknown, ruta: string) => ruta.split(".").reduce<any>((a, k) => (a != null && typeof a === "object" ? a[k] : undefined), o);

// ─── D-253: qué texto nombra a una plantilla ────────────────────────────────────────────────────────────────────────────────────
/** Las transliteraciones de la marca que el config no trae (medido: `translations.<l>.brand.name` no existe en A ni en C). */
export const TRANSLITERACION: Record<Paleta, string[]> = { a: ["Hadar", "Хадар", "هدار"], c: ["Noa", "Ноа", "نوعا"] };
/** Lo que nombra a la plantilla `p` (D-253): la marca entera y lo que va antes de «·», sus transliteraciones, cada campo de su dirección
 *  en cada idioma (también sin «רחוב », «ул. », «شارع » ni « St»), y el nombre completo y el de pila de cada persona de su equipo en
 *  cada idioma. */
export function nombresDePlantilla(p: Paleta): string[] {
  const fx = fixture(p), out = new Set<string>();
  const add = (s: unknown) => { if (typeof s === "string" && s.trim().length > 1) out.add(s.trim()); };
  const marca = String(fx.brand?.name ?? "");
  add(marca); add(marca.split(/\s*[·|]\s*/)[0]);
  TRANSLITERACION[p].forEach(add);
  const direccion = (a: unknown) => { for (const v of Object.values((a ?? {}) as Cfg)) { add(v); add(String(v).replace(/^(רחוב|ул\.|شارع)\s+/, "").replace(/\s+St$/, "")); } };
  direccion(fx.contact?.address);
  for (const l of IDIOMAS) direccion(fx.translations?.[l]?.contact?.address);
  const persona = (n: unknown) => { add(n); add(String(n ?? "").split(" ")[0]); };
  for (const s of fx.staff ?? []) persona(s?.name);
  for (const l of IDIOMAS) for (const v of Object.values((fx.translations?.[l]?.staff ?? {}) as Cfg)) persona((v as Cfg)?.name);
  return [...out];
}
/** Las hojas de texto del tenant de `p` que se copian (fuera de lo que el cliente conserva y sin urls) y nombran a la plantilla: las
 *  que desde-plantilla deja VACÍAS (D-252, D-253). Medido el 2026-10-05: A 5, C 20. */
export function vaciadosDe(p: Paleta, tenant: Cfg): string[] {
  const nombres = nombresDePlantilla(p);
  return hojas(tenant).filter(([r, v]) => typeof v === "string" && !/^https?:/.test(v) && !esConserva(r) && !/^(palette|branding\.paletteMeta)\./.test(r) && nombres.some((n) => v.includes(n))).map(([r]) => r);
}

// ─── Storage: urls, tokens y un bucket en memoria ───────────────────────────────────────────────────────────────────────────────
export const tokenDe = (b: Buffer) => createHash("sha256").update(b).digest("hex").slice(0, 32);
/** `{ bucket, path, token }` de una url de descarga de Firebase Storage, o undefined. */
export function deStorage(url: unknown): { bucket: string; path: string; token: string } | undefined {
  if (typeof url !== "string") return undefined;
  const m = url.match(/^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/([^/]+)\/o\/([^?]+)\?alt=media&token=([0-9a-f]+)$/);
  return m ? { bucket: m[1], path: decodeURIComponent(m[2]), token: m[3] } : undefined;
}
/** Bytes falsos y distintos por path: el token de la copia tiene que salir de ESTOS bytes, no de la url de la plantilla. */
export const bytesDe = (path: string) => Buffer.from(`bytes de prueba de ${path}`);

export type Subida = { path: string; buffer: Buffer; metadata: Cfg };
/** Un Storage en memoria con la forma de `BucketMinimo` (src/lib/media-upload.ts) más `download()`: lo que necesita copiar material. */
export function bucketFalso(inicial: Record<string, Buffer> = {}) {
  const archivos = new Map<string, Buffer>(Object.entries(inicial));
  const subidas: Subida[] = [], bajadas: string[] = [];
  const bucket = {
    name: "falso",
    file(path: string) {
      return {
        async save(buffer: Buffer, opts: { metadata: Cfg }) { subidas.push({ path, buffer, metadata: opts?.metadata ?? {} }); archivos.set(path, Buffer.from(buffer)); },
        async download(): Promise<[Buffer]> { bajadas.push(path); const b = archivos.get(path); if (!b) throw new Error(`No such object: ${path}`); return [Buffer.from(b)]; },
        async exists(): Promise<[boolean]> { return [archivos.has(path)]; },
        async setMetadata() { return undefined; },
      };
    },
  };
  return { bucket, archivos, subidas, bajadas };
}

// ─── Firestore en memoria (la forma `DbMinima` de D-255) ────────────────────────────────────────────────────────────────────────
const esMapa = (v: unknown): v is Cfg => !!v && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
/** `set(data, { merge: true })` de Firestore sobre `doc` (copiado de ../alta-idiomas-01/_comun.ts); `esBorrar` reconoce `FieldValue.delete()`. */
export function fusionar(doc: Cfg, data: Cfg, esBorrar: (v: unknown) => boolean): Cfg {
  const out = structuredClone(doc);
  for (const [k, v] of Object.entries(data)) {
    if (esBorrar(v)) delete out[k];
    else if (esMapa(v) && Object.keys(v).length) out[k] = fusionar(esMapa(out[k]) ? out[k] : {}, v, esBorrar);
    else out[k] = clonar(v);
  }
  return out;
}
/** Copia sin los centinelas de Firestore que no se pueden clonar (serverTimestamp queda como el texto «serverTimestamp»). */
function clonar(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(clonar);
  if (v && typeof v === "object") {
    if (!esMapa(v)) return Object.getPrototypeOf(v)?.constructor?.name === "Timestamp" || "methodName" in (v as Cfg) ? `centinela:${String((v as Cfg).methodName ?? "")}` : structuredClone(v);
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clonar(x)]));
  }
  return v;
}

export type Escritura = { coleccion: string; id: string; data: Cfg; opts?: Cfg };
/** Un Firestore en memoria: `docs` es «<colección>/<id>» → datos. Cuenta cada `set` en `escrituras` y cada `add` en `agregados`. */
export async function dbFalsa(inicial: Record<string, Cfg>) {
  const ESPEC = "firebase-admin/firestore";
  const { FieldValue } = (await import(ESPEC)) as { FieldValue: { delete: () => unknown } };
  const borrar = FieldValue.delete() as { isEqual: (o: unknown) => boolean };
  const esBorrar = (v: unknown) => !!v && typeof v === "object" && typeof (v as Cfg).isEqual === "function" && borrar.isEqual(v);
  const docs = new Map<string, Cfg>(Object.entries(porJson(inicial)));
  const escrituras: Escritura[] = [], agregados: { coleccion: string; data: Cfg }[] = [];
  const snap = (coleccion: string, id: string) => {
    const d = docs.get(`${coleccion}/${id}`);
    return { exists: d !== undefined, id, data: () => (d === undefined ? undefined : structuredClone(d)) };
  };
  const coleccion = (nombre: string) => ({
    doc(id: string) {
      return {
        id,
        async get() { return snap(nombre, id); },
        async set(data: Cfg, opts?: Cfg) {
          escrituras.push({ coleccion: nombre, id, data: clonar(data) as Cfg, opts });
          const previo = docs.get(`${nombre}/${id}`) ?? {};
          docs.set(`${nombre}/${id}`, opts?.merge ? fusionar(previo, data, esBorrar) : (clonar(data) as Cfg));
        },
        collection(sub: string) {
          return { async add(data: Cfg) { agregados.push({ coleccion: `${nombre}/${id}/${sub}`, data: clonar(data) as Cfg }); return { id: `auto${agregados.length}` }; } };
        },
      };
    },
    where(campo: string, _op: string, valor: unknown) {
      return {
        limit(n: number) {
          return {
            async get() {
              const hits = [...docs.entries()].filter(([k, d]) => k.startsWith(`${nombre}/`) && k.split("/").length === 2 && d?.[campo] === valor).slice(0, n);
              const ds = hits.map(([k, d]) => ({ id: k.split("/")[1], data: () => structuredClone(d) }));
              return { empty: ds.length === 0, size: ds.length, docs: ds };
            },
          };
        },
      };
    },
  });
  return { db: { collection: coleccion }, docs, escrituras, agregados, doc: (c: string, id: string) => docs.get(`${c}/${id}`) };
}

/** El mundo de un test: los dos tenants de plantilla con su material en el bucket, el cliente recién dado de alta, un cliente de
 *  barbería y las dos webs de prueba de E2E (clientes de peluquería válidos, cuya config es la línea base de D2). */
export async function mundo() {
  const inicial: Record<string, Cfg> = {};
  const material: Record<string, Buffer> = {};
  for (const p of Object.keys(PLANTILLAS) as Paleta[]) {
    const t = await tenantDePlantilla(p);
    inicial[`config/${PLANTILLAS[p]}`] = t;
    inicial[`hub_clients/${PLANTILLAS[p]}`] = { clientId: PLANTILLAS[p], niche: "peluqueria", businessName: t.brand?.name, language: "he", status: "demo" };
    for (const [, v] of hojas(t)) { const s = deStorage(v); if (s) material[s.path] = bytesDe(s.path); }
  }
  const alta = await clienteDeAlta();
  inicial[`config/${CLIENTE}`] = alta.config;
  inicial[`hub_clients/${HUB_DOC}`] = alta.hub;
  inicial[`clients/${CLIENTE}`] = { status: "active" };
  const barberia = await clienteDeAlta("demo-barberia-de-prueba-0002", "barberia");
  inicial[`config/demo-barberia-de-prueba-0002`] = barberia.config;
  inicial[`hub_clients/hubDocAzar0002`] = barberia.hub;
  const e2e = webs().map((w) => w.clientId);
  for (const [i, id] of e2e.entries()) {
    const w = await clienteDeAlta(id);
    inicial[`config/${id}`] = w.config;
    inicial[`hub_clients/hubDocE2e${i}`] = w.hub;
  }
  const db = await dbFalsa(inicial);
  const st = bucketFalso(material);
  return { ...db, ...st, e2e, barberia: "demo-barberia-de-prueba-0002", inicial: porJson(inicial) };
}

/** Las webs de prueba de E2E declaradas en `tests/e2e-01-webs.json` (su config es la línea base de D2). */
export const webs = (): { clientId: string; paleta: string }[] => JSON.parse(fuente("tests/e2e-01-webs.json")).webs;

// ─── El cliente de Anthropic falso (para comparar exportar con lo que pide escribirTextos) ──────────────────────────────────────
export type Pedido = { system: string; user: string; params: Cfg; rutas: string[] };
const textoDe = (v: unknown): string => (typeof v === "string" ? v : Array.isArray(v) ? v.map((b) => (typeof b === "string" ? b : String((b as Cfg)?.text ?? ""))).join("\n") : "");
export function clienteFalso(responder: (rutas: string[], n: number) => Record<string, string>) {
  const pedidos: Pedido[] = [];
  const cliente = {
    messages: {
      async create(params: Cfg) {
        const { messages, ...resto } = params;
        const props = params?.output_config?.format?.schema?.properties;
        const rutas = props && typeof props === "object" ? Object.keys(props) : [];
        pedidos.push({ system: textoDe(params.system), user: (Array.isArray(messages) ? messages : []).map((m: Cfg) => textoDe(m?.content)).join("\n"), params: porJson(resto), rutas });
        const json = responder(rutas, pedidos.length);
        return { id: `msg_falso_${pedidos.length}`, type: "message", role: "assistant", model: params.model, stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(json) }], usage: { input_tokens: 1000, output_tokens: 500 } };
      },
    },
  };
  return { cliente, pedidos };
}
export const cumplidor = (rutas: string[], n: number) => Object.fromEntries(rutas.map((r) => [r, /^services\..+\.description$/.test(r) ? `k${n}w uno dos tres cuatro cinco seis` : `k${n}w texto`]));

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
