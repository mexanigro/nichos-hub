import { redirect } from "next/navigation";
import { OnboardingPagoClient } from "./onboarding-pago-client";
import { isWebCheckoutEnabled } from "@/lib/web-checkout";

/**
 * Compra por la web. P-5 (Liam, 2026-09-12): desactivada hasta certificar el cobro — la landing
 * lleva al lead por WhatsApp y esta página redirige a #pricing. El endpoint de pago responde 403 en el mismo estado.
 */
export default async function OnboardingPagoPage() {
  if (!isWebCheckoutEnabled()) redirect("/#pricing");
  return <OnboardingPagoClient />;
}
