/**
 * PLANTILLA-01 (D-252..D-256, D-263) · crear una web de peluquería desde la plantilla A o C (inciso y: por consola, sobre el config y
 * el material del cliente; nunca el código compartido).
 *
 * Copia de `config/test-b4-peluqueria-<p>` el diseño entero y los textos como punto de partida, salvo:
 *   (1) los textos que nombran la marca, el lugar o las personas de la plantilla (D-253): quedan VACÍOS (sin la clave; en un array,
 *       «»), así `exportar` los lista y la consola los escribe con los datos de la clienta;
 *   (2) las reseñas y (3) el equipo de la plantilla: no se copian; el cliente CONSERVA su identidad, su equipo y sus reseñas con sus
 *       capas por idioma (`CONSERVA`), y si son los del preset o faltan, `avisos` lo dice (inciso z, `avisosDePreset`). Si la clienta
 *       no tiene reseñas, `testimonials` queda `[]` (no ausente): así ni la sección ni el hero cuentan las del preset.
 * El material de lo que se copia se COPIA al Storage del cliente (`clients/<id>/media/<rol>/<nombre>`, mismo rol y mismo nombre) por
 * `subirMaterial`: el token sale de los bytes copiados y ninguna url apunta a la plantilla (D-254). Retratos y logos de la plantilla
 * no se copian (son de lo que el cliente conserva).
 * En seco por defecto: dice qué copiaría y no baja, ni sube, ni escribe nada. Con `aplicar`: primero el material, después el config,
 * por `guardarConfig` (la lógica del PUT, D-255). El cuerpo es el resultado entero más un `null` por cada clave del cliente que no
 * está en el resultado: la fusión de Firestore deja exactamente el resultado.
 * Rechaza, sin escribir nada, una plantilla que no es a ni c, el tenant de una plantilla, las webs de prueba de E2E
 * (`tests/e2e-01-webs.json`: su config es la línea base de D2), un id sin config y un cliente que no es de peluquería.
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolveContentType, subirMaterial, type BucketMinimo } from "./media-upload.ts";
import { guardarConfig, type DbMinima } from "./guardar-config.ts";
import { buscarClienteHub, type ColeccionMinima } from "./hub-clients.ts";
import { avisosDePreset, type AvisoPreset } from "./avisos-preset.ts";

type Obj = Record<string, any>;
export type Paleta = "a" | "c";
export const PLANTILLAS: Record<Paleta, string> = { a: "test-b4-peluqueria-a", c: "test-b4-peluqueria-c" };
/** Las transliteraciones de cada marca, que el config no trae (medido: `translations.<l>.brand.name` no existe en A ni en C). */
export const TRANSLITERACION: Record<Paleta, string[]> = { a: ["Hadar", "Хадар", "هدار"], c: ["Noa", "Ноа", "نوعا"] };
/** Lo que el cliente conserva (D-252): en la raíz y, en cada capa `translations.<l>`, lo de `CONSERVA_CAPA`. */
export const CONSERVA = ["business", "brand", "contact", "adminEmail", "language", "status", "businessRules", "hours", "staff", "testimonials"];
export const CONSERVA_CAPA = ["brand", "contact", "staff", "testimonials"];
const IDIOMAS = ["he", "en", "ru", "ar"];

export type BucketCopia = { name: string; file(path: string): ReturnType<BucketMinimo["file"]> & { download(): Promise<[Buffer]> } };
export type Copia = { de: string; a: string; rol: string; nombre: string };
export type Resultado = { material: Copia[]; vaciados: string[]; cuerpo: Obj; escrito: boolean; avisos: AvisoPreset[] };

const esMapa = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const STORAGE = /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/([^?]+)\?alt=media&token=[0-9a-f]+$/;
const pathDe = (v: unknown) => (typeof v === "string" ? STORAGE.exec(v)?.[1] : undefined);

/** Lo que nombra a la plantilla (D-253): la marca y lo que va antes de «·», sus transliteraciones, cada campo de su dirección en cada
 *  idioma (también sin «רחוב », «ул. », «شارع » ni « St») y el nombre completo y de pila de cada persona de su equipo en cada idioma. */
