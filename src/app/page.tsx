import type { Metadata } from "next";
import { he as heT } from "@/lib/i18n/locales/he";
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

export const metadata: Metadata = {
  // absolute: evita el template "%s | Arzac Studio" del layout (doble marca).
  title: { absolute: "בניית אתר לעסק עם CRM וסוכן וואטסאפ AI | 770 ₪ לחודש" },
  description:
    "אתר מקצועי לעסק שלך + CRM חכם + סוכן וואטסאפ AI שקובע תורים 24/7. ללא עלות הקמה, הכל כלול ב-770 ₪ לחודש. מתאים למספרות, מכוני יופי, קעקועים ושיפוצים.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "בניית אתר לעסק עם CRM וסוכן וואטסאפ AI — אפס דמי הקמה",
    description:
      "אתר מקצועי + CRM + סוכן וואטסאפ AI לעסקים מקומיים בישראל. הכל כלול במנוי חודשי, באוויר תוך 72 שעות.",
    url: "https://arzac.studio",
    locale: "he_IL",
    type: "website",
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
        "סטודיו לבניית אתרים לעסקים קטנים בישראל: אתר מקצועי, מערכת CRM חכמה וסוכן וואטסאפ AI שקובע תורים 24/7. אפס דמי הקמה, הכל כלול במנוי חודשי.",
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
      name: "בניית אתר לעסק עם CRM וסוכן וואטסאפ AI | Arzac Studio",
      isPartOf: { "@id": "https://arzac.studio/#website" },
      about: { "@id": "https://arzac.studio/#organization" },
      inLanguage: "he",
      description:
        "אתר מקצועי לעסק שלך + CRM חכם + סוכן וואטסאפ AI שקובע תורים 24/7. ללא עלות הקמה, הכל כלול במנוי חודשי.",
    },
    {
      "@type": "Service",
      "@id": "https://arzac.studio/#service",
      name: "אתר + CRM + סוכן וואטסאפ AI לעסקים מקומיים",
      serviceType: "בניית אתרים לעסקים קטנים",
      description:
        "אתר מקצועי עם מערכת קביעת תורים אונליין, CRM לניהול לקוחות ולידים, וסוכן וואטסאפ AI שעונה וקובע תורים 24/7. מתאים למספרות, מכוני יופי, סטודיו קעקועים, מעצבות ציפורניים, בתי קפה וקבלני שיפוצים.",
      provider: { "@id": "https://arzac.studio/#organization" },
      areaServed: { "@type": "Country", name: "IL" },
      availableLanguage: ["he", "en", "ru", "es", "ar"],
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "480",
        highPrice: "1270",
        priceCurrency: "ILS",
        offerCount: 4,
        availability: "https://schema.org/InStock",
        url: "https://arzac.studio/#pricing",
      },
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
