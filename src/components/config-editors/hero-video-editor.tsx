"use client";

import { useState } from "react";

/**
 * CONEXION-02: la casilla del hero de peluquería. Escribe `hero.video` (mp4, webm, poster, medium, portrait), que convive con el
 * `hero.videoUrl` de la flota (D-33: sin mapeo). Sólo aparece con `niche === "peluqueria"` (D-35). Cada campo sube por
 * `/api/upload/${clientId}` con rol `hero` y el nombre fijo del contrato (D-36), así que la url que vuelve es, byte a byte, la que
 * `scripts/b4-material.ts` produce para el mismo archivo (`subirMaterial` es idempotente por contenido).
 * Sin `next/*` ni alias `@/`: los tests lo cargan con node + typescript.transpileModule (tests/orden/conexion-02).
 */

export const CAMPOS_HERO = ["mp4", "webm", "poster", "medium.mp4", "medium.webm", "portrait.mp4", "portrait.webm", "portrait.poster"] as const;
export type CampoHero = (typeof CAMPOS_HERO)[number];

/** Nombres fijos del contrato (D-36) en el rol `hero`: misma entrada, misma url que b4-material.ts. */
const NOMBRES: Record<CampoHero, string> = {
  mp4: "hero.mp4",
  webm: "hero.webm",
  poster: "hero-poster.avif",
  "medium.mp4": "hero-1280.mp4",
  "medium.webm": "hero-1280.webm",
  "portrait.mp4": "hero-v.mp4",
  "portrait.webm": "hero-v.webm",
  "portrait.poster": "hero-v-poster.avif",
};

const GRUPOS: { etiqueta: string; hint: string; campos: CampoHero[] }[] = [
  { etiqueta: "Horizontal", hint: "16:9 · 720p · ≤ 3 MB", campos: ["mp4", "webm"] },
  { etiqueta: "Póster", hint: "AVIF del primer cuadro · ≤ 30 KB", campos: ["poster"] },
  { etiqueta: "Medio 1280", hint: "16:9 para < 1024 px", campos: ["medium.mp4", "medium.webm"] },
  { etiqueta: "Retrato", hint: "9:16 · 1080×1920 · ≤ 6 MB", campos: ["portrait.mp4", "portrait.webm", "portrait.poster"] },
];

const TIPOS_VIDEO = ["video/mp4", "video/webm"];
const TIPOS_POSTER = ["image/avif", "image/jpeg", "image/png", "image/webp"];

export function nombreHero(campo: CampoHero): string {
  const nombre = NOMBRES[campo];
  if (!nombre) throw new Error(`campo del hero desconocido: ${campo}`);
  return nombre;
}

/** Tipos MIME que admite cada campo: vídeo mp4/webm; pósters avif (y jpeg/png/webp). */
export function tiposHero(campo: CampoHero): string[] {
  return campo.endsWith("poster") ? TIPOS_POSTER : TIPOS_VIDEO;
}

/** FormData para `/api/upload/${clientId}`: `rol` = hero y `file` renombrado a `nombreHero(campo)`. Lanza si el tipo no corresponde. */
export function formularioHero(archivo: File, campo: CampoHero): FormData {
  const tipos = tiposHero(campo);
  if (!tipos.includes(archivo.type)) throw new Error(`${campo}: tipo ${archivo.type || "vacío"} no admitido (${tipos.join(", ")})`);
  const fd = new FormData();
  fd.append("rol", "hero");
  fd.append("file", new File([archivo], nombreHero(campo), { type: archivo.type }));
  return fd;
}

/** Config nuevo con sólo `hero.video.<campo>` cambiado (url vacía borra la clave); no muta la entrada. */
export function aplicarHeroVideo(config: unknown, campo: CampoHero, url: string): Record<string, unknown> {
  const ruta = ["hero", "video", ...campo.split(".")];
  const next: Record<string, unknown> = { ...((config ?? {}) as Record<string, unknown>) };
  let obj = next;
  for (const k of ruta.slice(0, -1)) {
    const hijo = obj[k];
    obj[k] = hijo && typeof hijo === "object" ? { ...(hijo as Record<string, unknown>) } : {};
    obj = obj[k] as Record<string, unknown>;
  }
  const ultimo = ruta[ruta.length - 1];
  if (url) obj[ultimo] = url;
  else delete obj[ultimo];
  return next;
}

const leer = (o: unknown, campo: string): string => {
  const v = campo.split(".").reduce<unknown>((a, k) => (a && typeof a === "object" ? (a as Record<string, unknown>)[k] : undefined), o);
  return typeof v === "string" ? v : "";
};

export function HeroVideoEditor({
  clientId,
  niche,
  value,
  onChange,
}: {
  clientId: string;
  niche: string;
  /** `hero.video` actual (o undefined). */
  value: Record<string, unknown> | undefined;
  /** Recibe el `hero.video` nuevo entero. */
  onChange: (video: Record<string, unknown>) => void;
}) {
  const [subiendo, setSubiendo] = useState<CampoHero | null>(null);
  const [error, setError] = useState("");

  if (niche !== "peluqueria") return null;

  const aplicar = (campo: CampoHero, url: string) => {
    const next = aplicarHeroVideo({ hero: { video: value ?? {} } }, campo, url);
    onChange((next.hero as { video: Record<string, unknown> }).video);
  };

  async function subir(campo: CampoHero, archivo: File) {
    setError("");
    let fd: FormData;
    try {
      fd = formularioHero(archivo, campo);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }
    setSubiendo(campo);
    try {
      const res = await fetch(`/api/upload/${clientId}`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.urls?.[0]) setError(data.error || `${campo}: error al subir`);
      else aplicar(campo, data.urls[0]);
    } catch {
      setError(`${campo}: error de red al subir`);
    } finally {
      setSubiendo(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-text-muted">
        Vídeo del hero de peluquería (<code className="font-mono">hero.video</code>): cada archivo sube a Storage con su nombre fijo y la url queda en el config al guardar.
      </p>
      {GRUPOS.map((g) => (
        <div key={g.etiqueta} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold text-text-secondary">{g.etiqueta}</p>
            <span className="text-[10px] text-text-muted/70">{g.hint}</span>
          </div>
          {g.campos.map((campo) => {
            const url = leer(value, campo);
            return (
              <div key={campo} className="flex items-center gap-2">
                <label className="w-24 shrink-0 text-[10px] font-medium text-text-muted" htmlFor={`hero-video-${campo}`}>
                  {campo.split(".").pop()} <span className="font-mono text-text-muted/60">{nombreHero(campo)}</span>
                </label>
                <input
                  id={`hero-video-${campo}`}
                  type="text"
                  value={url}
                  placeholder="https://firebasestorage.googleapis.com/…"
                  onChange={(e) => aplicar(campo, e.target.value.trim())}
                  className="min-w-0 flex-1 rounded-md border border-border bg-bg-card px-2 py-1 font-mono text-[10px] text-text focus:border-accent focus:outline-none"
                />
                <input
                  type="file"
                  accept={tiposHero(campo).join(",")}
                  disabled={subiendo !== null}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void subir(campo, f);
                    e.target.value = "";
                  }}
                  className="w-32 text-[10px] text-text-muted file:mr-1 file:rounded file:border-0 file:bg-bg-card file:px-2 file:py-0.5 file:text-[10px] file:text-text"
                />
                {subiendo === campo && <span className="text-[10px] text-text-muted">subiendo…</span>}
              </div>
            );
          })}
        </div>
      ))}
      {error && <p className="text-[10px] text-danger">{error}</p>}
    </div>
  );
}
