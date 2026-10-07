/**
 * MARCA-01 (M1-3, M1-6, D-289, D-293) · el material de la web de una clienta, por consola: medirlo hueco por hueco y subirlo.
 *
 * La medición vive en T (`tools/gama.mjs`: Chromium por playwright); el config, el Storage y los avisos, en H. `aprobarMaterial`
 * recibe `bajar` y `medir` inyectados: los tests la corren con dobles y la consola (`scripts/material.ts aprobar`) con el `medir` de T
 * importado del hermano por su ruta fija (`medirConGama`). No se duplica la medición.
 *
 * Los gates por hueco son los de M1-3: los clips webm → T·K·E·N (V es dato); la textura → T·K·Q·N; el local y el local vertical →
 * K·N con T como dato («su salón»); servicios y galería → T·K·S·N, sin F (R24); los retratos → K·S·N con T como dato («su retrato»).
 * Los pósteres, los mp4, Instagram, la imagen del link y los logos sólo se bajan (heredan o no se miden: Chromium no decodifica h264).
 * Material de la plantilla: un hueco cuyos bytes son los de un archivo de la plantilla A o C (el token de Storage es el sha256 del
 * contenido, D-22): se reconoce por el token, sin marca nueva en el config.
 * Importable con `node --experimental-strip-types` (imports relativos con extensión, sin alias `@/`).
 */
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { resolveContentType, subirMaterial, type BucketMinimo } from "./media-upload.ts";
import { guardarConfig, type DbMinima } from "./guardar-config.ts";
import { instagramSigueA } from "./galeria-instagram.ts";

type Obj = Record<string, any>;
export type Veredicto = "PASA" | "NO";
export type HuecoMaterial = { ruta: string; url: string; veredicto: Veredicto; motivos: string[] };
export type Aprobacion = { huecos: HuecoMaterial[]; pasa: boolean };
export type AvisoMaterial = { seccion: "material"; message: string };
/** Un archivo como lo recibe `medir` de gama.mjs (`archivosDeFixture`). */
export type ArchivoMedido = { role: string; src: string; kind: "video" | "image"; v?: boolean; quietud?: boolean; serie?: string; excepcion?: string };
export type Medir = (files: ArchivoMedido[], colors: Obj) => Promise<{ rows: Obj[] }>;
export type Bajar = (url: string) => Promise<{ status: number; bytes?: Buffer }>;

const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const get = (o: unknown, ruta: string) => ruta.split(".").reduce<any>((a, k) => (a != null && typeof a === "object" ? a[k] : undefined), o);
const lleno = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
export const tokenDe = (b: Buffer) => createHash("sha256").update(b).digest("hex").slice(0, 32);
const STORAGE = /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/([^?]+)\?alt=media&token=([0-9a-f]+)$/;
const tokenDeUrl = (v: unknown) => (typeof v === "string" ? STORAGE.exec(v)?.[2] : undefined);

/** Cómo se mide cada hueco (M1-3); `null` = sólo se baja. */
type Medida = Omit<ArchivoMedido, "src"> | null;
/** Los huecos con material del config, en orden, con su medida. Los vacíos y el respaldo `gallery[]` no cuentan. */
export function huecosDeMaterial(config: unknown): { ruta: string; url: string; medida: Medida }[] {
  const c = obj(config), out: { ruta: string; url: string; medida: Medida }[] = [];
  const add = (ruta: string, medida: Medida) => { const v = get(c, ruta); if (lleno(v)) out.push({ ruta, url: v, medida }); };
  add("hero.video.mp4", null);
  add("hero.video.webm", { role: "clip 16:9", kind: "video", v: true });
  add("hero.video.poster", null);
  add("hero.video.medium.mp4", null);
  add("hero.video.medium.webm", null);
  add("hero.video.portrait.mp4", null);
  add("hero.video.portrait.webm", { role: "clip 9:16", kind: "video", v: true });
  add("hero.video.portrait.poster", null);
  add("branding.texture", { role: "textura", kind: "image", quietud: true });
  add("branding.localPhoto", { role: "local 16:9", kind: "image", excepcion: "su salón" });
  add("branding.localPhotoMobile", { role: "local 9:16", kind: "image", excepcion: "su salón" });
  lista(c.sections?.services?.images).forEach((_, i) => add(`sections.services.images.${i}`, { role: `servicio ${i + 1}`, kind: "image", serie: "servicio" }));
  lista(c.sections?.gallery?.items).forEach((_, i) => add(`sections.gallery.items.${i}.src`, { role: `galería ${i + 1}`, kind: "image", serie: "galería" }));
  lista(c.sections?.instagram?.images).forEach((_, i) => add(`sections.instagram.images.${i}`, null));
  lista(c.staff).forEach((_, i) => add(`staff.${i}.photoUrl`, { role: `retrato ${i + 1}`, kind: "image", serie: "retrato", excepcion: "su retrato" }));
  add("brand.logo", null);
  add("brand.logoDark", null);
  add("brand.ogImage", null);
  return out;
}