export function nombresDePlantilla(p: Paleta, tenant: Obj): string[] {
  const out = new Set<string>();
  const add = (s: unknown) => { if (typeof s === "string" && s.trim().length > 1) out.add(s.trim()); };
  const marca = String(tenant.brand?.name ?? "");
  add(marca); add(marca.split(/\s*[·|]\s*/)[0]);
  TRANSLITERACION[p].forEach(add);
  const direccion = (a: unknown) => { for (const v of Object.values(esMapa(a) ? a : {})) { add(v); add(String(v).replace(/^(רחוב|ул\.|شارع)\s+/, "").replace(/\s+St$/, "")); } };
  direccion(tenant.contact?.address);
  for (const l of IDIOMAS) direccion(tenant.translations?.[l]?.contact?.address);
  const persona = (n: unknown) => { add(n); add(String(n ?? "").split(" ")[0]); };
  for (const s of Array.isArray(tenant.staff) ? tenant.staff : []) persona(s?.name);
  for (const l of IDIOMAS) for (const v of Object.values(esMapa(tenant.translations?.[l]?.staff) ? tenant.translations[l].staff : {})) persona((v as Obj)?.name);
  return [...out];
}

/** Recorre las hojas de texto de `o` (también dentro de arrays) con su ruta y su padre. */
function textos(o: unknown, ruta: string, fn: (ruta: string, v: string, padre: Obj | unknown[], k: string | number) => void) {
  if (Array.isArray(o)) o.forEach((x, i) => (typeof x === "string" ? fn(`${ruta}.${i}`, x, o, i) : textos(x, `${ruta}.${i}`, fn)));
  else if (esMapa(o)) for (const [k, x] of Object.entries(o)) typeof x === "string" ? fn(ruta ? `${ruta}.${k}` : k, x, o, k) : textos(x, ruta ? `${ruta}.${k}` : k, fn);
}

/** Un `null` por cada clave de `viejo` que no está en `nuevo` (bajando por los mapas; los arrays se reemplazan enteros). */
function nulos(viejo: Obj, nuevo: Obj): Obj {
  const out: Obj = {};
  for (const [k, v] of Object.entries(viejo)) {
    if (!(k in nuevo)) out[k] = null;
    else if (esMapa(v) && esMapa(nuevo[k])) { const n = nulos(v, nuevo[k]); if (Object.keys(n).length) out[k] = n; }
  }
  return out;
}
function fundir(a: Obj, b: Obj): Obj {
  const out: Obj = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = esMapa(v) && esMapa(out[k]) ? fundir(out[k], v) : v;
  return out;
}

/** Las webs de prueba de E2E (su config es la línea base de D2): no se tocan. */
function websDeE2e(): string[] {
  const f = fileURLToPath(new URL("../../tests/e2e-01-webs.json", import.meta.url));
  if (!existsSync(f)) return [];
  return (JSON.parse(readFileSync(f, "utf8")).webs ?? []).map((w: Obj) => String(w.clientId));
}

