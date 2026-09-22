"use client";

import { useState } from "react";
import { GALLERY_TYPES } from "@/lib/config-validator";
// Sólo el tipo (se borra al compilar): la casilla lee `id` y `name` del catálogo, pero el `config` que recibe es el de la pestaña.
import type { Service } from "./services-editor";

/**
 * CONEXION-04 (D-47): la casilla de galería de peluquería. Cuatro huecos que tenían contrato, validador, material y guard pero no
 * casilla: `sections.gallery.items[]` (pieza con `id`, `src`, `type`, `alt` y `serviceId`), `items[].alt` en cuatro idiomas (D-52),
 * `sections.gallery.selection` (D-51) y `sections.gallery.surface`. Las cinco funciones que escriben son puras —devuelven un config
 * nuevo sin tocar ninguna otra clave— para que lo que la casilla escribe sea comparable con lo que el tenant tiene (A4). La `src` de
 * una pieza mantiene además el respaldo `gallery[]` de la raíz en la misma posición (D-49), que el validador vigila. Sólo se muestra
 * con `niche === "peluqueria"` (D-47, patrón D-35/D-46); la flota sigue con sus editores de siempre.
 * Sin `next/*`: los tests la cargan con node + typescript.transpileModule (tests/orden/conexion-04).
 */

type Cfg = Record<string, unknown>;
type SetConfig = (updater: (prev: ConfigGaleria) => ConfigGaleria) => void;

export type ConfigGaleria = {
  services?: Service[];
  sections?: Record<string, unknown>;
  gallery?: string[];
  translations?: Record<string, unknown>;
};

/** Campos de `sections.gallery.items[i]` que escribe `aplicarPieza`. */
export type CampoPieza = "id" | "src" | "type" | "alt" | "serviceId";
/** D-52: el alt base (hebreo) vive en la pieza; los otros tres idiomas, en `translations.<lang>.sections.gallery.alts[id]`. */
export const IDIOMAS_ALT = ["en", "ru", "ar"] as const;
/** El contrato de `sections.gallery.surface` es un enum de un valor (CH § gallery): la pared con textura. */
export const SURFACES_GALERIA = ["textura"] as const;
/** D-50: extensiones del nombre fijo `galeria-<i+1>.<ext>` (`.JPG` y `.jpeg` normalizan a `jpg`). */
const EXTENSIONES: Record<string, string> = { jpg: "jpg", jpeg: "jpg", png: "png", webp: "webp", avif: "avif" };
/** Tipos que `/api/upload/[clientId]` acepta para una foto de galería, con la extensión que les corresponde. */
const TIPOS_FOTO: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

/** D-50: nombre fijo de la foto de la pieza `i` — misma entrada, misma url que `b4-material.ts`. */
export function nombreFotoGaleria(i: number, nombreArchivo: string): string {
  const ext = EXTENSIONES[(nombreArchivo.split(".").pop() ?? "").toLowerCase()] ?? "jpg";
  return `galeria-${i + 1}.${ext}`;
}

/** FormData para `/api/upload/${clientId}`: `rol` = gallery y `file` renombrado a `nombreFotoGaleria(i, …)`. Lanza si el tipo no sirve. */
export function formularioFotoGaleria(archivo: File, i: number): FormData {
  const ext = TIPOS_FOTO[archivo.type];
  if (!ext) throw new Error(`foto ${i + 1} de la galería: tipo ${archivo.type || "vacío"} no admitido (${Object.keys(TIPOS_FOTO).join(", ")})`);
  // El nombre lo fija la extensión del archivo; si no trae una de D-50, la del tipo (el contenido manda sobre el nombre).
  const nombre = nombreFotoGaleria(i, EXTENSIONES[(archivo.name.split(".").pop() ?? "").toLowerCase()] ? archivo.name : `x.${ext}`);
  const fd = new FormData();
  fd.append("rol", "gallery");
  fd.append("file", new File([archivo], nombre, { type: archivo.type }));
  return fd;
}

/** Config nuevo con `sections.gallery` reemplazado por `fn(copia)`; no muta la entrada ni toca las otras secciones. */
function conSeccionGaleria(config: unknown, fn: (seccion: Cfg) => Cfg): Cfg {
  const next: Cfg = { ...((config ?? {}) as Cfg) };
  const sections: Cfg = { ...((next.sections as Cfg | undefined) ?? {}) };
  sections.gallery = fn({ ...((sections.gallery as Cfg | undefined) ?? {}) });
  next.sections = sections;
  return next;
}

