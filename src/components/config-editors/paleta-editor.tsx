"use client";

import { useState } from "react";
import { derivePalette, type PaletteMode, type PaletteOrigin } from "../../lib/palette.ts";

/**
 * CONEXION-06 (D-69..D-71): la casilla de la paleta de peluquería, el primer hueco de toda web (CH:11). Lo que se le pide al usuario
 * es la ENTRADA —color fuente, de dónde sale (`origin`) y el porqué (`reason`)— y `branding.colors` + `branding.paletteMeta` salen
 * siempre de `derivePalette`, **nunca a mano**: los diez roles y los trece tokens shadcn son un derivado con pares WCAG medidos, y
 * `validatePalette` (config-validator.ts) rechaza cualquier config cuyos colores no coincidan con lo que la función daría.
 * El modo (claro/oscuro) NO se pide aquí: es de la casilla de fondo (`branding.mode`, CONEXION-05) y esta casilla lo muestra para
 * que se vea qué escala se va a usar. `derivePalette` vive en `src/lib/palette.ts`, copia byte a byte de la de T (D-69, con el guard
 * `tests/paleta-paridad.test.ts`): H se despliega solo y no puede importar de T.
 * Sólo se muestra con `niche === "peluqueria"` (patrón D-35/D-46/D-47/D-67); la flota sigue con `theme.*` y `global-style-editor`.
 * Sin `next/*` ni alias `@/`: los tests la cargan con node + typescript.transpileModule (tests/orden/conexion-06).
 */

type Cfg = Record<string, unknown>;
type SetConfig = (updater: (prev: ConfigPaleta) => ConfigPaleta) => void;

export type ConfigPaleta = { branding?: Record<string, unknown> };
/** Lo único que el usuario elige: el resto es derivado. */
export type EntradaPaleta = { source: string; origin: string; reason: string };

/** Los cinco `PaletteOrigin` del contrato (T src/lib/palette.ts:19). */
export const ORIGENES_PALETA: readonly PaletteOrigin[] = ["logo", "local", "instagram", "eleccion", "material"];
/** D-70: la paleta de esta casilla es la de peluquería (la correspondencia de tokens es la de su `index.css`). */
export const NICHO_PALETA = "peluqueria";
/** Sin `branding.mode` el modo es light (respaldo, nunca por nicho: D17/R8). */
export const MODO_POR_DEFECTO: PaletteMode = "light";

const ETIQUETAS_ORIGEN: Record<PaletteOrigin, string> = {
  logo: "logo del cliente",
  local: "foto del local",
  instagram: "feed de Instagram",
  eleccion: "elección con lógica (§ 5.1)",
  material: "media del material (gama.mjs)",
};
/** Los roles que se muestran como muestra de lo que hay escrito hoy (los otros dieciséis salen de estos). */
const MUESTRA = ["surface", "surfaceAlt", "text", "accent", "accentStrong", "highlight", "scrim"] as const;

/** El modo con el que se va a derivar: el de `branding.mode` (casilla de fondo) o light. */
export function modoDe(config: unknown): PaletteMode {
  const branding = (config && typeof config === "object" ? (config as Cfg).branding : undefined) as Cfg | undefined;
  return branding?.mode === "dark" ? "dark" : MODO_POR_DEFECTO;
}

/**
 * Config nuevo con `branding.colors` y `branding.paletteMeta` derivados de la entrada; no muta el config que recibe y no toca
 * ninguna otra clave (ni `branding.mode`, ni la textura, ni `heroToBackdrop`, ni `hero`, ni `sections`). Si `derivePalette` se
 * niega (fuente sin croma, porqué de menos de tres palabras) lanza su mismo error y no devuelve config.
 */
export function aplicarPaleta(config: unknown, entrada: EntradaPaleta): Cfg {
  const { colors, meta } = derivePalette({
    source: entrada.source,
    origin: entrada.origin as PaletteOrigin,
    reason: entrada.reason,
    niche: NICHO_PALETA,
    mode: modoDe(config),
  });
  const next: Cfg = { ...((config ?? {}) as Cfg) };
  const branding: Cfg = { ...((next.branding as Cfg | undefined) ?? {}) };
  branding.colors = colors;
  branding.paletteMeta = meta;
  next.branding = branding;
  return next;
}

