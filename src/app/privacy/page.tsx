import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/legal-page";

// SSR en hebreo, como la portada: el hebreo es la versión que prevalece (LANDING-01).
export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description: "מדיניות הפרטיות של Arzac Studio: איזה מידע נאסף, למה, עם מי הוא משותף והזכויות שלך.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalPage doc="privacy" />;
}
