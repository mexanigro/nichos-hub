"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Layers,
  Boxes,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { CompositionLayersEditor, type CompositionLayer } from "./composition-layers-editor";
import { TransparentPngUploader } from "./transparent-png-uploader";

/* ══════════════════════════════════════════════════════════════════════════
 * Types — mirror what master-template reads from `config.heroObjects[slot]`
 * ══════════════════════════════════════════════════════════════════════════ */

export type ParticleType = "bubbles" | "smoke" | "sparkles" | "pearls" | "none";
export type ParticleIntensity = "subtle" | "medium" | "strong";

export type HeroObjectSlot = {
  /** Single-image source. When `composition` is set, this is ignored. */
  src?: string;
  particles?: ParticleType;
  intensity?: ParticleIntensity;
  /**
   * `"auto"` (derive from brand accent), `"black"` (default), or a hex color.
   * Stored as-is so the template knows whether to compute it at render time.
   */
  shadowColor?: string;
  composition?: CompositionLayer[];
};

export type HeroObjectsMap = Record<string, HeroObjectSlot | undefined>;

/* ══════════════════════════════════════════════════════════════════════════
 * Editor
 * ══════════════════════════════════════════════════════════════════════════ */

const CANONICAL_SLOTS = ["primary", "secondary", "accent"] as const;
const PARTICLE_OPTIONS: { value: ParticleType; label: string; hint: string }[] = [
  { value: "none", label: "Ninguna", hint: "Sin particulas ambientales" },
  { value: "bubbles", label: "Burbujas", hint: "Subiendo, ideal estetica/spa" },
  { value: "smoke", label: "Humo", hint: "Suave, vapor, cafeteria" },
  { value: "sparkles", label: "Chispas", hint: "Destellos, joyeria/nails" },
  { value: "pearls", label: "Perlas", hint: "Texturizado, lujo" },
];
const INTENSITY_OPTIONS: { value: ParticleIntensity; label: string }[] = [
  { value: "subtle", label: "Sutil" },
  { value: "medium", label: "Media" },
  { value: "strong", label: "Fuerte" },
];

export function HeroObjectsEditor({
  value,
  onChange,
  clientId,
}: {
  value: HeroObjectsMap | undefined;
  onChange: (next: HeroObjectsMap | undefined) => void;
  clientId: string;
}) {
  const map = value ?? {};
  const orderedKeys = orderSlots(Object.keys(map));
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(orderedKeys.length > 0 ? [orderedKeys[0]] : []),
  );
  const [newSlotName, setNewSlotName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function toggleExpanded(slot: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      return next;
    });
  }

  function patchSlot(slot: string, patch: Partial<HeroObjectSlot> | null) {
    const next: HeroObjectsMap = { ...map };
    if (patch === null) {
      delete next[slot];
    } else {
      next[slot] = { ...(next[slot] ?? {}), ...patch };
    }
    onChange(Object.keys(next).length > 0 ? next : undefined);
  }

  function addSlot(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!/^[a-z][a-z0-9_-]{0,30}$/i.test(trimmed)) return;
    if (map[trimmed]) return;
    onChange({ ...map, [trimmed]: {} });
    setExpanded((prev) => new Set([...prev, trimmed]));
    setNewSlotName("");
  }

  function addCanonical(slot: (typeof CANONICAL_SLOTS)[number]) {
    if (map[slot]) {
      setExpanded((prev) => new Set([...prev, slot]));
      return;
    }
    onChange({ ...map, [slot]: {} });
    setExpanded((prev) => new Set([...prev, slot]));
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-bg-elevated/40 px-3 py-2.5 text-[11px] text-text-muted">
        Los Hero Objects son PNG transparentes (productos, herramientas, frascos…) que el sistema 3D Impact usa para componer escenas
        con parallax e iluminacion. <strong className="text-text-secondary">primary</strong> es el principal, <strong className="text-text-secondary">secondary</strong> apoya, <strong className="text-text-secondary">accent</strong> es chico. Tambien podes crear slots custom.
      </div>

      {/* Canonical slot chips — show only the ones not configured yet */}
      {CANONICAL_SLOTS.some((s) => !map[s]) && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-text-muted">Slots base:</span>
          {CANONICAL_SLOTS.filter((s) => !map[s]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addCanonical(s)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-bg-elevated px-2 py-0.5 text-[10px] text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <Plus size={9} />
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Slot cards */}
      {orderedKeys.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-bg-elevated/30 px-4 py-6 text-center">
          <Boxes size={20} className="mx-auto mb-2 text-text-muted" />
          <p className="text-[11px] text-text-secondary">Sin Hero Objects configurados</p>
          <p className="mt-1 text-[10px] text-text-muted">
            Sin objects, las variantes 3D del Hero/Splash/Galeria caen al renderer legacy.
          </p>
        </div>
      )}

      {orderedKeys.map((slot) => {
        const isCustom = !CANONICAL_SLOTS.includes(slot as (typeof CANONICAL_SLOTS)[number]);
        const data = map[slot] ?? {};
        const isExpanded = expanded.has(slot);
        return (
          <SlotCard
            key={slot}
            slot={slot}
            isCustom={isCustom}
            data={data}
            expanded={isExpanded}
            onToggle={() => toggleExpanded(slot)}
            onPatch={(patch) => patchSlot(slot, patch)}
            onRename={(nextName) => {
              const trimmed = nextName.trim();
              if (!trimmed || trimmed === slot) return;
              if (!/^[a-z][a-z0-9_-]{0,30}$/i.test(trimmed)) return;
              if (map[trimmed]) return;
              const next: HeroObjectsMap = {};
              for (const k of Object.keys(map)) {
                next[k === slot ? trimmed : k] = map[k];
              }
              onChange(next);
              setExpanded((prev) => {
                const ns = new Set(prev);
                ns.delete(slot);
                ns.add(trimmed);
                return ns;
              });
            }}
            onRequestDelete={() => setConfirmDelete(slot)}
            clientId={clientId}
          />
        );
      })}

      {/* Add custom slot */}
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-bg-elevated/30 p-2">
        <input
          type="text"
          value={newSlotName}
          onChange={(e) => setNewSlotName(e.target.value)}
          placeholder="Nombre del slot custom (ej. logo3d, mascot)"
          className="flex-1 rounded-md border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSlot(newSlotName);
            }
          }}
        />
        <button
          type="button"
          onClick={() => addSlot(newSlotName)}
          disabled={!newSlotName.trim() || !!map[newSlotName.trim()]}
          className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
        >
          <Plus size={11} />
          Agregar slot
        </button>
      </div>

      {/* Confirm delete modal — inline overlay, no portal needed */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-bg-card p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-500/15 p-2 text-red-400">
                <Trash2 size={16} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-text">Eliminar slot &quot;{confirmDelete}&quot;</h3>
                <p className="mt-1 text-[11px] text-text-muted">
                  Las variantes 3D que apunten a este slot van a caer al fallback legacy.
                  Esta accion solo se guarda al confirmar el guardado del config.
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-md border border-border bg-bg-elevated px-3 py-1.5 text-[11px] text-text-secondary transition-colors hover:bg-bg-hover"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  patchSlot(confirmDelete, null);
                  setConfirmDelete(null);
                }}
                className="rounded-md bg-red-500/90 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-red-500"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * Slot card — image upload, particles, intensity, shadow color, composition
 * ══════════════════════════════════════════════════════════════════════════ */

