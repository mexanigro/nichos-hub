import {
  Instrument_Serif,
  JetBrains_Mono,
  Cormorant_Garamond,
  Suez_One,
  Heebo,
  Amiri,
  IBM_Plex_Sans_Arabic,
} from "next/font/google";
import { AtelierPage } from "@/components/landing/atelier-page";

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
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Do I need technical knowledge?",
          acceptedAnswer: { "@type": "Answer", text: "Not at all. You never touch code, hosting, or configuration. We handle everything." },
        },
        {
          "@type": "Question",
          name: "How can I trust you?",
          acceptedAnswer: { "@type": "Answer", text: "I'm Liam Arzac — you'll talk directly to me on WhatsApp. Every site we deliver lives on a subdomain of arzac.studio so you can see real, live work. Cancel anytime, no penalty." },
        },
        {
          "@type": "Question",
          name: "What if I don't have branding or a logo?",
          acceptedAnswer: { "@type": "Answer", text: "We design it for you. Give us a name and a vibe, and we'll design the logo, choose the palette, write the copy, and deliver a complete brand alongside the website." },
        },
        {
          "@type": "Question",
          name: "What happens if I cancel?",
          acceptedAnswer: { "@type": "Answer", text: "You keep your domain, exported client list, and appointment history. No penalty, no lock-in." },
        },
        {
          "@type": "Question",
          name: "What languages do you support?",
          acceptedAnswer: { "@type": "Answer", text: "The website, CRM, and WhatsApp agent work in Hebrew, English, Russian, Spanish, and Arabic. Hebrew reads right-to-left automatically." },
        },
      ],
    },
  ],
};

export default function Page() {
  return (
    <div className={`${instrumentSerif.variable} ${cormorant.variable} ${suezOne.variable} ${heebo.variable} ${amiri.variable} ${plexArabic.variable} ${jetbrainsMono.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AtelierPage />
    </div>
  );
}
