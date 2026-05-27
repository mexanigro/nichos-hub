"use client";

import { Boxes, AlertTriangle } from "lucide-react";
import type { HeroObjectsMap } from "./hero-objects-editor";

/**
 * Compact dropdown for picking which `heroObjects[slot]` the active section
 * variant should consume. Lists all configured slots plus a "no slot" option
 * for variants that may opt out. Surfaces a warning when the picked slot is
 * empty or missing.
 */
export function HeroSlotPicker({
  label,
  value,
  onChange,
  heroObjects,
  defaultSlot = "primary",
}: {
  label?: string;
  value: string | undefined;
  onChange: (next: string) => void;
  heroObjects: HeroObjectsMap | undefined;
  /** Pre-selected option when no value is set yet. */
  defaultSlot?: string;
}) {
  const slots = Object.keys(heroObjects ?? {});
  const current = value ?? defaultSlot;
  const slotData = heroObjects?.[current];
  const isConfigured =
    !!slotData &&
    (Boolean(slotData.src) || (slotData.composition?.length ?? 0) > 0);

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-[10px] font-medium text-text-muted">
        <Boxes size={10} />
        {label ?? "Hero object slot"}
      </label>
      {slots.length === 0 ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/8 px-2.5 py-1.5 text-[10px] text-amber-300">
          No hay Hero Objects configurados. Crea al menos un slot en la seccion <strong>Hero Objects</strong> arriba.
        </div>
      ) : (
        <>
          <select
            value={current}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-border bg-bg-card px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
          >
            {slots.map((s) => {
              const data = heroObjects?.[s];
              const configured =
                !!data && (Boolean(data.src) || (data.composition?.length ?? 0) > 0);
              return (
                <option key={s} value={s}>
                  {s}
                  {configured ? "" : " (sin imagen)"}
                </option>
              );
            })}
          </select>
          {!isConfigured && (
            <div className="flex items-start gap-1.5 rounded-md bg-amber-500/8 px-2 py-1 text-[10px] text-amber-300">
              <AlertTriangle size={10} className="mt-0.5 shrink-0" />
              <span>
                El slot <code className="rounded bg-black/20 px-1 py-0.5 font-mono">{current}</code> no tiene
                imagen aun. La variante 3D va a caer al fallback.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