function SlotCard({
  slot,
  isCustom,
  data,
  expanded,
  onToggle,
  onPatch,
  onRename,
  onRequestDelete,
  clientId,
}: {
  slot: string;
  isCustom: boolean;
  data: HeroObjectSlot;
  expanded: boolean;
  onToggle: () => void;
  onPatch: (patch: Partial<HeroObjectSlot>) => void;
  onRename: (next: string) => void;
  onRequestDelete: () => void;
  clientId: string;
}) {
  const [showComposition, setShowComposition] = useState(
    Array.isArray(data.composition) && data.composition.length > 0,
  );
  const [renameDraft, setRenameDraft] = useState(slot);
  const [editingName, setEditingName] = useState(false);
  const hasComposition = Array.isArray(data.composition) && data.composition.length > 0;
  const layerCount = data.composition?.length ?? 0;

  return (
    <div className="rounded-lg border border-border bg-bg-elevated/40">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-2 text-left"
        >
          {expanded ? (
            <ChevronDown size={13} className="text-text-muted" />
          ) : (
            <ChevronRight size={13} className="text-text-muted" />
          )}

          {/* Thumbnail */}
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border bg-bg-card">
            {data.src ? (
              <img
                src={data.src}
                alt=""
                className="h-full w-full object-contain"
                onError={(e) => ((e.currentTarget.style.display = "none"))}
              />
            ) : hasComposition && data.composition?.[0]?.src ? (
              <img
                src={data.composition[0].src}
                alt=""
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-text-muted/60">
                <Boxes size={14} />
              </div>
            )}
          </div>

          <div className="flex-1">
            {editingName && isCustom ? (
              <input
                type="text"
                autoFocus
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onRename(renameDraft);
                    setEditingName(false);
                  } else if (e.key === "Escape") {
                    setRenameDraft(slot);
                    setEditingName(false);
                  }
                }}
                onBlur={() => {
                  onRename(renameDraft);
                  setEditingName(false);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full rounded border border-border bg-bg-card px-1.5 py-0.5 text-xs font-mono text-text focus:border-accent focus:outline-none"
              />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-semibold text-text">{slot}</span>
                {isCustom && (
                  <span className="rounded-full bg-bg-active px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-text-muted">
                    custom
                  </span>
                )}
                {hasComposition && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-accent/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-accent">
                    <Layers size={8} />
                    {layerCount} {layerCount === 1 ? "layer" : "layers"}
                  </span>
                )}
              </div>
            )}
            <p className="mt-0.5 text-[10px] text-text-muted">
              {!data.src && !hasComposition
                ? "Sin imagen — sube un PNG transparente"
                : `${data.particles ?? "none"} · ${data.intensity ?? "subtle"}`}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1">
          {isCustom && !editingName && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRenameDraft(slot);
                setEditingName(true);
              }}
              title="Renombrar slot"
              className="flex h-7 w-7 items-center justify-center rounded text-text-muted hover:bg-bg-hover hover:text-text"
            >
              <span className="text-[11px]">✎</span>
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete();
            }}
            title="Eliminar slot"
            className="flex h-7 w-7 items-center justify-center rounded text-text-muted hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="space-y-3 border-t border-border px-3 py-3">
          {/* Single-image PNG upload */}
          {!hasComposition && (
            <TransparentPngUploader
              label="Imagen base"
              hint="PNG transparente · minimo 2400×3200"
              value={data.src}
              clientId={clientId}
              kind="hero"
              onUploaded={(url) => onPatch({ src: url })}
              onClear={() => onPatch({ src: undefined })}
            />
          )}

          {hasComposition && (
            <div className="rounded-md border border-accent/20 bg-accent/5 px-3 py-2 text-[11px] text-accent">
              Este slot usa <strong>composition multi-layer</strong>. La imagen base se ignora — los layers controlan el render.
            </div>
          )}

          {/* Particles + intensity */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-text-muted">Particulas</label>
              <select
                value={data.particles ?? "none"}
                onChange={(e) => onPatch({ particles: e.target.value as ParticleType })}
                className="w-full rounded-md border border-border bg-bg-card px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
              >
                {PARTICLE_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label} — {p.hint}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-text-muted">Intensidad</label>
              <select
                value={data.intensity ?? "subtle"}
                onChange={(e) => onPatch({ intensity: e.target.value as ParticleIntensity })}
                disabled={(data.particles ?? "none") === "none"}
                className="w-full rounded-md border border-border bg-bg-card px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {INTENSITY_OPTIONS.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Shadow color */}
          <ShadowColorField
            value={data.shadowColor}
            onChange={(v) => onPatch({ shadowColor: v })}
          />

          {/* Composition toggle + editor */}
          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setShowComposition((v) => !v)}
              className="flex w-full items-center justify-between gap-2 text-left text-[11px] font-semibold text-text-secondary hover:text-text"
            >
              <span className="inline-flex items-center gap-1.5">
                <Layers size={11} />
                Composition (multi-layer)
              </span>
              {showComposition ? (
                <ChevronDown size={11} className="text-text-muted" />
              ) : (
                <ChevronRight size={11} className="text-text-muted" />
              )}
            </button>
            <p className="mt-0.5 text-[10px] text-text-muted">
              Apila varios PNG con offset/scale/rotation y parallax independiente.
              Si activas layers, &quot;Imagen base&quot; deja de usarse.
            </p>
            {showComposition && (
              <div className="mt-2">
                <CompositionLayersEditor
                  value={data.composition}
                  onChange={(next) => onPatch({ composition: next })}
                  clientId={clientId}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * Shadow color field — accepts "auto", "black", or hex
 * ══════════════════════════════════════════════════════════════════════════ */

function ShadowColorField({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  const current = value ?? "black";
  const isPreset = current === "auto" || current === "black";
  const hex = isPreset ? "#000000" : current;

  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium text-text-muted">Color de sombra</label>
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill active={current === "auto"} onClick={() => onChange("auto")} label="auto" hint="brand accent" />
        <Pill active={current === "black"} onClick={() => onChange("black")} label="black" hint="default" />
        <Pill
          active={!isPreset}
          onClick={() => onChange(hex === "#000000" ? "#1a1a1a" : hex)}
          label="custom"
          hint="hex"
        />
        {!isPreset && (
          <>
            <input
              type="color"
              value={hex}
              onChange={(e) => onChange(e.target.value)}
              className="h-7 w-8 cursor-pointer rounded border border-border bg-transparent"
            />
            <input
              type="text"
              value={hex}
              onChange={(e) => onChange(e.target.value)}
              className="w-24 rounded-md border border-border bg-bg-card px-2 py-1 font-mono text-[11px] text-text focus:border-accent focus:outline-none"
            />
          </>
        )}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
        active
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-border bg-bg-elevated text-text-muted hover:bg-bg-hover"
      }`}
    >
      <span className="font-semibold">{label}</span>
      {hint && <span className="opacity-70">·</span>}
      {hint && <span className="opacity-70">{hint}</span>}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * Helpers
 * ══════════════════════════════════════════════════════════════════════════ */

function orderSlots(keys: string[]): string[] {
  const canonical = CANONICAL_SLOTS.filter((s) => keys.includes(s));
  const custom = keys
    .filter((k) => !CANONICAL_SLOTS.includes(k as (typeof CANONICAL_SLOTS)[number]))
    .sort();
  return [...canonical, ...custom];
}
