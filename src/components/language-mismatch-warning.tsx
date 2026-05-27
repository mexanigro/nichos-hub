"use client";

import { useEffect, useState } from "react";
import { useLanguageMismatch } from "@/hooks/use-language-mismatch";
import {
  CLIENT_LANGUAGE_LABELS_ES,
  type ClientLanguage,
} from "@/lib/client-language";

/**
 * Aviso amarillo NO bloqueante que aparece debajo de un input cuando el texto
 * está escrito en un idioma distinto al esperado del cliente. El owner puede
 * descartarlo con "Ignorar" — el dismiss se persiste en sessionStorage por
 * `fieldId` para que el aviso no vuelva a aparecer en la misma sesión.
 *
 * Casos en los que NO renderiza nada:
 *   - Texto vacío o muy corto (<10 chars) — gestionado por el hook.
 *   - Idioma detectado === idioma esperado.
 *   - Detector devolvió "unknown" — preferimos no molestar.
 *   - El owner clickeó "Ignorar" en esta sesión.
 *
 * Por diseño no se monta debajo de inputs de nombre propio, email, teléfono,
 * URL o números — esos campos no tienen sentido pasarlos por el detector.
 */
export function LanguageMismatchWarning({
  fieldId,
  text,
  expected,
}: {
  /** Identificador estable del campo (ej. `${clientId}:hero.titlePrefix`). */
  fieldId: string;
  text: string;
  expected: ClientLanguage;
}) {
  const { mismatch, detected } = useLanguageMismatch(text, expected);
  const [dismissed, setDismissed] = useState(false);

  // Rehidratar el flag de "ignorado" al montar y cuando cambia el id del campo.
  useEffect(() => {
    if (typeof window === "undefined") {
      setDismissed(false);
      return;
    }
    try {
      const flag = window.sessionStorage.getItem(storageKey(fieldId));
      setDismissed(flag === "1");
    } catch {
      setDismissed(false);
    }
  }, [fieldId]);

  if (!mismatch || !detected || dismissed) return null;

  const detectedLabel = labelFor(detected);
  const expectedLabel = CLIENT_LANGUAGE_LABELS_ES[expected];

  function handleDismiss() {
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(storageKey(fieldId), "1");
      } catch {
        // sessionStorage puede fallar en modo privado — ignorar.
      }
    }
    setDismissed(true);
  }

  return (
    <div
      role="status"
      className="mt-1 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[10px] text-amber-200"
    >
      <span className="flex-1 leading-snug">
        Parece que escribiste en <strong>{detectedLabel}</strong>, esperaba{" "}
        <strong>{expectedLabel}</strong>. Si es intencional, ignorá este aviso.
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-200 transition-colors hover:bg-amber-500/20"
      >
        Ignorar
      </button>
    </div>
  );
}

function storageKey(fieldId: string): string {
  return `lang-mismatch-dismissed:${fieldId}`;
}

const DETECTED_LABELS: Record<string, string> = {
  es: "Español",
  en: "Inglés",
  he: "Hebreo",
  ru: "Ruso",
  ar: "Árabe",
};

function labelFor(detected: string): string {
  return DETECTED_LABELS[detected] ?? detected;
}
