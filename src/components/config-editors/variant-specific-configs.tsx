"use client";

import { useState } from "react";
import { Plus, Trash2, Tag, BarChart3, MapPin, Clock as ClockIcon, FormInput } from "lucide-react";

/**
 * Per-variant config editors for the 3D Impact system. Each editor is
 * rendered conditionally in client-config-tab.tsx when its variant is
 * selected — keeping them out of sight when irrelevant keeps the editor
 * uncluttered for clients that haven't opted into 3D yet.
 */

/* ══════════════════════════════════════════════════════════════════════════
 * ServicesCardStackTabs — filters + layout
 * ══════════════════════════════════════════════════════════════════════════ */

export type ServicesCardStackTabsConfig = {
  filters?: string[];
  layout?: "cards-grid" | "stack-carousel";
};

export function ServicesCardStackTabsEditor({
  value,
  onChange,
}: {
  value: ServicesCardStackTabsConfig | undefined;
  onChange: (next: ServicesCardStackTabsConfig | undefined) => void;
}) {
  const cfg = value ?? {};
  const filters = cfg.filters ?? [];
  const [draft, setDraft] = useState("");

  function updateFilters(next: string[]) {
    onChange({ ...cfg, filters: next.length > 0 ? next : undefined });
  }

  function add() {
    const trimmed = draft.trim();
    if (!trimmed || filters.includes(trimmed)) return;
    updateFilters([...filters, trimmed]);
    setDraft("");
  }

  return (
    <div className="space-y-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
      <div className="flex items-center gap-1.5">
        <Tag size={11} className="text-purple-300" />
        <p className="text-[11px] font-semibold text-purple-300">
          Config: Card Stack + Tabs
        </p>
      </div>

      {/* Layout */}
      <div>
        <label className="mb-1 block text-[10px] font-medium text-text-muted">Layout</label>
        <select
          value={cfg.layout ?? "cards-grid"}
          onChange={(e) =>
            onChange({ ...cfg, layout: e.target.value as ServicesCardStackTabsConfig["layout"] })
          }
          className="w-full rounded-md border border-border bg-bg-card px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
        >
          <option value="cards-grid">Cards Grid (estatico, 2-3 columnas)</option>
          <option value="stack-carousel">Stack Carousel (apilado animado)</option>
        </select>
      </div>

      {/* Filters chips */}
      <div>
        <label className="mb-1 block text-[10px] font-medium text-text-muted">
          Tabs / Categorias
        </label>
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          {filters.map((f, i) => (
            <span
              key={`${f}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-bg-card px-2 py-0.5 text-[10px] text-text-secondary"
            >
              {f}
              <button
                type="button"
                onClick={() => updateFilters(filters.filter((_, idx) => idx !== i))}
                className="rounded-full p-0.5 text-text-muted hover:bg-red-500/15 hover:text-red-400"
                aria-label={`Quitar ${f}`}
              >
                <Trash2 size={9} />
              </button>
            </span>
          ))}
          {filters.length === 0 && (
            <span className="text-[10px] text-text-muted/70">Sin tabs aun</span>
          )}
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Ej. Cortes, Barba, Color..."
            className="flex-1 rounded-md border border-border bg-bg-card px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={add}
            disabled={!draft.trim()}
            className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            <Plus size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * GalleryGridWithFilters — filters + imageTags map
 * ══════════════════════════════════════════════════════════════════════════ */

export type GalleryGridWithFiltersConfig = {
  filters?: string[];
  /** Maps image URL → array of filter keys this image belongs to. */
  imageTags?: Record<string, string[]>;
};

export function GalleryGridWithFiltersEditor({
  value,
  galleryUrls,
  onChange,
}: {
  value: GalleryGridWithFiltersConfig | undefined;
  /** URLs of the images currently in `config.gallery` — used to populate the tag map UI. */
  galleryUrls: string[];
  onChange: (next: GalleryGridWithFiltersConfig | undefined) => void;
}) {
  const cfg = value ?? {};
  const filters = cfg.filters ?? [];
  const imageTags = cfg.imageTags ?? {};
  const [draft, setDraft] = useState("");

  function patch(next: Partial<GalleryGridWithFiltersConfig>) {
    onChange({ ...cfg, ...next });
  }

  function addFilter() {
    const trimmed = draft.trim();
    if (!trimmed || filters.includes(trimmed)) return;
    patch({ filters: [...filters, trimmed] });
    setDraft("");
  }

  function removeFilter(f: string) {
    const nextFilters = filters.filter((x) => x !== f);
    // Strip the removed filter from every image's tag set.
    const nextTags: Record<string, string[]> = {};
    for (const [url, tags] of Object.entries(imageTags)) {
      const filtered = tags.filter((t) => t !== f);
      if (filtered.length > 0) nextTags[url] = filtered;
    }
    patch({
      filters: nextFilters.length > 0 ? nextFilters : undefined,
      imageTags: Object.keys(nextTags).length > 0 ? nextTags : undefined,
    });
  }

  function toggleTag(url: string, filter: string) {
    const existing = imageTags[url] ?? [];
    const isOn = existing.includes(filter);
    const nextTags = isOn
      ? existing.filter((t) => t !== filter)
      : [...existing, filter];
    const nextMap: Record<string, string[]> = { ...imageTags };
    if (nextTags.length > 0) nextMap[url] = nextTags;
    else delete nextMap[url];
    patch({ imageTags: Object.keys(nextMap).length > 0 ? nextMap : undefined });
  }

  return (
    <div className="space-y-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
      <div className="flex items-center gap-1.5">
        <Tag size={11} className="text-purple-300" />
        <p className="text-[11px] font-semibold text-purple-300">
          Config: Grid with Filters
        </p>
      </div>

      {/* Filter chips */}
      <div>
        <label className="mb-1 block text-[10px] font-medium text-text-muted">
          Filtros disponibles
        </label>
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          {filters.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 rounded-full bg-bg-card px-2 py-0.5 text-[10px] text-text-secondary"
            >
              {f}
              <button
                type="button"
                onClick={() => removeFilter(f)}
                className="rounded-full p-0.5 text-text-muted hover:bg-red-500/15 hover:text-red-400"
                aria-label={`Quitar ${f}`}
              >
                <Trash2 size={9} />
              </button>
            </span>
          ))}
          {filters.length === 0 && (
            <span className="text-[10px] text-text-muted/70">Sin filtros aun</span>
          )}
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFilter();
              }
            }}
            placeholder="Ej. cortes, barba, color"
            className="flex-1 rounded-md border border-border bg-bg-card px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={addFilter}
            disabled={!draft.trim()}
            className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            <Plus size={11} />
          </button>
        </div>
      </div>

      {/* Image → filters tagging */}
      {galleryUrls.length > 0 && filters.length > 0 && (
        <div>
          <label className="mb-1 block text-[10px] font-medium text-text-muted">
            Asignar filtros a cada imagen ({galleryUrls.length})
          </label>
          <div className="grid gap-1.5">
            {galleryUrls.map((url) => {
              const tags = imageTags[url] ?? [];
              return (
                <div key={url} className="flex items-center gap-2 rounded-md bg-bg-card/50 p-1.5">
                  <img
                    src={url}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded object-cover"
                    onError={(e) => ((e.currentTarget.style.display = "none"))}
                  />
                  <div className="flex flex-wrap items-center gap-1">
                    {filters.map((f) => {
                      const on = tags.includes(f);
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => toggleTag(url, f)}
                          className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                            on
                              ? "border-accent/40 bg-accent/15 text-accent"
                              : "border-border bg-bg-elevated text-text-muted hover:border-accent/30"
                          }`}
                        >
                          {f}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {galleryUrls.length === 0 && (
        <p className="text-[10px] text-text-muted/80">
          Aun no hay imagenes en la galeria. Subi imagenes en la seccion <strong>Imagenes</strong> arriba
          para poder taggearlas con estos filtros.
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * GalleryBentoStats — stats[]
 * ══════════════════════════════════════════════════════════════════════════ */

export type GalleryBentoStatsConfig = {
  stats?: { value: string; label: string }[];
};

export function GalleryBentoStatsEditor({
  value,
  onChange,
}: {
  value: GalleryBentoStatsConfig | undefined;
  onChange: (next: GalleryBentoStatsConfig | undefined) => void;
}) {
  const stats = value?.stats ?? [];

  function update(next: typeof stats) {
    onChange({ ...value, stats: next.length > 0 ? next : undefined });
  }

  return (
    <div className="space-y-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
      <div className="flex items-center gap-1.5">
        <BarChart3 size={11} className="text-purple-300" />
        <p className="text-[11px] font-semibold text-purple-300">
          Config: Bento Stats
        </p>
      </div>

      <div className="space-y-1.5">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              type="text"
              value={s.value}
              onChange={(e) => {
                const next = stats.slice();
                next[i] = { ...next[i], value: e.target.value };
                update(next);
              }}
              placeholder="500+"
              className="flex-1 rounded-md border border-border bg-bg-card px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
            />
            <input
              type="text"
              value={s.label}
              onChange={(e) => {
                const next = stats.slice();
                next[i] = { ...next[i], label: e.target.value };
                update(next);
              }}
              placeholder="Clientes felices"
              className="flex-[2] rounded-md border border-border bg-bg-card px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={() => update(stats.filter((_, j) => j !== i))}
              className="rounded p-1 text-text-muted hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => update([...stats, { value: "", label: "" }])}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-bg-card/30 px-3 py-1.5 text-[11px] font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <Plus size={11} /> Agregar stat
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * GalleryPortraitBentoCameo — cameo positions
 * ══════════════════════════════════════════════════════════════════════════ */

const CAMEO_POSITION_OPTIONS = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "middle-center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;

export type GalleryPortraitBentoCameoConfig = {
  cameoPositions?: string[];
};

export function GalleryPortraitBentoCameoEditor({
  value,
  onChange,
}: {
  value: GalleryPortraitBentoCameoConfig | undefined;
  onChange: (next: GalleryPortraitBentoCameoConfig | undefined) => void;
}) {
  const positions = value?.cameoPositions ?? ["middle-right"];

  function toggle(pos: string) {
    const next = positions.includes(pos)
      ? positions.filter((p) => p !== pos)
      : [...positions, pos];
    onChange({ cameoPositions: next.length > 0 ? next : undefined });
  }

  return (
    <div className="space-y-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
      <p className="text-[11px] font-semibold text-purple-300">
        Config: Portrait Bento 3D Cameo — posiciones del cameo
      </p>
      <div className="grid grid-cols-3 gap-1 rounded-md border border-border bg-bg-card/40 p-2">
        {CAMEO_POSITION_OPTIONS.map((pos) => {
          const isOn = positions.includes(pos);
          return (
            <button
              key={pos}
              type="button"
              onClick={() => toggle(pos)}
              className={`rounded-md border px-2 py-2 text-[10px] transition-colors ${
                isOn
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-border bg-bg-elevated text-text-muted hover:bg-bg-active"
              }`}
            >
              {pos.replace("-", " ")}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-text-muted/80">
        Al menos una posicion. El template alterna entre las elegidas si configuras varias.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * BookingFormMapHours3D — showMap, showHours, formFields
 * ══════════════════════════════════════════════════════════════════════════ */

const FORM_FIELD_OPTIONS = [
  { key: "name", label: "Nombre" },
  { key: "phone", label: "Telefono" },
  { key: "email", label: "Email" },
  { key: "service", label: "Servicio" },
  { key: "date", label: "Fecha preferida" },
  { key: "message", label: "Mensaje libre" },
] as const;

export type BookingFormMapHours3DConfig = {
  showMap?: boolean;
  showHours?: boolean;
  formFields?: string[];
};

export function BookingFormMapHours3DEditor({
  value,
  onChange,
}: {
  value: BookingFormMapHours3DConfig | undefined;
  onChange: (next: BookingFormMapHours3DConfig | undefined) => void;
}) {
  const cfg = value ?? {};
  const fields = cfg.formFields ?? ["name", "phone", "service"];

  function patch(next: Partial<BookingFormMapHours3DConfig>) {
    onChange({ ...cfg, ...next });
  }

  function toggleField(key: string) {
    const isOn = fields.includes(key);
    const next = isOn ? fields.filter((f) => f !== key) : [...fields, key];
    patch({ formFields: next.length > 0 ? next : undefined });
  }

  return (
    <div className="space-y-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
      <p className="text-[11px] font-semibold text-purple-300">
        Config: Form + Map + Hours 3D
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <Toggle
          icon={MapPin}
          label="Mostrar mapa"
          on={cfg.showMap ?? true}
          onChange={(v) => patch({ showMap: v })}
        />
        <Toggle
          icon={ClockIcon}
          label="Mostrar horarios"
          on={cfg.showHours ?? true}
          onChange={(v) => patch({ showHours: v })}
        />
      </div>

      <div>
        <div className="mb-1 flex items-center gap-1.5">
          <FormInput size={10} className="text-text-muted" />
          <label className="text-[10px] font-medium text-text-muted">Campos del form</label>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {FORM_FIELD_OPTIONS.map((opt) => {
            const isOn = fields.includes(opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggleField(opt.key)}
                className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[10px] transition-colors ${
                  isOn
                    ? "border-accent/40 bg-accent/15 text-text"
                    : "border-border bg-bg-elevated text-text-muted hover:bg-bg-active"
                }`}
              >
                <div className={`h-2.5 w-2.5 rounded-sm border ${isOn ? "border-accent bg-accent" : "border-border"}`} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * Small toggle helper
 * ══════════════════════════════════════════════════════════════════════════ */

function Toggle({
  icon: Icon,
  label,
  on,
  onChange,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex items-center gap-2 rounded-md border border-border bg-bg-card/60 px-2 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-card"
    >
      <Icon size={11} className="text-text-muted" />
      <span className="flex-1 text-left">{label}</span>
      <div className={`h-3.5 w-6 rounded-full transition-colors ${on ? "bg-accent" : "bg-bg-active"}`}>
        <div
          className={`h-3.5 w-3.5 rounded-full bg-white transition-transform ${
            on ? "translate-x-2.5" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}
