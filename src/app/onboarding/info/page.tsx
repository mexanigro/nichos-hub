import { Suspense } from "react";
import { PaidWizardClient } from "./paid-wizard-client";
import { verifyOnboardingToken } from "@/lib/onboarding-token";
import { db } from "@/lib/firebase-admin";

interface PageProps {
  searchParams: Promise<{ token?: string; clientId?: string }>;
}

/**
 * Server-side: si llega ?token=... (proviene de la success page post-pago),
 * verificamos JWT y precargamos clientId/email/plan. Si llega ?clientId=...
 * (flow legacy), lo pasamos directo.
 */
export default async function OnboardingInfoPage({ searchParams }: PageProps) {
  const { token, clientId: rawClientId } = await searchParams;

  let initialClientId = rawClientId || "";
  let initialEmail = "";
  let initialPlan: "web_crm" | "completo" | "" = "";

  if (token) {
    const payload = await verifyOnboardingToken(token);
    if (payload) {
      initialClientId = payload.clientId;
      initialPlan = payload.plan;
      try {
        const snap = await db.collection("hub_clients").doc(payload.clientId).get();
        const d = snap.data();
        initialEmail = (d?.email as string) || "";
      } catch {
        // Si Firestore falla, seguimos con clientId y plan del token — email queda vacio
      }
    }
  }

  return (
    <Suspense fallback={<div className="wiz"><div className="wiz-loading" /></div>}>
      <PaidWizardClient
        initialClientId={initialClientId}
        initialEmail={initialEmail}
        initialPlan={initialPlan}
        uploadToken={token || ""}
      />
    </Suspense>
  );
}
