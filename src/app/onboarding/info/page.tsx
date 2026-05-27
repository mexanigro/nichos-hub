import { Suspense } from "react";
import { PaidWizardClient } from "./paid-wizard-client";
import { verifyOnboardingToken } from "@/lib/onboarding-token";
import { db } from "@/lib/firebase-admin";
import { configToWizardData } from "@/lib/wizard/config-to-wizard";
import type { WizardData } from "@/lib/wizard/wizard-types";
import { isValidClientLanguage, type ClientLanguage } from "@/lib/client-language";

interface PageProps {
  searchParams: Promise<{ token?: string; clientId?: string }>;
}

/**
 * Server-side:
 *   - ?token=...     → flow post-pago. Verifica JWT y precarga clientId/plan.
 *   - ?clientId=...  → flow legacy o link directo (ej. email "cambios pedidos").
 *
 * Si el cliente está en modo re-edición (status="changes_requested" y
 * infoSubmitted=true en hub_clients), hidratamos el wizard con su config
 * previo y le mostramos el mensaje de Liam.
 */
export default async function OnboardingInfoPage({ searchParams }: PageProps) {
  const { token, clientId: rawClientId } = await searchParams;

  let initialClientId = rawClientId || "";
  let initialEmail = "";
  let initialPlan: "web_crm" | "completo" | "" = "";
  let prefilledData: Partial<WizardData> | undefined;
  let isResubmit = false;
  let changesRequestedMessage = "";
  /** Idioma persistido en hub_clients — si está, gana sobre detectLocale() del
   *  browser. El cliente recién registrado por Cardcom ya tiene language. */
  let initialLocale: ClientLanguage | undefined;

  if (token) {
    const payload = await verifyOnboardingToken(token);
    if (payload) {
      initialClientId = payload.clientId;
      initialPlan = payload.plan;
    }
  }

  // Sólo intentamos hidratar si conocemos un clientId.
  if (initialClientId) {
    try {
      const [hubSnap, configSnap] = await Promise.all([
        db.collection("hub_clients").doc(initialClientId).get(),
        db.collection("config").doc(initialClientId).get(),
      ]);

      const hubData = hubSnap.data() || {};
      const configData = configSnap.exists ? configSnap.data() : null;

      initialEmail =
        (hubData.email as string) ||
        ((hubData.contact as { email?: string } | undefined)?.email) ||
        "";

      if (isValidClientLanguage(hubData.language)) {
        initialLocale = hubData.language;
      }

      // Modo re-edición: status changes_requested + ya tenía info enviada.
      // Si solo hay changes_requested sin infoSubmitted, igual contamos como
      // resubmit porque Liam pidió cambios (caso edge).
      if (hubData.status === "changes_requested") {
        isResubmit = true;
        if (typeof hubData.lastChangesRequestMessage === "string") {
          changesRequestedMessage = hubData.lastChangesRequestMessage;
        }
        if (configData) {
          prefilledData = configToWizardData(configData);
        }
      } else if (hubData.infoSubmitted === true && configData) {
        // Caso edge: cliente vuelve manualmente al link sin que Liam haya pedido
        // cambios. Hidratamos igual para que no rellene de cero, pero no
        // mostramos banner. Esto cubre "alguien quiere actualizar su info".
        prefilledData = configToWizardData(configData);
      }
    } catch {
      // Firestore fail → seguimos con clientId y plan del token, sin hidratar.
    }
  }

  return (
    <Suspense fallback={<div className="wiz"><div className="wiz-loading" /></div>}>
      <PaidWizardClient
        initialClientId={initialClientId}
        initialEmail={initialEmail}
        initialPlan={initialPlan}
        uploadToken={token || ""}
        prefilledData={prefilledData}
        isResubmit={isResubmit}
        changesRequestedMessage={changesRequestedMessage}
        initialLocale={initialLocale}
      />
    </Suspense>
  );
}
