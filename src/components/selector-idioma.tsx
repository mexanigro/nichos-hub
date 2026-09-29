"use client";

import { type ClientLanguage, VALID_CLIENT_LANGUAGES, CLIENT_LANGUAGE_LABELS_ES } from "@/lib/client-language";

/**
 * Idioma del texto que se edita (IDIOMAS-01): base = raíz de config; otro = `translations[lang]`. El mismo selector para
 * Contenido y para las casillas de servicios, equipo y reseñas. `conCapa(code)` marca con « ·» los idiomas que ya traen capa.
 */
export function SelectorIdioma({ idioma, base, onCambio, conCapa }: {
  idioma: ClientLanguage;
  base: ClientLanguage;
  onCambio: (next: ClientLanguage) => void;
  conCapa?: (code: ClientLanguage) => boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Idioma del texto">
      <span className="me-1 text-[11px] text-text-muted">Idioma del texto:</span>
      {VALID_CLIENT_LANGUAGES.map((code) => {
        const active = code === idioma;
        const hasLayer = code !== base && !!conCapa?.(code);
        return (
          <button
            key={code}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onCambio(code)}
            className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
              active
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-bg-elevated text-text-muted hover:text-text"
            }`}
          >
            {CLIENT_LANGUAGE_LABELS_ES[code]}
            {code === base ? " · base" : hasLayer ? " ·" : ""}
          </button>
        );
      })}
    </div>
  );
}