export async function desdePlantilla(
  { clientId, plantilla, aplicar = false }: { clientId: string; plantilla: string; aplicar?: boolean },
  deps: { db: DbMinima; bucket: BucketCopia },
): Promise<Resultado> {
  if (plantilla !== "a" && plantilla !== "c") throw new Error(`plantilla «${plantilla}» rechazada: sólo a o c; no se tocó nada`);
  const p = plantilla as Paleta;
  if (/^test-b4-peluqueria/.test(clientId)) throw new Error(`«${clientId}» es el tenant de una plantilla: no se crea una web encima; no se tocó nada`);
  if (websDeE2e().includes(clientId)) throw new Error(`«${clientId}» es una web de prueba de E2E (su config es la línea base de D2); no se tocó nada`);

  const snap = await deps.db.collection("config").doc(clientId).get();
  if (!snap.exists) throw new Error(`«${clientId}» no existe (no hay config/${clientId}): primero el alta en la ficha; no se tocó nada`);
  const cliente: Obj = snap.data() ?? {};
  const hub = await buscarClienteHub(clientId, { coleccion: deps.db.collection("hub_clients") as unknown as ColeccionMinima });
  const nicho = String(hub?.data?.niche ?? cliente.business?.type ?? "");
  if (nicho !== "peluqueria") throw new Error(`«${clientId}» no es de peluquería (nicho «${nicho || "sin nicho"}»): las plantillas A y C son de peluquería; no se tocó nada`);

  const t = await deps.db.collection("config").doc(PLANTILLAS[p]).get();
  if (!t.exists) throw new Error(`no existe config/${PLANTILLAS[p]} (la plantilla ${p}); no se tocó nada`);
  const tenant: Obj = t.data() ?? {};

  // Lo que se copia: la plantilla sin lo que el cliente conserva.
  const copia: Obj = structuredClone(tenant);
  for (const k of CONSERVA) delete copia[k];
  for (const capa of Object.values(esMapa(copia.translations) ? copia.translations : {})) if (esMapa(capa)) for (const k of CONSERVA_CAPA) delete capa[k];

  // (1) Vacíos: los textos que nombran a la plantilla (sin los metadatos de la paleta, que la página no pinta).
  const nombres = nombresDePlantilla(p, tenant);
  const vaciar: [Obj | unknown[], string | number][] = [], vaciados: string[] = [];
  textos(copia, "", (ruta, v, padre, k) => {
    if (/^https?:/.test(v) || /^(palette|branding\.paletteMeta)\./.test(ruta) || !nombres.some((n) => v.includes(n))) return;
    vaciados.push(ruta); vaciar.push([padre, k]);
  });
  for (const [padre, k] of vaciar) Array.isArray(padre) ? (padre[k as number] = "") : delete (padre as Obj)[k as string];

  // El material: cada archivo de Storage de lo que se copia, de la plantilla al cliente (mismo rol, mismo nombre).
  const material = new Map<string, Copia>();
  textos(copia, "", (_r, v) => {
    const path = pathDe(v);
    if (!path) return;
    const de = decodeURIComponent(path), partes = de.split("/");
    if (partes.length !== 5 || partes[0] !== "clients" || partes[2] !== "media") throw new Error(`url de Storage con una forma que no se sabe copiar: ${de}; no se tocó nada`);
    material.set(de, { de, a: `clients/${clientId}/media/${partes[3]}/${partes[4]}`, rol: partes[3], nombre: partes[4] });
  });

  // El resultado: lo copiado más lo que el cliente conserva (en la raíz y en cada capa).
  const armar = (): Obj => {
    const r: Obj = { ...copia };
    for (const k of CONSERVA) if (k in cliente) r[k] = structuredClone(cliente[k]);
    // Sin reseñas de la clienta, la lista queda VACÍA, no ausente (Liam, 2026-10-05, en W1): sin la clave la página cae a las tres del
    // preset y el hero v6 las cuenta («5.0 · 3 ביקורות») aunque la sección esté oculta; una lista vacía reemplaza al preset (A2, D-263).
    if (!Array.isArray(cliente.testimonials) || cliente.testimonials.length === 0) r.testimonials = [];
    const capas: Obj = structuredClone(esMapa(copia.translations) ? copia.translations : {});
    for (const [l, capa] of Object.entries(esMapa(cliente.translations) ? cliente.translations : {})) {
      if (!esMapa(capa)) continue;
      for (const k of CONSERVA_CAPA) if (k in capa) capas[l] = { ...(capas[l] ?? {}), [k]: structuredClone(capa[k]) };
    }
    if (Object.keys(capas).length) r.translations = capas; else delete r.translations;
    return r;
  };
  let resultado = armar();
  const avisos = avisosDePreset(resultado, "peluqueria");
  const plan = (cuerpo: Obj, escrito: boolean): Resultado => ({ material: [...material.values()], vaciados, cuerpo, escrito, avisos });
  if (!aplicar) return plan(fundir(resultado, nulos(cliente, resultado)), false);

  // Con aplicar: primero el material (idempotente: los mismos bytes dan la misma url), después el config.
  const urls = new Map<string, string>();
  for (const m of material.values()) {
    const [buffer] = await deps.bucket.file(m.de).download();
    const subida = await subirMaterial({ clientId, rol: m.rol, nombre: m.nombre, buffer, contentType: resolveContentType(m.nombre, "") }, { bucket: deps.bucket });
    urls.set(m.de, subida.url);
  }
  const reemplazar = (o: unknown): unknown => {
    if (typeof o === "string") { const path = pathDe(o); return path ? urls.get(decodeURIComponent(path)) ?? o : o; }
    if (Array.isArray(o)) return o.map(reemplazar);
    if (esMapa(o)) return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, reemplazar(v)]));
    return o;
  };
  for (const k of Object.keys(copia)) copia[k] = reemplazar(copia[k]);
  resultado = armar();
  const cuerpo = fundir(resultado, nulos(cliente, resultado));
  const r = await guardarConfig(clientId, cuerpo, { db: deps.db, quien: "consola desde-plantilla" });
  if (!r.ok) throw new Error(`el guardado dio ${r.status} (${r.error}): ${r.issues.map((e) => `${e.path}: ${e.message}`).join(" | ")}. El material quedó en clients/${clientId}/media/ (idempotente); el config no cambió`);
  return plan(cuerpo, true);
}
