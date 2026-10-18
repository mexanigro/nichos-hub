import { redirect } from "next/navigation";
import { isWebCheckoutEnabled } from "@/lib/web-checkout";

// LANDING-01 (2026-10-18): la vista previa es el paso que despliega una web; cerrada mientras la venta sea en persona.
export const metadata = { robots: { index: false, follow: false } };

export default function OnboardingPreviewLayout({ children }: { children: React.ReactNode }) {
  if (!isWebCheckoutEnabled()) redirect("/#pricing");
  return <>{children}</>;
}
