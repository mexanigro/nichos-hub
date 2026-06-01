import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/app-shell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Arzac Studio — Professional Websites for Local Businesses in Israel",
    template: "%s | Arzac Studio",
  },
  description:
    "Custom website, smart CRM, and AI WhatsApp agent for your local business in Israel. Set up in minutes, from ₪790/month.",
  metadataBase: new URL("https://arzac.studio"),
  alternates: {
    canonical: "/",
    languages: {
      en: "https://arzac.studio",
      es: "https://arzac.studio",
      he: "https://arzac.studio",
      ru: "https://arzac.studio",
      ar: "https://arzac.studio",
      "x-default": "https://arzac.studio",
    },
  },
  openGraph: {
    title: "Arzac Studio — Websites for Local Businesses",
    description: "Website + CRM + AI WhatsApp agent. Ready in 3 minutes.",
    url: "https://arzac.studio",
    siteName: "Arzac Studio",
    locale: "en_US",
    alternateLocale: ["es_ES", "he_IL", "ru_RU", "ar_SA"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arzac Studio — Websites for Local Businesses",
    description: "Website + CRM + AI WhatsApp agent. Ready in 3 minutes.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
