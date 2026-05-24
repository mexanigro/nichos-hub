import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { LandingI18nProvider } from "@/lib/i18n/context";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-at-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-at-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pago — Arzac Studio",
  description: "Complete your subscription payment",
  robots: { index: false, follow: false },
};

export default function OnboardingPagoLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingI18nProvider>
      <div className={`${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
        {children}
      </div>
    </LandingI18nProvider>
  );
}
