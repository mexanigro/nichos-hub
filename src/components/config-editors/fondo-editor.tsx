"use client";

import { useState } from "react";

/**
 * CONEXION-05 (D-67): la casilla de fondo y branding de peluquería. Cuatro huecos que tenían contrato, validador, material y guard
 * pero no casilla: `branding.mode` (el modo de la paleta, D-65), `branding.texture`, `branding.localPhoto` y
 * `branding.localPhotoMobile`. Las funciones que escriben son puras —devuelven un config nuevo sin tocar ninguna otra clave— para
 * que lo que la casilla escribe sea comparable con lo que el tenant tiene (A4). `branding.heroToBackdrop` se muestra pero NO se
 * edita: es un derivado que calcula `T tools/material/transicion.mjs` desde el vídeo del hero y la foto del local (D-64). Cada foto
 * sube por `/api/upload/${clientId}` con rol `branding` y el nombre fijo del contrato (D-66), así que la url que vuelve es, byte a
 * byte, la que `scripts/b4-material.ts` produce para el mismo archivo (`subirMaterial` es idempotente por contenido). Sólo se
 * muestra con `niche === "peluqueria"` (D-67, patrón D-35/D-46/D-47).
 * Sin `next/*` ni alias `@/`: los tests la cargan con node + typescript.transpileModule (tests/orden/conexion-05).
 */

type Cfg = Record<string, unknown>;
type SetConfig = (updater: (prev: ConfigFondo) => ConfigFondo) => void;

export type ConfigFondo = { branding?: Record<string, unknown> };

/** Los tres campos de foto del fondo (el modo es el cuarto campo de la casilla, y no es una foto). */
export const CAMPOS_FONDO = ["texture", "localPhoto", "localPhotoMobile"] as const;
export type CampoFondo = (typeof CAMPOS_FONDO)[number];
/** El contrato de `branding.mode` es un enum de dos valores (D17: el modo es de la paleta, por web). */
export const MODOS_FONDO = ["light", "dark"] as const;

/** D-66: nombre fijo del material de fondo por campo, rol `branding` — misma entrada, misma url que `b4-material.ts`. */
const BASE: Record<string, string> = { texture: "textura", localPhoto: "local", localPhotoMobile: "local-v" };
/** D-66: extensiones del nombre fijo (`.JPG` y `.jpeg` normalizan a `jpg`). */
const EXTENSIONES: Record<string, string> = { jpg: "jpg", jpeg: "jpg", png: "png", webp: "webp", avif: "avif" };
/** Tipos que `/api/upload/[clientId]` acepta para una foto de fondo, con la extensión que les corresponde. */
const TIPOS_FOTO: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
export const ROL_FONDO = "branding";

const ETIQUETAS: Record<string, { titulo: string; hint: string }> = {
  texture: { titulo: "Textura", hint: "mosaico 1024 sin costuras o imagen 2560" },
  localPhoto: { titulo: "Foto del local", hint: "escritorio · ≥ 2560" },
  localPhotoMobile: { titulo: "Foto del local vertical", hint: "móvil · ≥ 1080×1920" },
};

/** D-66: nombre fijo de la foto de `campo` (`textura.<ext>` | `local.<ext>` | `local-v.<ext>`). */
export function nombreFondo(campo: string, nombreArchivo: string): string {
  const base = BASE[campo];
  if (!base) throw new Error(`campo de fondo desconocido: ${campo}`);
  const ext = EXTENSIONES[(nombreArchivo.split(".").pop() ?? "").toLowerCase()];
  if (!ext) throw new Error(`${campo}: extensión de «${nombreArchivo}» no admitida (${Object.keys(EXTENSIONES).join(", ")})`);
  return `${base}.${ext}`;
}

/** FormData para `/api/upload/${clientId}`: `rol` = branding y `file` renombrado a `nombreFondo(campo, …)`. Lanza si el tipo no sirve. */
export function formularioFondo(archivo: File, campo: string): FormData {
  const ext = TIPOS_FOTO[archivo.type];
  if (!ext) throw new Error(`${campo}: tipo ${archivo.type || "vacío"} no admitido (${Object.keys(TIPOS_FOTO).join(", ")})`);
  // El nombre lo fija la extensión del archivo; si no trae una de D-66, la del tipo (el contenido manda sobre el nombre).
  const nombre = nombreFondo(campo, EXTENSIONES[(archivo.name.split(".").pop() ?? "").toLowerCase()] ? archivo.name : `x.${ext}`);
  const fd = new FormData();
  fd.append("rol", ROL_FONDO);
  fd.append("file", new File([archivo], nombre, { type: archivo.type }));
  return fd;
}

/** Config nuevo con `branding` reemplazado por una copia que `fn` retoca; no muta la entrada ni toca otra clave. */
function conBranding(config: unknown, fn: (branding: Cfg) => void): Cfg {
  const next: Cfg = { ...((config ?? {}) as Cfg) };
  const branding: Cfg = { ...((next.branding as Cfg | undefined) ?? {}) };
  fn(branding);
  next.branding = branding;
  return next;
}

/** Config nuevo con sólo `branding.mode` cambiado («light» | «dark»; el valor vacío borra la clave y vuelve al modo del nicho). */
export function aplicarModo(config: unknown, valor: string): Cfg {
  return conBranding(config, (branding) => {
    if (valor) branding.mode = valor;
    else delete branding.mode;
  });
}

