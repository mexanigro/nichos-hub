"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import type { WizardData } from "@/lib/wizard/wizard-types";

/**
 * Mini-screenshot de referencia de cómo se ve esa sección en el template del
 * nicho elegido. Lee de `/public/wizard-refs/{niche}/{stepKey}.jpg` —
 * si la imagen no existe (404), no renderiza nada (fallback silencioso).
 *
 * Esto permite agregar las referencias gradualmente: Liam sube screenshots
 * a /public/wizard-refs/ y aparecen automáticamente en los steps
 * correspondientes. No hay que tocar código por cada imagen nueva.
 *
 * Nichos esperados: barberia, estetica, tattoo, nails, cafeteria, remodelaciones.
 * Para nichos sin imagen → usa "estetica" como fallback genérico.
 */
const FALLBACK_NICHE = "estetica";

export function WizardRefImage({
  data,
  stepKey,
  caption,
}: {
  data: WizardData;
  stepKey: string;
  caption?: string;
}) {
  const { t } = useT();
  const [errored, setErrored] = useState(false);

  const niche = data.niche && data.niche !== "otro" ? data.niche : FALLBACK_NICHE;
  const src = `/wizard-refs/${niche}/${stepKey}.jpg`;

  if (errored) return null;

  return (
    <figure className="wiz-ref">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onError={() => setErrored(true)}
        loading="lazy"
      />
      <figcaption>
        <span className="wiz-ref-tag">
          {t.wizard.refTag || "Así se ve esta sección"}
        </span>
        {caption && <span className="wiz-ref-caption">{caption}</span>}
        <span className="wiz-ref-disclaimer">
          {t.wizard.refDisclaimer ||
            "Tu sitio puede verse distinto según los colores y fotos que elijas."}
        </span>
      </figcaption>
    </figure>
  );
}