/** `sections.gallery.items` de un config (lista vacía si no hay). */
function leerPiezas(config: unknown): Cfg[] {
  const seccion = ((config as Cfg | null)?.sections as Cfg | undefined)?.gallery as Cfg | undefined;
  return Array.isArray(seccion?.items) ? (seccion.items as Cfg[]) : [];
}

/** Config nuevo con sólo `sections.gallery.items[i].<campo>` cambiado (vacío borra la clave); `src` reescribe `gallery[i]` (D-49). */
export function aplicarPieza(config: unknown, i: number, campo: CampoPieza, valor: unknown): Cfg {
  const next = conSeccionGaleria(config, (seccion) => {
    const items = Array.isArray(seccion.items) ? (seccion.items as Cfg[]).slice() : [];
    while (items.length < i) items.push({});
    const pieza: Cfg = { ...((items[i] as Cfg | undefined) ?? {}) };
    if (valor === undefined || valor === "") delete pieza[campo];
    else pieza[campo] = valor;
    items[i] = pieza;
    seccion.items = items;
    return seccion;
  });
  if (campo !== "src") return next;
  // D-49: `gallery[]` de la raíz es el respaldo sin tipo y sigue a `items[].src` en la misma posición.
  const respaldo = Array.isArray(next.gallery) ? (next.gallery as unknown[]).slice() : [];
  while (respaldo.length < i) respaldo.push("");
  respaldo[i] = typeof valor === "string" ? valor : "";
  next.gallery = respaldo;
  return next;
}

/** Config nuevo con `translations.<lang>.sections.gallery.alts[id]` = texto (vacío borra la clave); no muta la entrada (D-52). */
export function aplicarAltIdioma(config: unknown, id: string, lang: string, texto: string): Cfg {
  const next: Cfg = { ...((config ?? {}) as Cfg) };
  const translations: Cfg = { ...((next.translations as Cfg | undefined) ?? {}) };
  const capa: Cfg = { ...((translations[lang] as Cfg | undefined) ?? {}) };
  const sections: Cfg = { ...((capa.sections as Cfg | undefined) ?? {}) };
  const gallery: Cfg = { ...((sections.gallery as Cfg | undefined) ?? {}) };
  const alts: Cfg = { ...((gallery.alts as Cfg | undefined) ?? {}) };
  if (texto) alts[id] = texto;
  else delete alts[id];
  gallery.alts = alts;
  sections.gallery = gallery;
  capa.sections = sections;
  translations[lang] = capa;
  next.translations = translations;
  return next;
}

/** Config nuevo con `id` dentro o fuera de `sections.gallery.selection`, SIEMPRE en el orden de `items` (D-51); vacía borra la clave. */
export function aplicarSeleccion(config: unknown, id: string, activo: boolean): Cfg {
  const orden = leerPiezas(config).map((p) => String(p?.id ?? ""));
  return conSeccionGaleria(config, (seccion) => {
    const marcados = new Set(Array.isArray(seccion.selection) ? (seccion.selection as unknown[]).map(String) : []);
    if (activo) marcados.add(id);
    else marcados.delete(id);
    const lista = orden.filter((x) => marcados.has(x));
    if (lista.length > 0) seccion.selection = lista;
    else delete seccion.selection;
    return seccion;
  });
}

/** Config nuevo con `sections.gallery.surface` = valor (vacío borra la clave). */
export function aplicarSurfaceGaleria(config: unknown, valor: string): Cfg {
  return conSeccionGaleria(config, (seccion) => {
    if (valor) seccion.surface = valor;
    else delete seccion.surface;
    return seccion;
  });
}

/** `translations.<lang>.sections.gallery.alts[id]` de un config, como texto. */
function leerAlt(config: unknown, lang: string, id: string): string {
  const v = [lang, "sections", "gallery", "alts", id].reduce<unknown>(
    (a, k) => (a && typeof a === "object" ? (a as Cfg)[k] : undefined),
    (config as Cfg | null)?.translations,
  );
  return typeof v === "string" ? v : "";
}

