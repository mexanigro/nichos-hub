import type { Metadata } from "next";
import { he as heCrudo } from "@/lib/i18n/locales/he";
import { aplicarPrecios } from "@/lib/i18n/precios";
import { MONTHLY_AMOUNT } from "@/lib/pricing";
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

// LANDING-01: el precio sale de src/lib/pricing.ts; el FAQ del JSON-LD es el mismo que se pinta, con {precio} ya reemplazado.
const heT = aplicarPrecios(heCrudo, "he");
const DESCRIPCION = `אתר מקצועי לעסק שלך + מערכת CRM ללקוחות ותורים + התראות במייל. ${MONTHLY_AMOUNT} ₪ לחודש, בלי דמי הקמה. מתאים למספרות, מכוני יופי, קעקועים ושיפוצים.`;

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
  // absolute: evita el template "%s | Arzac Studio" del layout (doble marca).
  title: { absolute: heT.meta.title },
  description: DESCRIPCION,
  alternates: { canonical: "/" },
  openGraph: {
    title: heT.meta.title,
    description: `אתר מקצועי + CRM + התראות במייל לעסקים מקומיים בישראל. ${MONTHLY_AMOUNT} ₪ לחודש, בלי דמי הקמה, באוויר תוך 48 שעות מקבלת החומרים.`,
    url: "https://arzac.studio",
    siteName: "Arzac Studio",
    locale: "he_IL",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: heT.meta.title }],
  },
};

// JSON-LD en hebreo: el SSR por defecto es hebreo, y el structured data debe
// coincidir con el contenido visible. El FAQPage se genera desde he.ts para
// que nunca se desincronice del FAQ renderizado.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": "https://arzac.studio/#organization",
      name: "Arzac Studio",
      url: "https://arzac.studio",
      logo: "https://arzac.studio/logo.png",
      image: "https://arzac.studio/og.png",
      description:
        "סטודיו לבניית אתרים לעסקים קטנים בישראל: אתר מקצועי, מערכת CRM ללקוחות ותורים והתראות במייל, במנוי חודשי קבוע ובלי דמי הקמה.",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Tel Aviv",
        addressCountry: "IL",
      },
      areaServed: { "@type": "Country", name: "IL" },
      founder: { "@type": "Person", name: "Liam Arzac" },
      knowsLanguage: ["he", "en", "ru", "es", "ar"],
      telephone: "+972557719141",
      contactPoint: {
        "@type": "ContactPoint",
        email: "website@arzac.studio",
        telephone: "+972557719141",
        contactType: "sales",
        availableLanguage: ["Hebrew", "English", "Russian", "Spanish", "Arabic"],
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://arzac.studio/#website",
      url: "https://arzac.studio",
      name: "Arzac Studio",
      publisher: { "@id": "https://arzac.studio/#organization" },
      inLanguage: "he",
    },
    {
      "@type": "WebPage",
      "@id": "https://arzac.studio/#webpage",
      url: "https://arzac.studio",
      name: "בניית אתר לעסק עם CRM והתראות במייל | Arzac Studio",
      isPartOf: { "@id": "https://arzac.studio/#website" },
      about: { "@id": "https://arzac.studio/#organization" },
      inLanguage: "he",
      description:
        DESCRIPCION,
    },
    {
      "@type": "Service",
      "@id": "https://arzac.studio/#service",
      name: "אתר + CRM + התראות במייל לעסקים מקומיים",
      serviceType: "בניית אתרים לעסקים קטנים",
      description:
        "אתר מקצועי עם זימון תורים אונליין, CRM לניהול לקוחות ופניות והתראות במייל. מתאים למספרות, מכוני יופי, סטודיו קעקועים, מעצבות ציפורניים, בתי קפה וקבלני שיפוצים.",
      provider: { "@id": "https://arzac.studio/#organization" },
      areaServed: { "@type": "Country", name: "IL" },
      availableLanguage: ["he", "en", "ru", "es", "ar"],
      offers: [
        {
          "@type": "Offer",
          name: "מנוי חודשי — אתר + CRM + התראות במייל, בלי דמי הקמה",
          price: String(MONTHLY_AMOUNT),
          priceCurrency: "ILS",
          availability: "https://schema.org/InStock",
          url: "https://arzac.studio/#pricing",
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://arzac.studio/#faq",
      inLanguage: "he",
      mainEntity: heT.faq.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
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
