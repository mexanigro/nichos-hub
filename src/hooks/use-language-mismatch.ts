"use client";

import { useEffect, useMemo, useState } from "react";
import { detectLanguage, type DetectedLanguage } from "@/lib/detect-language";
import type { ClientLanguage } from "@/lib/client-language";

/**
 * Detecta si el texto pegado por el owner está en un idioma distinto al
 * esperado del cliente. Diseñado para ser barato y no invasivo:
 *
 *   - Debounce de 800ms desde la última escritura — no corre el detector
 *     en cada keystroke.
 *   - Si el texto tiene menos de 10 caracteres no-blanco, NO dispara warning
 *     (textos cortos son inevitablemente ambiguos).
 *   - Si el detector devuelve "unknown", tampoco dispara — preferimos no
 *     molestar a un falso positivo.
 *
 * Devuelve `{ mismatch, detected }`. `detected` puede ser útil para mostrar
 * en el warning ("parece <X>") incluso si `mismatch` es false (no se usa
 * actualmente, pero está disponible).
 */
export function useLanguageMismatch(
  text: string,
  expected: ClientLanguage,
): { mismatch: boolean; detected: DetectedLanguage | null } {
  const [debouncedText, setDebouncedText] = useState(text);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedText(text), 800);
    return () => clearTimeout(id);
  }, [text]);

  return useMemo(() => {
    const trimmed = debouncedText.trim();
    if (trimmed.length < 10) {
      return { mismatch: false, detected: null };
    }
    const detected = detectLanguage(debouncedText);
    if (detected === "unknown") {
      return { mismatch: false, detected: null };
    }
    return {
      mismatch: detected !== expected,
      detected,
    };
  }, [debouncedText, expected]);
}