export function PaletaEditor({
  niche,
  config,
  setConfig,
}: {
  niche: string;
  config: ConfigPaleta;
  setConfig: SetConfig;
  clientId?: string;
}) {
  const branding = (config.branding ?? {}) as Cfg;
  const meta = (branding.paletteMeta ?? {}) as Cfg;
  const [source, setSource] = useState(typeof meta.source === "string" ? meta.source : "");
  const [origin, setOrigin] = useState(typeof meta.origin === "string" ? meta.origin : "eleccion");
  const [reason, setReason] = useState(typeof meta.reason === "string" ? meta.reason : "");
  const [error, setError] = useState("");

  // D-70: la casilla es de peluquería; la flota sigue con `theme.*` (global-style-editor).
  if (niche !== NICHO_PALETA) return null;

  const modo = modoDe(config);
  const colores = (branding.colors ?? {}) as Record<string, string>;

  function derivar() {
    setError("");
    try {
      const entrada: EntradaPaleta = { source: source.trim(), origin, reason };
      setConfig((prev) => aplicarPaleta(prev, entrada) as ConfigPaleta);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-text-muted">
        Paleta de peluquería: <code className="font-mono">branding.colors</code> y <code className="font-mono">branding.paletteMeta</code>{" "}
        los escribe <code className="font-mono">derivePalette</code> desde el color fuente, nunca a mano. El modo sale de la casilla de
        fondo.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1 rounded-lg border border-border bg-bg-card px-3 py-2">
          <label className="text-[11px] font-semibold text-text-secondary" htmlFor="paleta-source">
            Color fuente (<code className="font-mono">source</code>)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="paleta-source"
              data-campo="source"
              type="text"
              value={source}
              placeholder="#5d7a57"
              onChange={(e) => setSource(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-bg-elevated px-2 py-1 font-mono text-[11px] text-text focus:border-accent focus:outline-none"
            />
            <span className="h-5 w-5 shrink-0 rounded border border-border" style={{ background: source || "transparent" }} />
          </div>
          <p className="text-[10px] text-text-muted/70">Sin croma (negro, blanco, gris) la función se niega: se elige con lógica.</p>
        </div>

        <div className="space-y-1 rounded-lg border border-border bg-bg-card px-3 py-2">
          <label className="text-[11px] font-semibold text-text-secondary" htmlFor="paleta-origin">
            De dónde sale (<code className="font-mono">origin</code>)
          </label>
          <select
            id="paleta-origin"
            data-campo="origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full rounded border border-border bg-bg-elevated px-2 py-1 text-xs text-text focus:border-accent focus:outline-none"
          >
            {ORIGENES_PALETA.map((v) => (
              <option key={v} value={v}>
                {v} — {ETIQUETAS_ORIGEN[v]}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-text-muted/70">
            Modo que va a tomar de <code className="font-mono">branding.mode</code>: <span className="font-mono">{modo}</span>
          </p>
        </div>
      </div>

      <div className="space-y-1 rounded-lg border border-border bg-bg-card px-3 py-2">
        <label className="text-[11px] font-semibold text-text-secondary" htmlFor="paleta-reason">
          El porqué (<code className="font-mono">reason</code>, obligatorio)
        </label>
        <textarea
          id="paleta-reason"
          data-campo="reason"
          rows={3}
          value={reason}
          placeholder="Por qué este color y no otro: viaja con la paleta."
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-md border border-border bg-bg-elevated px-2 py-1 text-[11px] text-text focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={derivar}
          className="rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-xs text-text transition-colors hover:border-accent hover:text-accent"
        >
          Derivar
        </button>
        <span className="text-[10px] text-text-muted/70">
          Reescribe <code className="font-mono">colors</code> y <code className="font-mono">paletteMeta</code> enteros.
        </span>
      </div>

      <div className="space-y-1 rounded-lg border border-border bg-bg-card px-3 py-2">
        <p className="text-[11px] font-semibold text-text-secondary">
          Colores actuales (<code className="font-mono">branding.colors</code>)
        </p>
        {Object.keys(colores).length ? (
          <dl className="grid grid-cols-2 gap-1 sm:grid-cols-4">
            {MUESTRA.filter((rol) => typeof colores[rol] === "string").map((rol) => (
              <div key={rol} className="flex items-center gap-1.5">
                <span className="h-4 w-4 shrink-0 rounded border border-border" style={{ background: colores[rol] }} />
                <div className="min-w-0">
                  <dt className="truncate text-[10px] text-text-muted/70">{rol}</dt>
                  <dd className="font-mono text-[10px] text-text">{colores[rol]}</dd>
                </div>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-[10px] text-text-muted">Sin paleta derivada todavia.</p>
        )}
      </div>

      {error && <p className="text-[10px] text-danger">{error}</p>}
    </div>
  );
}
