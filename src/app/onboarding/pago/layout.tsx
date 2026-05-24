import type { Metadata } from "next";
import {
  Instrument_Serif,
  JetBrains_Mono,
  Noto_Serif,
  Noto_Serif_Hebrew,
  Noto_Sans_Hebrew,
  Noto_Naskh_Arabic,
  Noto_Sans_Arabic,
} from "next/font/google";
import { LandingI18nProvider } from "@/lib/i18n/context";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-at-serif",
  display: "swap",
});

const notoSerif = Noto_Serif({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-noto-serif",
  display: "swap",
});

const notoSerifHe = Noto_Serif_Hebrew({
  subsets: ["hebrew"],
  weight: ["400"],
  variable: "--font-noto-serif-he",
  display: "swap",
});

const notoSansHe = Noto_Sans_Hebrew({
  subsets: ["hebrew"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-sans-he",
  display: "swap",
});

const notoNaskhAr = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400"],
  variable: "--font-noto-naskh-ar",
  display: "swap",
});

const notoSansAr = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-sans-ar",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
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
      <div className={`${instrumentSerif.variable} ${notoSerif.variable} ${notoSerifHe.variable} ${notoSansHe.variable} ${notoNaskhAr.variable} ${notoSansAr.variable} ${jetbrainsMono.variable}`}>
        {children}
      </div>
    </LandingI18nProvider>
  );
}