/** Config nuevo con sólo `branding.<campo>` cambiado (url vacía borra la clave); `heroToBackdrop` queda intacto (D-64). */
export function aplicarFondo(config: unknown, campo: string, url: string): Cfg {
  if (!BASE[campo]) throw new Error(`campo de fondo desconocido: ${campo}`);
  return conBranding(config, (branding) => {
    if (url) branding[campo] = url;
    else delete branding[campo];
  });
}

export function FondoEditor({
  niche,
  config,
  setConfig,
  clientId,
}: {
  niche: string;
  config: ConfigFondo;
  setConfig: SetConfig;
  clientId: string;
}) {
  const [subiendo, setSubiendo] = useState<CampoFondo | null>(null);
  const [error, setError] = useState("");

  // D-67: la casilla es de peluquería; la flota sigue con `global-style-editor`.
  if (niche !== "peluqueria") return null;

  const branding = (config.branding ?? {}) as Cfg;
  const modo = typeof branding.mode === "string" ? branding.mode : "";
  const rel = (branding.heroToBackdrop ?? null) as Cfg | null;
  const pie = (rel?.foot ?? null) as Cfg | null;
  /** Aplica una de las funciones puras sobre el config vigente (no sobre la copia que este render capturó). */
  const escribir = (fn: (prev: Cfg) => Cfg) => setConfig((prev) => fn(prev as Cfg) as ConfigFondo);

  /** Sube la foto de `campo` con el nombre fijo del contrato y deja su url en `branding.<campo>`. */
  async function subir(campo: CampoFondo, archivo: File) {
    setError("");
    let fd: FormData;
    try {
      fd = formularioFondo(archivo, campo);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }
    setSubiendo(campo);
    try {
      const res = await fetch(`/api/upload/${clientId}`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.urls?.[0]) setError(data.error || `${campo}: error al subir`);
      else escribir((prev) => aplicarFondo(prev, campo, data.urls[0]));
    } catch {
      setError(`${campo}: error de red al subir`);
    } finally {
      setSubiendo(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-text-muted">
        Fondo de peluquería: el modo de la paleta (<code className="font-mono">branding.mode</code>), la textura y la foto del local.
        Cada foto sube a Storage con su nombre fijo y la url queda en el config al guardar.
      </p>

      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-card px-3 py-2">
        <label className="text-[11px] text-text-secondary" htmlFor="fondo-mode">
          Modo de la paleta (<code className="font-mono">mode</code>)
        </label>
        <select
          id="fondo-mode"
          data-campo="mode"
          value={modo}
          onChange={(e) => escribir((prev) => aplicarModo(prev, e.target.value))}
          className="rounded border border-border bg-bg-elevated px-2 py-1 text-xs text-text focus:border-accent focus:outline-none"
        >
          <option value="">(segun el nicho)</option>
          {MODOS_FONDO.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {CAMPOS_FONDO.map((campo) => {
        const url = typeof branding[campo] === "string" ? (branding[campo] as string) : "";
        return (
          <div key={campo} className="space-y-1 rounded-lg border border-border bg-bg-card px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <label className="text-[11px] font-semibold text-text-secondary" htmlFor={`fondo-${campo}`}>
                {ETIQUETAS[campo].titulo} (<code className="font-mono">{campo}</code>)
              </label>
              <span className="text-[10px] text-text-muted/70">
                {ETIQUETAS[campo].hint} · <span className="font-mono">{BASE[campo]}.&lt;ext&gt;</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id={`fondo-${campo}`}
                data-campo={campo}
                type="text"
                value={url}
                placeholder="https://firebasestorage.googleapis.com/…"
                onChange={(e) => escribir((prev) => aplicarFondo(prev, campo, e.target.value.trim()))}
                className="min-w-0 flex-1 rounded-md border border-border bg-bg-elevated px-2 py-1 font-mono text-[10px] text-text focus:border-accent focus:outline-none"
              />
              <input
                type="file"
                accept={Object.keys(TIPOS_FOTO).join(",")}
                disabled={subiendo !== null}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void subir(campo, f);
                  e.target.value = "";
                }}
                className="w-32 text-[10px] text-text-muted file:mr-1 file:rounded file:border-0 file:bg-bg-elevated file:px-2 file:py-0.5 file:text-[10px] file:text-text"
              />
              {subiendo === campo && <span className="text-[10px] text-text-muted">subiendo…</span>}
            </div>
          </div>
        );
      })}

      {/* D-64: la relación hero → fondo es un derivado de transicion.mjs; la casilla la muestra, no la edita. */}
      <div className="space-y-1 rounded-lg border border-border bg-bg-card px-3 py-2">
        <p className="text-[11px] font-semibold text-text-secondary">
          Transicion hero → fondo (<code className="font-mono">heroToBackdrop</code>)
        </p>
        {rel ? (
          <dl className="grid grid-cols-3 gap-2 text-[10px] text-text-muted">
            <div>
              <dt className="text-text-muted/70">relation</dt>
              <dd className="font-mono text-text">{String(rel.relation ?? "—")}</dd>
            </div>
            <div>
              <dt className="text-text-muted/70">mechanism</dt>
              <dd className="font-mono text-text">{String(rel.mechanism ?? "—")}</dd>
            </div>
            <div>
              <dt className="text-text-muted/70">foot.hex</dt>
              <dd className="font-mono text-text">{String(pie?.hex ?? "—")}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-[10px] text-text-muted">Sin relacion escrita todavia.</p>
        )}
        <p className="text-[10px] text-text-muted/70">
          Solo lectura: se calcula con transicion.mjs (D-64) desde el video del hero y la foto del local.
        </p>
      </div>

      {error && <p className="text-[10px] text-danger">{error}</p>}
    </div>
  );
}
