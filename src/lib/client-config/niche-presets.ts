// N08 T1 (D-1 a mínima): catálogo del nicho que el alta siembra en config/{clientId} para que el
// servidor del template valide servicio/personal (N06 D-5 b) y los emails lleven nombres (N07 H-5).
// Fuente de verdad: los presets *.he.ts del template; este JSON es una copia con procedencia.
import presets from "./niche-presets.he.json" with { type: "json" };
import type { BusinessNiche } from "./services.ts";

export type PresetService = { id: string; name: string; duration: number; price: number; description?: string; [k: string]: unknown };
export type PresetStaff = { id: string; name: string; schedule: Record<string, unknown>; [k: string]: unknown };
export type NichePreset = { services: PresetService[]; staff: PresetStaff[] };

/** Mismos valores que DEFAULT_BUSINESS_RULES del template (src/constants.ts). */
export const DEFAULT_BUSINESS_RULES = { bufferMinutes: 10, maxAdvanceBookingDays: 60, minAdvanceBookingHours: 0, autoConfirm: true } as const;

const { _provenance: _p, ...byNiche } = presets as unknown as Record<string, NichePreset | string>;

/** Preset del nicho (services + staff, hebreo). `employment` no tiene catálogo → null. */
export function getNichePreset(niche: BusinessNiche): NichePreset | null {
  const p = byNiche[niche];
  return p && typeof p === "object" ? p : null;
}
