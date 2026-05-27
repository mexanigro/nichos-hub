"use client";

import { useState } from "react";
import { Plus, Layers, ImageIcon } from "lucide-react";
import { ReorderControls, moveItem } from "./reorder-controls";
import { TransparentPngUploader } from "./transparent-png-uploader";

/* ══════════════════════════════════════════════════════════════════════════
 * Types — mirror `heroObjects[slot].composition[]` in the template
 * ══════════════════════════════════════════════════════════════════════════ */

export type LayerOffset = {
  /** Number = px. String like "12%" = percentage. */
  x: number | string;
  y: number | string;
};

export type CompositionLayer = {
  src: string;
  offset?: LayerOffset;
  scale?: number;
  rotation?: number;
  parallaxFactor?: number;
  opacity?: number;
  zIndex?: number;
};

/* ══════════════════════════════════════════════════════════════════════════
 * Editor
 * ══════════════════════════════════════════════════════════════════════════ */

export function CompositionLayersEditor({
  value,
  onChange,
  clientId,
}: {
  value: CompositionLayer[] | undefined;
  onChange: (next: CompositionLayer[] | undefined) => void;
  clientId: string;
}) {
  const layers = value ?? [];
  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set(layers.length > 0 ? [0] : []),
  );

  function update(index: number, patch: Partial<CompositionLayer>) {
    const next = layers.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function updateOffset(index: number, axis: "x" | "y", raw: string) {
    const v = parseOffsetInput(raw);
    const current = layers[index]?.offset ?? { x: 0, y: 0 };
    update(index, {
      offset: { ...current, [axis]: v },
    });
  }

  function remove(index: number) {
    const next = layers.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : undefined);
    setExpanded((prev) => {
      const ns = new Set<number>();
      prev.forEach((i) => {
        if (i < index) ns.add(i);
        else if (i > index) ns.add(i - 1);
      });
      return ns;
    });
  }

  function move(from: number, dir: -1 | 1) {
    const next = moveItem(layers, from, from + dir);
    onChange(next);
  }

  function add() {
    const maxZ = layers.reduce((m, l) => Math.max(m, l.zIndex ?? 0), 0);
    const newLayer: CompositionLayer = {
      src: "",
      offset: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      parallaxFactor: 1,
      opacity: 1,
      zIndex: maxZ + 1,
    };
    const next = [...layers, newLayer];
    onChange(next);
    setExpanded((prev) => new Set([...prev, next.length - 1]));
  }

  return (
    <div className="space-y-3">
      {/* Stack preview */}
      <StackMiniature layers={layers} />

      {layers.length === 0 && (
        <div className="rounded-md border border-dashed border-border bg-bg-card/30 px-3 py-4 text-center">
          <Layers size={16} className="mx-auto mb-1.5 text-text-muted" />
          <p className="text-[11px] text-text-secondary">Sin layers</p>
          <p className="mt-0.5 text-[10px] text-text-muted">
            Cada layer es un PNG independiente con su propio offset, rotation y parallax.
          </p>
        </div>
      )}

      {layers.map((layer, i) => {
        const isExpanded = expanded.has(i);
        const offsetX = layer.offset?.x ?? 0;
        const offsetY = layer.offset?.y ?? 0;
        return (
          <div
            key={i}
            className={`rounded-md border bg-bg-card/40 ${
              !layer.src ? "border-amber-500/30" : "border-border"
            }`}
          >
            <button
              type="button"
              onClick={() =>
                setExpanded((prev) => {
                  const ns = new Set(prev);
                  if (ns.has(i)) ns.delete(i);
                  else ns.add(i);
                  return ns;
                })
              }
              className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-bg-active text-[10px] font-bold text-text-muted">
                {i + 1}
              </span>
              {/* mini thumb */}
              <div className="h-7 w-7 shrink-0 overflow-hidden rounded border border-border bg-bg-elevated">
                {layer.src ? (
                  <img src={layer.src} alt="" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-text-muted/60">
                    <ImageIcon size={11} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-text">Layer {i + 1}</p>
                <p className="text-[10px] text-text-muted">
                  z:{layer.zIndex ?? 0} · scale:{(layer.scale ?? 1).toFixed(2)} · rot:{(layer.rotation ?? 0)}°
                  · parallax:{(layer.parallaxFactor ?? 1).toFixed(2)} · opacity:{(layer.opacity ?? 1).toFixed(2)}
                </p>
              </div>
              <ReorderControls
                index={i}
                total={layers.length}
                onMoveUp={() => move(i, -1)}
                onMoveDown={() => move(i, 1)}
                onRemove={() => remove(i)}
                removeLabel="Eliminar layer"
              />
            </button>

            {isExpanded && (
              <div className="space-y-3 border-t border-border px-2.5 py-3">
                <TransparentPngUploader
                  label="Imagen del layer"
                  hint="PNG transparente · al menos 2400px"
                  value={layer.src || undefined}
                  clientId={clientId}
                  kind="layer"
                  onUploaded={(url) => update(i, { src: url })}
                  onClear={() => update(i, { src: "" })}
                />

                <div className="grid gap-2 sm:grid-cols-2">
                  <NumStringField
                    label="Offset X"
                    hint="px o %"
                    value={offsetX}
                    onChange={(raw) => updateOffset(i, "x", raw)}
                  />
                  <NumStringField
                    label="Offset Y"
                    hint="px o %"
                    value={offsetY}
                    onChange={(raw) => updateOffset(i, "y", raw)}
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <SliderField
                    label="Scale"
                    min={0}
                    max={3}
                    step={0.05}
                    value={layer.scale ?? 1}
                    onChange={(v) => update(i, { scale: v })}
                  />
                  <SliderField
                    label="Rotation (°)"
                    min={-180}
                    max={180}
                    step={1}
                    value={layer.rotation ?? 0}
                    onChange={(v) => update(i, { rotation: v })}
                  />
                  <SliderField
                    label="Parallax factor"
                    min={0}
                    max={2}
                    step={0.05}
                    value={layer.parallaxFactor ?? 1}
                    onChange={(v) => update(i, { parallaxFactor: v })}
                  />
                  <SliderField
                    label="Opacity"
                    min={0}
                    max={1}
                    step={0.05}
                    value={layer.opacity ?? 1}
                    onChange={(v) => update(i, { opacity: v })}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-medium text-text-muted">
                    Z-index (orden de apilado, mayor = al frente)
                  </label>
                  <input
                    type="number"
                    step={1}
                    value={layer.zIndex ?? 0}
                    onChange={(e) =>
                      update(i, { zIndex: Number.isFinite(+e.target.value) ? Math.round(+e.target.value) : 0 })
                    }
                    className="w-24 rounded-md border border-border bg-bg-card px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
                  />
                </div>

                {!layer.src && (
                  <p className="text-[10px] text-amber-300/80">
                    Falta la imagen del layer. El template ignora layers sin <code>src</code>.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-bg-card/30 px-3 py-2 text-[11px] font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Plus size={11} /> Agregar layer
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * Stack miniature — visualises the layer stack at a glance
 * ══════════════════════════════════════════════════════════════════════════ */

function StackMiniature({ layers }: { layers: CompositionLayer[] }) {
  if (layers.length === 0) return null;

  // Order by z-index ascending so painted-last is on top.
  const ordered = layers
    .map((l, i) => ({ ...l, _origIdx: i }))
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  return (
    <div className="rounded-md border border-border bg-bg-card/40 p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] font-medium text-text-muted">Stack preview</span>
        <span className="text-[10px] text-text-muted/60">apilado por z-index</span>
      </div>
      <div
        className="relative mx-auto h-24 w-full max-w-[240px] overflow-hidden rounded"
        style={{
          backgroundImage:
            "linear-gradient(45deg, #1f1f23 25%, transparent 25%), linear-gradient(-45deg, #1f1f23 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1f1f23 75%), linear-gradient(-45deg, transparent 75%, #1f1f23 75%)",
          backgroundSize: "12px 12px",
          backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
          backgroundColor: "#0a0a0d",
        }}
      >
        {ordered.map((l) => {
          if (!l.src) return null;
          const ox = typeof l.offset?.x === "string" ? l.offset.x : `${(l.offset?.x ?? 0) / 4}px`;
          const oy = typeof l.offset?.y === "string" ? l.offset.y : `${(l.offset?.y ?? 0) / 4}px`;
          return (
            <img
              key={l._origIdx}
              src={l.src}
              alt=""
              className="pointer-events-none absolute left-1/2 top-1/2 max-h-[90%] max-w-[90%] object-contain"
              style={{
                opacity: l.opacity ?? 1,
                transform: `translate(calc(-50% + ${ox}), calc(-50% + ${oy})) scale(${l.scale ?? 1}) rotate(${l.rotation ?? 0}deg)`,
                zIndex: l.zIndex ?? 0,
              }}
              onError={(e) => ((e.currentTarget.style.display = "none"))}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * Inputs
 * ══════════════════════════════════════════════════════════════════════════ */

function NumStringField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number | string;
  onChange: (raw: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label className="text-[10px] font-medium text-text-muted">{label}</label>
        {hint && <span className="text-[10px] text-text-muted/60">{hint}</span>}
      </div>
      <input
        type="text"
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0 o 12%"
        className="w-full rounded-md border border-border bg-bg-card px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
      />
    </div>
  );
}

function SliderField({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label className="text-[10px] font-medium text-text-muted">{label}</label>
        <span className="font-mono text-[10px] text-text-secondary">{value.toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-accent"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v)) onChange(clamp(v, min, max));
          }}
          className="w-16 rounded-md border border-border bg-bg-card px-1.5 py-0.5 font-mono text-[10px] text-text focus:border-accent focus:outline-none"
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * Helpers
 * ══════════════════════════════════════════════════════════════════════════ */

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function parseOffsetInput(raw: string): number | string {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  if (/%$/.test(trimmed)) return trimmed; // keep "12%" as string
  const n = Number(trimmed);
  if (Number.isFinite(n)) return n;
  return trimmed; // surface whatever the user typed — they'll fix it
}
