"use client";

/**
 * Editor de los 19 flags globales de estilo del master-template.
 *
 * Se persisten como objeto `global` en Firestore config/{clientId}; el
 * template los aplica como atributos `data-gs-*` en <html> + CSS vars
 * (src/lib/site-theme.ts → applyGlobalStyleVars). Todo flag sin setear usa
 * el default del nicho — por eso cada control tiene la opcion "Default",
 * que borra el campo (null → FieldValue.delete() en el PUT).
 *
 * Agrupados por categoria para que el dashboard no sea una sopa de selects:
 *   Layout y espaciado · Tipografia · Color y efectos · Animacion
 */

import type { LucideIcon } from "lucide-react";
import { LayoutGrid, Type, Wand2, Play } from "lucide-react";

type EnumFlag = {
  kind: "enum";
  path: string;
  label: string;
  options: { value: string; label: string }[];
};
type BoolFlag = {
  kind: "bool";
  path: string;
  label: string;
  /** Lo que hace el template cuando el flag no esta seteado. */
  defaultHint: "si" | "no" | "nicho";
};
type NumberFlag = {
  kind: "number";
  path: string;
  label: string;
  min: number;
  max: number;
  step: number;
  placeholder: string;
};
type TextFlag = { kind: "text"; path: string; label: string; placeholder: string };

type Flag = EnumFlag | BoolFlag | NumberFlag | TextFlag;

type FlagGroup = { title: string; icon: LucideIcon; flags: Flag[] };

const GROUPS: readonly FlagGroup[] = [
  {
    title: "Layout y espaciado",
    icon: LayoutGrid,
    flags: [
      {
        kind: "enum",
        path: "global.spacing",
        label: "Espaciado entre secciones",
        options: [
          { value: "compact", label: "Compacto" },
          { value: "normal", label: "Normal" },
          { value: "spacious", label: "Espacioso" },
        ],
      },
      {
        kind: "enum",
        path: "global.density",
        label: "Densidad interna (gaps)",
        options: [
          { value: "dense", label: "Densa" },
          { value: "normal", label: "Normal" },
          { value: "airy", label: "Aireada" },
        ],
      },
      {
        kind: "enum",
        path: "global.borderRadius",
        label: "Radio de bordes (cards)",
        options: [
          { value: "none", label: "Recto (0)" },
          { value: "subtle", label: "Sutil" },
          { value: "rounded", label: "Redondeado" },
          { value: "pill", label: "Pill" },
        ],
      },
      {
        kind: "enum",
        path: "global.buttonShape",
        label: "Forma de botones",
        options: [
          { value: "square", label: "Cuadrada" },
          { value: "rounded", label: "Redondeada" },
          { value: "pill", label: "Pill" },
        ],
      },
      {
        kind: "enum",
        path: "global.imageStyle",
        label: "Estilo de imagenes",
        options: [
          { value: "square", label: "Cuadradas" },
          { value: "rounded", label: "Redondeadas" },
          { value: "circle", label: "Circulares" },
          { value: "blob", label: "Blob organico" },
        ],
      },
      {
        kind: "enum",
        path: "global.dividerStyle",
        label: "Separadores de seccion",
        options: [
          { value: "none", label: "Sin separador" },
          { value: "line", label: "Linea" },
          { value: "gradient", label: "Gradiente" },
          { value: "ornament", label: "Ornamento" },
        ],
      },
    ],
  },
  {
    title: "Tipografia",
    icon: Type,
    flags: [
      { kind: "text", path: "global.fontFamily.heading", label: "Fuente de titulos (Google Font)", placeholder: "ej: Playfair Display" },
      { kind: "text", path: "global.fontFamily.body", label: "Fuente de texto (Google Font)", placeholder: "ej: Inter" },
      {
        kind: "enum",
        path: "global.letterSpacing",
        label: "Tracking de titulos",
        options: [
          { value: "tight", label: "Apretado" },
          { value: "normal", label: "Normal" },
          { value: "wide", label: "Amplio" },
        ],
      },
      {
        kind: "enum",
        path: "global.lineHeight",
        label: "Interlineado",
        options: [
          { value: "compact", label: "Compacto" },
          { value: "normal", label: "Normal" },
          { value: "relaxed", label: "Relajado" },
        ],
      },
      { kind: "bool", path: "global.textShadow", label: "Sombra en titulos sobre fotos", defaultHint: "no" },
    ],
  },
  {
    title: "Color y efectos",
    icon: Wand2,
    flags: [
      {
        kind: "enum",
        path: "global.colorScheme",
        label: "Esquema de color",
        options: [
          { value: "brand", label: "Brand (acento del cliente)" },
          { value: "monochrome", label: "Monocromo" },
          { value: "complementary", label: "Complementario" },
          { value: "analogous", label: "Analogo" },
        ],
      },
      {
        kind: "enum",
        path: "global.cardStyle",
        label: "Estilo de cards",
        options: [
          { value: "flat", label: "Flat" },
          { value: "elevated", label: "Elevada (sombra)" },
          { value: "bordered", label: "Con borde" },
          { value: "glass", label: "Glass" },
        ],
      },
      {
        kind: "enum",
        path: "global.shadowStyle",
        label: "Intensidad de sombras",
        options: [
          { value: "none", label: "Sin sombras" },
          { value: "subtle", label: "Sutiles" },
          { value: "elevated", label: "Elevadas" },
          { value: "dramatic", label: "Dramaticas" },
        ],
      },
      { kind: "bool", path: "global.glassmorphism", label: "Glassmorphism (paneles glass)", defaultHint: "si" },
      { kind: "bool", path: "global.gradientEnabled", label: "Gradientes decorativos", defaultHint: "si" },
      {
        kind: "number",
        path: "global.overlayOpacity",
        label: "Opacidad de overlays sobre fotos (0-1)",
        min: 0,
        max: 1,
        step: 0.05,
        placeholder: "0.45",
      },
    ],
  },
  {
    title: "Animacion",
    icon: Play,
    flags: [
      {
        kind: "enum",
        path: "global.animationLevel",
        label: "Nivel de animacion",
        options: [
          { value: "none", label: "Sin animaciones" },
          { value: "subtle", label: "Sutil" },
          { value: "rich", label: "Rica (default)" },
        ],
      },
      {
        kind: "enum",
        path: "global.transitionSpeed",
        label: "Velocidad de transiciones",
        options: [
          { value: "none", label: "Instantaneas" },
          { value: "fast", label: "Rapidas" },
          { value: "normal", label: "Normales" },
          { value: "slow", label: "Lentas" },
        ],
      },
      { kind: "bool", path: "global.parallaxEnabled", label: "Parallax al scrollear", defaultHint: "si" },
    ],
  },
] as const;

