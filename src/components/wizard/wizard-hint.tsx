"use client";

import { useT } from "@/lib/i18n";

/**
 * Microcopy contextual debajo de un input del wizard.
 *
 * Lee de t.wizard.hints[key] — si el locale no tiene el hint definido, no
 * renderiza nada (fallback silencioso). Esto permite empezar con ES/EN y
 * sumar HE/RU/AR despues sin romper.
 */
export function WizardHint({ k }: { k: string }) {
  const { t } = useT();
  const hint = t.wizard.hints?.[k];
  if (!hint) return null;
  return <p className="wiz-hint">{hint}</p>;
}
