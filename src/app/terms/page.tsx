import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/legal-page";

// SSR en hebreo, como la portada: el hebreo es la versión que prevalece (LANDING-01).
export const metadata: Metadata = {
  title: "תנאי השירות",
  description: "תנאי השירות של Arzac Studio: מה כולל המנוי, מחיר, ביטול והחזר יחסי.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalPage doc="terms" />;
}
