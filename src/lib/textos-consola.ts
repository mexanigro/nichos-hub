/**
 * PLANTILLA-01 (D-257, inciso y) · los textos de una web por consola, sin API: los escribe Claude Code a partir de `exportar` y se
 * guardan con `aplicar`, con los mismos validadores y el mismo guardado que la ficha.
 * Las piezas son las de `escribirTextos` (textos-claude.ts), no una segunda versión: `camposDeTexto` con sus límites, `sistema`, la
 * `descripcion` de cada campo y `datosParaEscribir`. `aplicar` acepta toda la propuesta y la pasa por `validarPropuesta` y
 * `cuerpoDePropuesta` con las notas (D-258); escribe sólo con `aplicar`, por `guardarConfig` (la lógica del PUT, D-255).
 * Las dos devuelven `avisos` (inciso z, `avisosDePreset`): equipo o reseñas del preset.
 */
import { camposDeTexto, cuerpoDePropuesta, datosParaEscribir, descartadosDePropuesta, descripcion, sistema, validarPropuesta, type Campo, type Propuesta } from "./textos-claude.ts";
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

export type Exportado = {
  clientId: string; niche: string; base: string; variantes: Record<string, unknown>; datos: Obj;
  idiomas: Record<string, { sistema: string; campos: (Campo & { descripcion: string })[] }>; avisos: AvisoPreset[];
};

/** Lo que necesita quien escribe los textos: por idioma con algo que escribir, cada campo vacío con sus límites y su descripción, el
 *  `system` que usaría `escribirTextos`, y los datos de la clienta (su web en el idioma base, sin urls, y sus notas). No escribe nada. */
export async function exportarTextos({ clientId, notas }: { clientId: string; notas?: string }, deps: { db: DbMinima }): Promise<Exportado> {
  const { config, niche, base } = await leerCliente(clientId, deps.db);
  const idiomas: Exportado["idiomas"] = {};
  for (const l of [base, ...IDIOMAS.filter((x) => x !== base)]) {
    const campos = camposDeTexto(config, niche, l, base);
    if (campos.length) idiomas[l] = { sistema: sistema(l, niche), campos: campos.map((c) => ({ ...c, descripcion: descripcion(c) })) };
  }
  const variantes: Record<string, unknown> = { hero: config.hero?.variant, navbar: config.navbar?.variant, footer: config.footer?.variant };
  for (const [s, v] of Object.entries((config.sections ?? {}) as Obj)) if (v && typeof v === "object" && "variant" in v) variantes[s] = v.variant;
  return { clientId, niche, base, variantes, datos: datosParaEscribir(config, base, notas), idiomas, avisos: avisosDePreset(config, niche) };
}

export type Aplicado = { entran: string[]; errores: ConfigIssue[]; cuerpo: Obj; escrito: boolean; avisos: AvisoPreset[] };

/** Toda la propuesta, aceptada: dice campo por campo qué entra y qué no (con su motivo) y, con `aplicar`, guarda lo que entra. */
export async function aplicarTextos(
  { clientId, propuesta, notas, aplicar = false }: { clientId: string; propuesta: Propuesta; notas?: string; aplicar?: boolean },
  deps: { db: DbMinima },
): Promise<Aplicado> {
  const { config, niche, base } = await leerCliente(clientId, deps.db);
  const aceptados = Object.entries(propuesta ?? {}).flatMap(([l, t]) => Object.keys(t && typeof t === "object" ? t : {}).map((r) => `${l}:${r}`));
  const errores = validarPropuesta(config, niche, base, propuesta, notas).filter((e) => e.severity === "error");
  const descartados = descartadosDePropuesta(config, niche, base, propuesta, aceptados, notas);
  const fuera = new Set(descartados.map((d) => d.path));
  for (const d of descartados) if (!errores.some((e) => e.path === d.path)) errores.push(d);
  const cuerpo = cuerpoDePropuesta(config, niche, base, propuesta, aceptados, notas);
  const avisos = avisosDePreset(config, niche);
  let escrito = false;
  if (aplicar && Object.keys(cuerpo).length) {
    const r = await guardarConfig(clientId, cuerpo, { db: deps.db, quien: "consola textos" });
    if (!r.ok) throw new Error(`el guardado dio ${r.status} (${r.error}): ${r.issues.map((e) => `${e.path}: ${e.message}`).join(" | ")}; no se escribió nada`);
    escrito = true;
  }
  return { entran: aceptados.filter((a) => !fuera.has(a)), errores, cuerpo, escrito, avisos };
}
