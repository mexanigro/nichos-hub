"use client";

import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n";

/**
 * Banner que aparece arriba del wizard cuando el cliente vuelve en modo
 * re-edición (status="changes_requested" + infoSubmitted=true). Muestra el
 * mensaje de Liam con los cambios pedidos.
 *
 * Dismissible — al cerrar se guarda en sessionStorage para que no reaparezca
 * en la misma sesión. Si refresca el browser, vuelve.
 */
export function ChangesRequestedBanner({
  message,
  clientId,
}: {
  message: string;
  clientId: string;
}) {
  const { t } = useT();
  const [dismissed, setDismissed] = useState(false);
  const storageKey = `arzac-changes-banner-dismissed-${clientId}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(storageKey) === "1") setDismissed(true);
  }, [storageKey]);

  if (dismissed || !message) return null;

  function close() {
    setDismissed(true);
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      /* sessionStorage puede estar deshabilitado en algunos browsers privados */
    }
  }

  return (
    <div className="wiz-changes-banner" role="status" aria-live="polite">
      <div className="wiz-changes-banner-head">
        <span className="wiz-changes-banner-tag">
          {t.wizard.changesBannerTag || "Cambios pedidos por Liam"}
        </span>
        <button
          type="button"
          className="wiz-changes-banner-close"
          onClick={close}
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
      <p className="wiz-changes-banner-message">{message}</p>
      <p className="wiz-changes-banner-hint">
        {t.wizard.changesBannerHint ||
          "Tus datos actuales ya están cargados. Ajustá lo que haga falta y volvé a enviar — Liam vuelve a revisar."}
      </p>
    </div>
  );
}
