import { redirect } from "next/navigation";
import { FreeWizardClient } from "./free-wizard-client";
import { isWebCheckoutEnabled } from "@/lib/web-checkout";

// LANDING-01 (2026-10-18): la venta es en persona; con la compra por la web apagada, el embudo público
// (formulario → vista previa → deploy) queda cerrado igual que /onboarding/pago.
export default function OnboardingFreePage() {
  if (!isWebCheckoutEnabled()) redirect("/#pricing");
  return <FreeWizardClient />;
}