export function GalleryEditor({
  niche,
  config,
  setConfig,
  clientId,
}: {
  niche: string;
  config: ConfigGaleria;
  setConfig: SetConfig;
  clientId: string;
}) {
  const [abierta, setAbierta] = useState(0);
  const [subiendo, setSubiendo] = useState<number | null>(null);
  const [error, setError] = useState("");

  // D-47: la casilla es de peluquería; la flota no la ve.
  if (niche !== "peluqueria") return null;

  const seccion = ((config.sections as Cfg | undefined)?.gallery ?? {}) as Cfg;
  const items = Array.isArray(seccion.items) ? (seccion.items as Cfg[]) : [];
  const seleccion = Array.isArray(seccion.selection) ? (seccion.selection as unknown[]).map(String) : [];
  const surface = typeof seccion.surface === "string" ? seccion.surface : "";
  const servicios = Array.isArray(config.services) ? config.services : [];
  /** Aplica una de las funciones puras sobre el config vigente (no sobre la copia que este render capturó). */
  const escribir = (fn: (prev: Cfg) => Cfg) => setConfig((prev) => fn(prev as Cfg) as ConfigGaleria);

  /** Sube la foto de la pieza `i` con el nombre fijo del contrato y deja su url en `items[i].src` (y en `gallery[i]`, D-49). */
  async function subirFoto(i: number, archivo: File) {
    setError("");
    let fd: FormData;
    try {
      fd = formularioFotoGaleria(archivo, i);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }
    setSubiendo(i);
    try {
      const res = await fetch(`/api/upload/${clientId}`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.urls?.[0]) setError(data.error || `foto ${i + 1} de la galería: error al subir`);
      else escribir((prev) => aplicarPieza(prev, i, "src", data.urls[0]));
    } catch {
      setError(`foto ${i + 1} de la galería: error de red al subir`);
    } finally {
      setSubiendo(null);
    }
  }

  function agregar() {
    const i = items.length;
    escribir((prev) => aplicarPieza(prev, i, "id", `g-${i + 1}`));
    setAbierta(i);
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-text-muted">
        Galería de peluquería (<code className="font-mono">sections.gallery.items</code>): cada pieza lleva tipo, foto, alt en cuatro
        idiomas y el servicio que abre el lightbox. La foto sube a Storage con su nombre fijo y su url queda también en{" "}
        <code className="font-mono">gallery[]</code> (respaldo).
      </p>

      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-card px-3 py-2">
        <label className="text-[11px] text-text-secondary" htmlFor="gallery-surface">
          Fondo de la seccion (<code className="font-mono">surface</code>)
        </label>
        <select
          id="gallery-surface"
          data-campo="surface"
          value={surface}
          onChange={(e) => escribir((prev) => aplicarSurfaceGaleria(prev, e.target.value))}
          className="rounded border border-border bg-bg-elevated px-2 py-1 text-xs text-text focus:border-accent focus:outline-none"
        >
          <option value="">(sin definir)</option>
          {SURFACES_GALERIA.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {items.map((pieza, i) => {
          const id = String(pieza.id ?? "");
          const src = typeof pieza.src === "string" ? pieza.src : "";
          const isOpen = abierta === i;
          return (
            <div key={`${id}-${i}`} className="rounded-lg border border-border bg-bg-elevated">
              <div className="flex items-center gap-2 px-3 py-2">
                <button type="button" onClick={() => setAbierta(isOpen ? -1 : i)} className="flex flex-1 items-center gap-2 text-left">
                  <span className="text-[10px] text-text-muted">{isOpen ? "▼" : "▶"}</span>
                  <span className="truncate text-xs font-medium text-text">{id || `pieza ${i + 1}`}</span>
                  <span className="truncate text-[10px] text-text-muted">{String(pieza.type ?? "")}</span>
                </button>
                <label className="flex shrink-0 items-center gap-1 text-[10px] text-text-secondary" htmlFor={`galeria-${i}-selection`}>
                  <code className="font-mono">selection</code>
                  <input
                    id={`galeria-${i}-selection`}
                    data-campo="selection"
                    type="checkbox"
                    checked={seleccion.includes(id)}
                    onChange={(e) => escribir((prev) => aplicarSeleccion(prev, id, e.target.checked))}
                    className="h-3.5 w-3.5 accent-accent"
                  />
                </label>
              </div>

              {isOpen && (
                <div className="space-y-2 border-t border-border px-3 py-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-0.5 block text-[10px] text-text-muted" htmlFor={`galeria-${i}-id`}>
                        Id de la pieza (<code className="font-mono">id</code>)
                      </label>
                      <input
                        id={`galeria-${i}-id`}
                        data-campo="id"
                        type="text"
                        value={id}
                        onChange={(e) => escribir((prev) => aplicarPieza(prev, i, "id", e.target.value.trim()))}
                        className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text focus:border-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[10px] text-text-muted" htmlFor={`galeria-${i}-type`}>
                        Tipo del brief (<code className="font-mono">type</code>)
                      </label>
                      <select
                        id={`galeria-${i}-type`}
                        data-campo="type"
                        value={String(pieza.type ?? "")}
                        onChange={(e) => escribir((prev) => aplicarPieza(prev, i, "type", e.target.value))}
                        className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text focus:border-accent focus:outline-none"
                      >
                        <option value="">(sin tipo)</option>
                        {GALLERY_TYPES.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-0.5 block text-[10px] text-text-muted" htmlFor={`galeria-${i}-foto`}>
                      Foto de la pieza (<code className="font-mono">{`sections.gallery.items[${i}].src`}</code>) —{" "}
                      <span className="font-mono">{nombreFotoGaleria(i, "foto.jpg")}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id={`galeria-${i}-foto`}
                        data-campo="src"
                        type="text"
                        value={src}
                        placeholder="https://firebasestorage.googleapis.com/…"
                        onChange={(e) => escribir((prev) => aplicarPieza(prev, i, "src", e.target.value.trim()))}
                        className="min-w-0 flex-1 rounded border border-border bg-bg-card px-2 py-1 font-mono text-[10px] text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                      />
                      <input
                        type="file"
                        accept={Object.keys(TIPOS_FOTO).join(",")}
                        disabled={subiendo !== null}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void subirFoto(i, f);
                          e.target.value = "";
                        }}
                        className="w-32 text-[10px] text-text-muted file:mr-1 file:rounded file:border-0 file:bg-bg-card file:px-2 file:py-0.5 file:text-[10px] file:text-text"
                      />
                      {subiendo === i && <span className="text-[10px] text-text-muted">subiendo…</span>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] text-text-muted">
                      Texto alternativo (<code className="font-mono">alt</code>) en los cuatro idiomas
                    </p>
                    <div className="flex items-center gap-2">
                      <label className="w-8 shrink-0 text-[10px] font-medium text-text-muted" htmlFor={`galeria-${i}-alt-he`}>
                        he
                      </label>
                      <input
                        id={`galeria-${i}-alt-he`}
                        data-campo="alt"
                        type="text"
                        value={typeof pieza.alt === "string" ? pieza.alt : ""}
                        onChange={(e) => escribir((prev) => aplicarPieza(prev, i, "alt", e.target.value))}
                        className="min-w-0 flex-1 rounded border border-border bg-bg-card px-2 py-1 text-[11px] text-text focus:border-accent focus:outline-none"
                      />
                    </div>
                    {IDIOMAS_ALT.map((lang) => (
                      <div key={lang} className="flex items-center gap-2">
                        <label className="w-8 shrink-0 text-[10px] font-medium text-text-muted" htmlFor={`galeria-${i}-alt-${lang}`}>
                          {lang}
                        </label>
                        <input
                          id={`galeria-${i}-alt-${lang}`}
                          data-campo="alt"
                          type="text"
                          value={leerAlt(config, lang, id)}
                          onChange={(e) => escribir((prev) => aplicarAltIdioma(prev, id, lang, e.target.value))}
                          className="min-w-0 flex-1 rounded border border-border bg-bg-card px-2 py-1 text-[11px] text-text focus:border-accent focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="mb-0.5 block text-[10px] text-text-muted" htmlFor={`galeria-${i}-serviceId`}>
                      Servicio que abre el lightbox (<code className="font-mono">serviceId</code>)
                    </label>
                    <select
                      id={`galeria-${i}-serviceId`}
                      data-campo="serviceId"
                      value={typeof pieza.serviceId === "string" ? pieza.serviceId : ""}
                      onChange={(e) => escribir((prev) => aplicarPieza(prev, i, "serviceId", e.target.value))}
                      className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text focus:border-accent focus:outline-none"
                    >
                      <option value="">(sin servicio)</option>
                      {servicios.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name || s.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={agregar}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
      >
        + Agregar pieza
      </button>
      {error && <p className="text-[10px] text-danger">{error}</p>}
    </div>
  );
}