/** Los tokens de Storage de cada url de una plantilla (A o C), con su letra. */
function tokensDePlantillas(plantillas: { a?: unknown; c?: unknown }): Map<string, string> {
  const out = new Map<string, string>();
  const ver = (v: unknown, p: string): void => {
    if (typeof v === "string") { const t = tokenDeUrl(v); if (t) out.set(t, p); }
    else if (v && typeof v === "object") Object.values(v).forEach((x) => ver(x, p));
  };
  for (const p of ["a", "c"] as const) ver(plantillas[p], p.toUpperCase());
  return out;
}

const num = (x: unknown, d = 4) => (typeof x === "number" ? x.toFixed(d).replace(".", ",") : "—");
/** Cada medida que falla de una fila de gama.mjs, con su número. */
function motivosDeFila(r: Obj): string[] {
  if (r.error) return [`no se puede medir (${r.error})`];
  const m: string[] = [];
  if (r.T === false) m.push(`T: tono a ${r.dHue ?? "—"}° del acento, ${num((r.fuera ?? 0) * 100, 1)} % fuera de ±35°`);
  if (r.K === false) m.push(`K: temperatura b ${num(r.b, 3)} con el signo contrario al acento`);
  if (r.N === false) m.push(`N: dN ${num(r.dN)} · tono ${typeof r.Hn === "number" ? r.Hn.toFixed(0) : "—"}°`);
  if (r.S === false) m.push(`S: L a ${num(r.dL, 3)} de la mediana de la serie`);
  if (r.F === false) m.push(`F: pared a ΔE ${num(r.dEfondo, 3)}`);
  if (r.Q === false) m.push(`Q: quietud ΔL ${num(r.dLq, 3)}, contraste ${num(r.contrasteQ, 1)}`);
  if (r.E === false) m.push(`E: escena ΔL ${num(r.dLesc, 3)} contra el local`);
  if (!m.length && r.pasa === false) m.push("no pasa gama.mjs");
  return m;
}
const EXT = /\.(mp4|webm|avif|jpe?g|png|webp|svg|gif)$/i;
const extension = (url: string) => { const p = decodeURIComponent(STORAGE.exec(url)?.[1] ?? url.split("?")[0]); return EXT.exec(p)?.[0] ?? ""; };

/**
 * Baja cada hueco con material y mide en UNA llamada a `medir` (E compara cada clip con el local de la misma llamada). Dice de cada
 * hueco PASA o NO con sus motivos; `excepciones` (ruta → motivo: «trabajo real», «es ella»…) llega a `medir` como `excepcion`. Borra
 * lo que bajó. `pasa` sólo con todos en PASA.
 */
