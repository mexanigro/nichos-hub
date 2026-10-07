/**
 * PLANTILLA-01 (D-257, inciso y) · los textos de una web por consola, sin API: los escribe Claude Code a partir de `exportar` y se
 * guardan con `aplicar`, con los mismos validadores y el mismo guardado que la ficha.
 * Las piezas son las de `escribirTextos` (textos-claude.ts), no una segunda versión: `camposDeTexto` con sus límites, `sistema`, la
 * `descripcion` de cada campo y `datosParaEscribir`. `aplicar` acepta toda la propuesta y la pasa por `validarPropuesta` y
 * `cuerpoDePropuesta` con las notas (D-258); escribe sólo con `aplicar`, por `guardarConfig` (la lógica del PUT, D-255).
 * Las dos devuelven `avisos` (inciso z, `avisosDePreset`): equipo o reseñas del preset; y, desde MARCA-01 (D-289), un aviso «material
 * de la plantilla» por cada hueco con el token de una url de la plantilla A o C.
 * MARCA-01 (D-290, D-298, Liam: «Marcar, no vaciar»): los alt de la galería llegan llenos con la descripción de las fotos de la plantilla
 * y `camposDeTexto` nunca los lista (en el idioma base nunca; en los otros sólo vacíos). La consola lista, en cada idioma, cada alt
 * IGUAL al de esa pieza en la plantilla A o C, con la url de su foto (Claude Code la mira), y `aplicar` acepta reescribir sólo esos
 * (`reescribir`). Un alt que ya no es el de la plantilla sigue protegido. El camino de la API no cambia.
 */
import { camposDeTexto, cuerpoDePropuesta, datosParaEscribir, descartadosDePropuesta, descripcion, sistema, validarPropuesta, type Campo, type Propuesta, type Reescribibles } from "./textos-claude.ts";
import { avisosDeMaterialDePlantilla, leerPlantillas } from "./material-cliente.ts";
import { guardarConfig, type DbMinima } from "./guardar-config.ts";
import { buscarClienteHub, type ColeccionMinima } from "./hub-clients.ts";
import { isValidClientLanguage } from "./client-language.ts";
import { avisosDePreset, type AvisoPreset } from "./avisos-preset.ts";
import type { ConfigIssue } from "./config-validator.ts";

type Obj = Record<string, any>;
const IDIOMAS = ["he", "en", "ru", "ar"];

/** El config del cliente, su nicho (`business.type`) y su idioma base (el de la ficha; si no, el del config, como la ruta). */
async function leerCliente(clientId: string, db: DbMinima) {
  const snap = await db.collection("config").doc(clientId).get();
  if (!snap.exists) throw new Error(`«${clientId}» no existe (no hay config/${clientId})`);
  const config: Obj = snap.data() ?? {};
  const hub = await buscarClienteHub(clientId, { coleccion: db.collection("hub_clients") as unknown as ColeccionMinima });
  const niche = typeof config.business?.type === "string" ? config.business.type : String(hub?.data?.niche ?? "");
  const base = isValidClientLanguage(hub?.data?.language) ? String(hub!.data.language) : isValidClientLanguage(config.language) ? String(config.language) : "he";
  return { config, niche, base };
}

const objeto = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const piezas = (c: unknown): Obj[] => (Array.isArray(objeto(objeto(objeto(c).sections).gallery).items) ? objeto(objeto(objeto(c).sections).gallery).items.filter((x: unknown) => x && typeof x === "object") : []);
/** El alt de la pieza `id` en `idioma`: en el idioma base, el de la pieza; en otro, el de `translations.<l>.sections.gallery.alts`. */
function altDe(c: unknown, idioma: string, base: string, id: string): unknown {
  return idioma === base ? piezas(c).find((x) => x.id === id)?.alt : objeto(objeto(objeto(objeto(objeto(c).translations)[idioma]).sections).gallery).alts?.[id];
}
/** MARCA-01 (D-298): por idioma, cada alt de la galería igual al de esa pieza en la plantilla A o C (las plantillas están en hebreo). */
export function altsDeLaPlantilla(config: unknown, plantillas: { a?: unknown; c?: unknown }, base: string): Reescribibles {
  const out: Reescribibles = {};
  for (const l of IDIOMAS) for (const g of piezas(config)) {
    if (typeof g.id !== "string") continue;
    const actual = altDe(config, l, base, g.id);
    if (typeof actual !== "string" || !actual.trim()) continue;
    if ([plantillas.a, plantillas.c].some((p) => p && altDe(p, l, "he", g.id) === actual)) (out[l] ??= []).push({ ruta: `sections.gallery.alts.${g.id}` });
  }
  return out;
}
/** La descripción de un campo para quien escribe; la de un alt que sigue siendo el de la plantilla trae la url de su foto (Claude Code la mira). */
function descripcionConFoto(config: unknown, c: Campo, deLaPlantilla: boolean): string {
  // Un alt vacío conserva la descripción del esquema (la misma que escribirTextos, PLANTILLA-01 B1); el de la plantilla suma la foto.
  if (!deLaPlantilla || !c.ruta.startsWith("sections.gallery.alts.")) return descripcion(c);
  const src = piezas(config).find((x) => x.id === c.ruta.slice("sections.gallery.alts.".length))?.src;
  return `${descripcion(c)} · es todavía el de la plantilla: reescribilo mirando la foto de la clienta${typeof src === "string" && src ? ` · foto: ${src}` : ""}`;
}