const inputClass =
  "w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-xs text-text outline-none focus:border-accent";

function FlagControl({
  flag,
  getNested,
  updateNested,
}: {
  flag: Flag;
  getNested: (path: string) => unknown;
  updateNested: (path: string, value: unknown) => void;
}) {
  const raw = getNested(flag.path);

  if (flag.kind === "enum") {
    const value = typeof raw === "string" ? raw : "";
    return (
      <div>
        <label className="mb-1 block text-[11px] font-medium text-text-muted">{flag.label}</label>
        <select
          value={value}
          onChange={(e) => updateNested(flag.path, e.target.value || null)}
          className={inputClass}
        >
          <option value="">Default del nicho</option>
          {flag.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (flag.kind === "bool") {
    const value = typeof raw === "boolean" ? (raw ? "true" : "false") : "";
    const defaultLabel = flag.defaultHint === "si" ? "Default (si)" : flag.defaultHint === "no" ? "Default (no)" : "Default del nicho";
    return (
      <div>
        <label className="mb-1 block text-[11px] font-medium text-text-muted">{flag.label}</label>
        <select
          value={value}
          onChange={(e) =>
            updateNested(flag.path, e.target.value === "" ? null : e.target.value === "true")
          }
          className={inputClass}
        >
          <option value="">{defaultLabel}</option>
          <option value="true">Si</option>
          <option value="false">No</option>
        </select>
      </div>
    );
  }

  if (flag.kind === "number") {
    const value = typeof raw === "number" ? String(raw) : "";
    return (
      <div>
        <label className="mb-1 block text-[11px] font-medium text-text-muted">{flag.label}</label>
        <input
          type="number"
          min={flag.min}
          max={flag.max}
          step={flag.step}
          value={value}
          placeholder={`Default (${flag.placeholder})`}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") {
              updateNested(flag.path, null);
              return;
            }
            const n = Number(v);
            if (!Number.isNaN(n)) updateNested(flag.path, Math.min(flag.max, Math.max(flag.min, n)));
          }}
          className={inputClass}
        />
      </div>
    );
  }

  // text
  const value = typeof raw === "string" ? raw : "";
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-text-muted">{flag.label}</label>
      <input
        type="text"
        value={value}
        placeholder={flag.placeholder}
        onChange={(e) => updateNested(flag.path, e.target.value || null)}
        className={inputClass}
      />
    </div>
  );
}

export function GlobalStyleEditor({
  getNested,
  updateNested,
}: {
  getNested: (path: string) => unknown;
  updateNested: (path: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      {GROUPS.map((group) => {
        const Icon = group.icon;
        return (
          <div key={group.title} className="rounded-lg border border-border bg-bg-elevated p-3">
            <div className="mb-3 flex items-center gap-2">
              <Icon size={13} className="text-accent" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                {group.title}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.flags.map((flag) => (
                <FlagControl
                  key={flag.path}
                  flag={flag}
                  getNested={getNested}
                  updateNested={updateNested}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
