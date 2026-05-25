import type { Metadata } from "next";
import {
  Instrument_Serif,
  JetBrains_Mono,
  Cormorant_Garamond,
  Suez_One,
  Heebo,
  Amiri,
  IBM_Plex_Sans_Arabic,
} from "next/font/google";
import { LandingI18nProvider } from "@/lib/i18n/context";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-at-serif",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const suezOne = Suez_One({
  subsets: ["hebrew", "latin"],
  weight: ["400"],
  variable: "--font-suez-one",
  display: "swap",
});

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-heebo",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-amiri",
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-ar",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-at-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Get Started Free — Arzac Studio",
  description: "Build your business website for free. Tell us about your business and we'll create a preview.",
  robots: { index: true, follow: true },
};

export default function OnboardingFreeLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingI18nProvider>
      <div className={`${instrumentSerif.variable} ${cormorant.variable} ${suezOne.variable} ${heebo.variable} ${amiri.variable} ${plexArabic.variable} ${jetbrainsMono.variable}`}>
        {children}
      </div>
    </LandingI18nProvider>
  );
}