export type Exportado = {
  clientId: string; niche: string; base: string; variantes: Record<string, unknown>; datos: Obj;
  idiomas: Record<string, { sistema: string; campos: (Campo & { descripcion: string })[] }>; avisos: AvisoPreset[];
};

/** Lo que necesita quien escribe los textos: por idioma con algo que escribir, cada campo vacío con sus límites y su descripción, el
 *  `system` que usaría `escribirTextos`, y los datos de la clienta (su web en el idioma base, sin urls, y sus notas). No escribe nada. */
export async function exportarTextos({ clientId, notas }: { clientId: string; notas?: string }, deps: { db: DbMinima }): Promise<Exportado> {
  const { config, niche, base } = await leerCliente(clientId, deps.db);
  const plantillas = await leerPlantillas(deps.db);
  const reescribir = altsDeLaPlantilla(config, plantillas, base);
  const idiomas: Exportado["idiomas"] = {};
  for (const l of [base, ...IDIOMAS.filter((x) => x !== base)]) {
    const vacios = camposDeTexto(config, niche, l, base), extra = (reescribir[l] ?? []).filter((x) => !vacios.some((v) => v.ruta === x.ruta));
    const campos = [...vacios.map((c) => ({ c, plantilla: false })), ...extra.map((c) => ({ c, plantilla: true }))];
    if (campos.length) idiomas[l] = { sistema: sistema(l, niche), campos: campos.map(({ c, plantilla }) => ({ ...c, descripcion: descripcionConFoto(config, c, plantilla) })) };
  }
  const variantes: Record<string, unknown> = { hero: config.hero?.variant, navbar: config.navbar?.variant, footer: config.footer?.variant };
  for (const [s, v] of Object.entries((config.sections ?? {}) as Obj)) if (v && typeof v === "object" && "variant" in v) variantes[s] = v.variant;
  return { clientId, niche, base, variantes, datos: datosParaEscribir(config, base, notas), idiomas, avisos: [...avisosDePreset(config, niche), ...avisosDeMaterialDePlantilla(config, plantillas)] };
}

export type Aplicado = { entran: string[]; errores: ConfigIssue[]; cuerpo: Obj; escrito: boolean; avisos: AvisoPreset[] };

/** Toda la propuesta, aceptada: dice campo por campo qué entra y qué no (con su motivo) y, con `aplicar`, guarda lo que entra. */
export async function aplicarTextos(
  { clientId, propuesta, notas, aplicar = false }: { clientId: string; propuesta: Propuesta; notas?: string; aplicar?: boolean },
  deps: { db: DbMinima },
): Promise<Aplicado> {
  const { config, niche, base } = await leerCliente(clientId, deps.db);
  const plantillas = await leerPlantillas(deps.db);
  const reescribir = altsDeLaPlantilla(config, plantillas, base);
  const aceptados = Object.entries(propuesta ?? {}).flatMap(([l, t]) => Object.keys(t && typeof t === "object" ? t : {}).map((r) => `${l}:${r}`));
  const errores = validarPropuesta(config, niche, base, propuesta, notas, reescribir).filter((e) => e.severity === "error");
  const descartados = descartadosDePropuesta(config, niche, base, propuesta, aceptados, notas, reescribir);
  const fuera = new Set(descartados.map((d) => d.path));
  for (const d of descartados) if (!errores.some((e) => e.path === d.path)) errores.push(d);
  const cuerpo = cuerpoDePropuesta(config, niche, base, propuesta, aceptados, notas, reescribir);
  const avisos = [...avisosDePreset(config, niche), ...avisosDeMaterialDePlantilla(config, plantillas)];
  let escrito = false;
  if (aplicar && Object.keys(cuerpo).length) {
    const r = await guardarConfig(clientId, cuerpo, { db: deps.db, quien: "consola textos" });
    if (!r.ok) throw new Error(`el guardado dio ${r.status} (${r.error}): ${r.issues.map((e) => `${e.path}: ${e.message}`).join(" | ")}; no se escribió nada`);
    escrito = true;
  }
  return { entran: aceptados.filter((a) => !fuera.has(a)), errores, cuerpo, escrito, avisos };
}
