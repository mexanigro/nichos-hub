import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { AtelierPage } from "@/components/landing/atelier-page";

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

export const metadata = {
  title: "Arzac Studio — Websites, CRM & WhatsApp AI for local businesses in Israel",
  description:
    "Professional website, smart CRM, and AI-powered WhatsApp agent for your local business. Zero setup fee, from 790 NIS/month.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://arzac.studio/#organization",
      name: "Arzac Studio",
      url: "https://arzac.studio",
      logo: "https://arzac.studio/logo.png",
      sameAs: [],
      contactPoint: {
        "@type": "ContactPoint",
        email: "website@arzac.studio",
        contactType: "sales",
        availableLanguage: ["Spanish", "English", "Hebrew", "Russian", "Arabic"],
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://arzac.studio/#website",
      url: "https://arzac.studio",
      name: "Arzac Studio",
      publisher: { "@id": "https://arzac.studio/#organization" },
      inLanguage: ["en", "es", "he", "ru", "ar"],
    },
    {
      "@type": "WebPage",
      "@id": "https://arzac.studio/#webpage",
      url: "https://arzac.studio",
      name: "Arzac Studio — Professional Websites for Local Businesses in Israel",
      isPartOf: { "@id": "https://arzac.studio/#website" },
      about: { "@id": "https://arzac.studio/#organization" },
      description:
        "Custom website, smart CRM, and AI WhatsApp agent for your local business in Israel. Set up in minutes.",
    },
    {
      "@type": "Product",
      name: "Web + CRM Plan",
      description:
        "Professional website with CRM, booking system, and inventory management for local businesses.",
      brand: { "@id": "https://arzac.studio/#organization" },
      offers: {
        "@type": "Offer",
        price: "790",
        priceCurrency: "ILS",
        priceValidUntil: "2026-12-31",
        availability: "https://schema.org/InStock",
        url: "https://arzac.studio",
        unitCode: "MON",
      },
    },
    {
      "@type": "Product",
      name: "Plan Completo",
      description:
        "Everything in Web+CRM plus AI WhatsApp agent for automated customer service and lead capture.",
      brand: { "@id": "https://arzac.studio/#organization" },
      offers: {
        "@type": "Offer",
        price: "990",
        priceCurrency: "ILS",
        priceValidUntil: "2026-12-31",
        availability: "https://schema.org/InStock",
        url: "https://arzac.studio",
        unitCode: "MON",
      },
    },
  ],
};

export default function Page() {
  return (
    <div className={`${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AtelierPage />
    </div>
  );
}
