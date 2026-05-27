"use client";

import { AlertTriangle } from "lucide-react";

/**
 * Reusable variant selector for the 3D Impact system.
 *
 * Each section (hero, why-choose, services, gallery, booking) ships a list
 * of variants — a "standard" fallback plus one or more 3D-aware layouts.
 * This selector renders cards with a CSS thumbnail, a name, a description,
 * and optional badges, and forwards selection to the parent.
 *
 * If a variant declares `requiresHeroObjects: true` and the active
 * heroObjects map is missing the variant's expected slot, the card is
 * still clickable but a warning is shown below telling Liam to configure
 * the slot first.
 */

export type VariantSpec<T extends string> = {
  value: T;
  name: string;
  desc: string;
  /** "3D", "PREMIUM"... — small uppercase pill. */
  badge?: string;
  /** Names this variant under the hood (hero-3d-object, icon-grid-3d, ...). */
  technicalName?: string;
  /** Indicates the variant pulls from heroObjects[slot]. */
  requiresHeroObjects?: boolean;
  /** Tiny CSS-only thumbnail component. */
  Thumbnail: React.ComponentType;
};

export function SectionVariantSelector<T extends string>({
  label,
  hint,
  current,
  variants,
  onChange,
  slotForActive,
  heroObjectsConfigured,
}: {
  label: string;
  hint?: string;
  current: T;
  variants: readonly VariantSpec<T>[];
  onChange: (next: T) => void;
  /** Slot picked for the active variant (used to surface the "configure object" warning). */
  slotForActive?: string;
  /** Whether `heroObjects[slotForActive]` has anything renderable. */
  heroObjectsConfigured?: boolean;
}) {
  const active = variants.find((v) => v.value === current) ?? variants[0];
  const showSlotWarning =
    active?.requiresHeroObjects && slotForActive && heroObjectsConfigured === false;

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold text-text-secondary">{label}</p>
        {hint && <span className="text-[10px] text-text-muted/70">{hint}</span>}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {variants.map((v) => {
          const isSelected = v.value === current;
          const Thumb = v.Thumbnail;
          return (
            <button
              key={v.value}
              type="button"
              onClick={() => onChange(v.value)}
              className={`group/variant relative flex flex-col gap-2 rounded-lg border p-2.5 text-left transition-colors ${
                isSelected
                  ? "border-accent/40 bg-accent/8 ring-1 ring-accent/20"
                  : "border-border bg-bg-elevated hover:bg-bg-active"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-semibold ${
                    isSelected ? "text-text" : "text-text-secondary"
                  }`}
                >
                  {v.name}
                </span>
                {v.badge && (
                  <span className="rounded-full bg-purple-500/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-purple-300">
                    {v.badge}
                  </span>
                )}
              </div>
              {/* CSS thumbnail */}
              <div className="relative h-16 w-full overflow-hidden rounded-md border border-border bg-bg-card/40">
                <Thumb />
              </div>
              <p className="text-[10px] leading-snug text-text-muted">{v.desc}</p>
            </button>
          );
        })}
      </div>

      {showSlotWarning && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-2 text-[11px] text-amber-300">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>
            La variante seleccionada necesita un Hero Object en el slot{" "}
            <code className="rounded bg-black/20 px-1 py-0.5 font-mono text-[10px]">{slotForActive}</code>.
            Configuralo en la seccion <strong>Hero Objects</strong> arriba.
          </span>
        </div>
      )}
    </div>
  );
}