export async function aprobarMaterial(
  { config, plantillas = {}, excepciones = {} }: { config: unknown; plantillas?: { a?: unknown; c?: unknown }; excepciones?: Record<string, string> },
  deps: { bajar: Bajar; medir: Medir },
): Promise<Aprobacion> {
  const huecos = huecosDeMaterial(config);
  const deLaPlantilla = tokensDePlantillas(plantillas);
  const motivos = new Map<string, string[]>(huecos.map((h) => [h.ruta, []]));
  const bajados = new Map<string, Buffer>();
  for (const url of new Set(huecos.map((h) => h.url))) {
    const r = await deps.bajar(url);
    if (r.status === 200 && r.bytes) bajados.set(url, r.bytes);
    else for (const h of huecos) if (h.url === url) motivos.get(h.ruta)!.push(`no se puede bajar (${r.status})`);
  }
  for (const h of huecos) {
    const b = bajados.get(h.url);
    const p = b ? deLaPlantilla.get(tokenDe(b)) : undefined;
    if (p) motivos.get(h.ruta)!.push(`material de la plantilla ${p}`);
  }
  const dir = mkdtempSync(join(tmpdir(), "material-"));
  try {
    const files: (ArchivoMedido & { ruta: string })[] = [];
    huecos.forEach((h, i) => {
      const b = bajados.get(h.url);
      if (!h.medida || !b) return;
      const src = join(dir, `${String(i).padStart(2, "0")}${extension(h.url)}`);
      writeFileSync(src, b);
      const excepcion = excepciones[h.ruta] ?? h.medida.excepcion;
      files.push({ ...h.medida, ...(excepcion ? { excepcion } : {}), src, ruta: h.ruta });
    });
    if (files.length) {
      const colores = obj(get(config, "branding.colors"));
      const { rows } = await deps.medir(files.map(({ ruta: _r, ...f }) => f), colores);
      for (const f of files) {
        const r = rows.find((x) => x?.role === f.role);
        motivos.get(f.ruta)!.push(...(r ? motivosDeFila(r) : ["medir no devolvió su fila"]));
      }
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
  const out = huecos.map((h): HuecoMaterial => { const m = motivos.get(h.ruta)!; return { ruta: h.ruta, url: h.url, veredicto: m.length ? "NO" : "PASA", motivos: m }; });
  return { huecos: out, pasa: out.every((h) => h.veredicto === "PASA") };
}

/** Un aviso de la sección «material» por cada hueco que no pasa, con su ruta y su motivo (como `avisosDePreset`). */
export function avisosDeMaterial(r: { huecos: HuecoMaterial[] }): AvisoMaterial[] {
  return (r.huecos ?? []).filter((h) => h.veredicto !== "PASA").map((h) => ({ seccion: "material", message: `${h.ruta}: ${h.motivos.join(" · ")}` }));
}

/**
 * Sin medir ni bajar nada: un aviso «material de la plantilla» por cada hueco del config cuyo token es el de una url de la plantilla A
 * o C (desde-plantilla y la consola de textos los suman a sus avisos: lo copiado es de otra peluquería hasta que se reemplaza).
 */
export function avisosDeMaterialDePlantilla(config: unknown, plantillas: { a?: unknown; c?: unknown }): AvisoMaterial[] {
  const tokens = tokensDePlantillas(plantillas), out: AvisoMaterial[] = [];
  const ver = (v: unknown, ruta: string): void => {
    if (ruta.startsWith("gallery.")) return; // el respaldo sin tipo de la galería (D-49): su aviso es el de la pieza
    if (typeof v === "string") { const p = tokens.get(tokenDeUrl(v) ?? ""); if (p) out.push({ seccion: "material", message: `${ruta}: material de la plantilla ${p} (reemplazalo por el de la clienta, en su paleta: scripts/material.ts)` }); }
    else if (Array.isArray(v)) v.forEach((x, i) => ver(x, ruta ? `${ruta}.${i}` : String(i)));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) ver(x, ruta ? `${ruta}.${k}` : k);
  };
  ver(config, "");
  return out;
}

/** Las plantillas A y C como las lee la consola (config/test-b4-peluqueria-a|c); la que no está queda vacía. */
export async function leerPlantillas(db: DbMinima): Promise<{ a: Obj; c: Obj }> {
  const out = { a: {}, c: {} } as { a: Obj; c: Obj };
  for (const p of ["a", "c"] as const) {
    const s = await db.collection("config").doc(`test-b4-peluqueria-${p}`).get();
    if (s.exists) out[p] = s.data() ?? {};
  }
  return out;
}

/** El `medir` de `<raizT>/tools/gama.mjs` (el hermano T, por su ruta fija): la misma medición que la consola de T. */
export async function medirConGama(raizT: string): Promise<Medir> {
  const mod = (await import(pathToFileURL(join(raizT, "tools", "gama.mjs")).href)) as { medir?: Medir };
  if (typeof mod.medir !== "function") throw new Error(`${raizT}/tools/gama.mjs no exporta medir`);
  return mod.medir;
}

// ─── Subir por consola (D-293) ──────────────────────────────────────────────────────────────────────────────────────────────────
const IMAGEN = "(jpg|jpeg|png|webp|avif)";
/** Cada nombre fijo de las casillas (D-36, D-43, D-50, D-66, más `og` y `retrato-<n>`): su hueco y el rol de su casilla. */
const NOMBRES: { re: RegExp; rol: string; ruta: (n: number) => string; lista?: "servicios" | "galeria" | "equipo" }[] = [
  { re: /^hero\.mp4$/, rol: "hero", ruta: () => "hero.video.mp4" },
  { re: /^hero\.webm$/, rol: "hero", ruta: () => "hero.video.webm" },
  { re: /^hero-1280\.mp4$/, rol: "hero", ruta: () => "hero.video.medium.mp4" },
  { re: /^hero-1280\.webm$/, rol: "hero", ruta: () => "hero.video.medium.webm" },
  { re: /^hero-v\.mp4$/, rol: "hero", ruta: () => "hero.video.portrait.mp4" },
  { re: /^hero-v\.webm$/, rol: "hero", ruta: () => "hero.video.portrait.webm" },
  { re: /^hero-poster\.avif$/, rol: "hero", ruta: () => "hero.video.poster" },
  { re: /^hero-v-poster\.avif$/, rol: "hero", ruta: () => "hero.video.portrait.poster" },
  { re: new RegExp(`^textura\\.${IMAGEN}$`), rol: "branding", ruta: () => "branding.texture" },
  { re: new RegExp(`^local\\.${IMAGEN}$`), rol: "branding", ruta: () => "branding.localPhoto" },
  { re: new RegExp(`^local-v\\.${IMAGEN}$`), rol: "branding", ruta: () => "branding.localPhotoMobile" },
  { re: new RegExp(`^og\\.${IMAGEN}$`), rol: "branding", ruta: () => "brand.ogImage" },
  { re: new RegExp(`^servicio-([1-9]\\d*)\\.${IMAGEN}$`), rol: "services", ruta: (n) => `sections.services.images.${n - 1}`, lista: "servicios" },
  { re: new RegExp(`^galeria-([1-9]\\d*)\\.${IMAGEN}$`), rol: "gallery", ruta: (n) => `sections.gallery.items.${n - 1}.src`, lista: "galeria" },
  { re: new RegExp(`^retrato-([1-9]\\d*)\\.${IMAGEN}$`), rol: "staff", ruta: (n) => `staff.${n - 1}.photoUrl`, lista: "equipo" },
];

/** El hueco de un nombre fijo en un config, o lanza: un nombre que no es de ninguna casilla, o una persona, pieza o servicio de más. */
export function huecoDeNombre(nombre: string, config: unknown): { ruta: string; rol: string; n: number } {
  const c = obj(config);
  for (const x of NOMBRES) {
    const m = x.re.exec(nombre);
    if (!m) continue;
    const n = m[1] ? Number(m[1]) : 0;
    const cuantos = x.lista === "servicios" ? lista(c.services).length : x.lista === "galeria" ? lista(c.sections?.gallery?.items).length : x.lista === "equipo" ? lista(c.staff).length : Infinity;
    if (n > cuantos) throw new Error(`«${nombre}»: el hueco ${x.ruta(n)} no existe (hay ${cuantos} ${x.lista === "servicios" ? "servicios" : x.lista === "galeria" ? "piezas en la galería" : "personas en el equipo"}); no se subió ni se escribió nada`);
    return { ruta: x.ruta(n), rol: x.rol, n };
  }
  throw new Error(`«${nombre}» no es el nombre fijo de ninguna casilla (hero.mp4, hero-v.webm, textura.jpg, local.jpg, local-v.jpg, og.jpg, servicio-<n>, galeria-<n>, retrato-<n>…); no se subió ni se escribió nada`);
}

function poner(o: Obj, ruta: string, v: unknown): void {
  const ks = ruta.split(".");
  let a: any = o;
  for (let i = 0; i < ks.length - 1; i++) {
    const k = ks[i], sig = ks[i + 1];
    if (a[k] == null || typeof a[k] !== "object") a[k] = /^\d+$/.test(sig) ? [] : {};
    a = a[k];
  }
  a[ks[ks.length - 1]] = v;
}

/**
 * Cada archivo `{ nombre, bytes }` a su hueco por su nombre fijo, subido por `subirMaterial` con el rol de su casilla y ese nombre (la
 * misma url que daría la casilla) y guardado por `guardarConfig`. `galeria-<n>` lleva también `gallery[n−1]` (D-49) y las fotos de
 * Instagram que la seguían (D-291). En seco no sube ni escribe y dice qué haría. Un nombre que no es de ninguna casilla o un hueco que
 * no existe se rechaza ANTES de subir nada.
 */
export async function subirCarpeta(
  { clientId, archivos, aplicar = false }: { clientId: string; archivos: { nombre: string; bytes: Buffer }[]; aplicar?: boolean },
  deps: { db: DbMinima; bucket: BucketMinimo },
): Promise<{ huecos: { nombre: string; ruta: string; url?: string }[]; escrito: boolean }> {
  const snap = await deps.db.collection("config").doc(clientId).get();
  if (!snap.exists) throw new Error(`«${clientId}» no existe (no hay config/${clientId}); no se subió ni se escribió nada`);
  let config: Obj = structuredClone(snap.data() ?? {});
  const plan = archivos.map((a) => {
    const h = huecoDeNombre(a.nombre, config);
    const contentType = resolveContentType(a.nombre, "");
    if (!contentType) throw new Error(`«${a.nombre}»: tipo desconocido; no se subió ni se escribió nada`);
    return { ...a, ...h, contentType };
  });
  const repetidos = plan.map((p) => p.ruta).filter((r, i, xs) => xs.indexOf(r) !== i);
  if (repetidos.length) throw new Error(`dos archivos van al mismo hueco (${repetidos.join(", ")}); no se subió ni se escribió nada`);
  if (!aplicar) return { huecos: plan.map((p) => ({ nombre: p.nombre, ruta: p.ruta })), escrito: false };

  const huecos: { nombre: string; ruta: string; url: string }[] = [];
  for (const p of plan) {
    const { url } = await subirMaterial({ clientId, rol: p.rol, nombre: p.nombre, buffer: p.bytes, contentType: p.contentType }, { bucket: deps.bucket });
    const anterior = get(config, p.ruta);
    poner(config, p.ruta, url);
    if (p.rol === "gallery") {
      const respaldo = Array.isArray(config.gallery) ? [...config.gallery] : [];
      while (respaldo.length < p.n - 1) respaldo.push("");
      respaldo[p.n - 1] = url;
      config.gallery = respaldo;
      config = instagramSigueA(config, anterior, url);
    }
    huecos.push({ nombre: p.nombre, ruta: p.ruta, url });
  }
  const r = await guardarConfig(clientId, config, { db: deps.db, quien: "consola material" });
  if (!r.ok) throw new Error(`el guardado dio ${r.status} (${r.error}): ${r.issues.map((e) => `${e.path}: ${e.message}`).join(" | ")}. El material quedó en clients/${clientId}/media/ (idempotente); el config no cambió`);
  return { huecos, escrito: true };
}
