import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/app-shell";

const inter = Inter({ subsets: ["latin"] });

// Metadata por defecto en hebreo: el mercado objetivo es Israel (Google IL).
// Sin hreflang: hay una sola URL con cambio de idioma client-side — hreflang
// requiere URLs distintas por idioma. El canonical se declara por página.
export const metadata: Metadata = {
  title: {
    default: "בניית אתר לעסק עם CRM וסוכן וואטסאפ AI | Arzac Studio",
    template: "%s | Arzac Studio",
  },
  description:
    "אתר מקצועי לעסק שלך + CRM חכם + סוכן וואטסאפ AI שקובע תורים 24/7. ללא עלות הקמה, הכל כלול במנוי חודשי. מתאים למספרות, מכוני יופי, קעקועים ושיפוצים.",
  metadataBase: new URL("https://arzac.studio"),
  openGraph: {
    title: "Arzac Studio — בניית אתר לעסק עם CRM וסוכן וואטסאפ AI",
    description: "אתר + CRM + סוכן וואטסאפ AI לעסקים מקומיים בישראל. אפס דמי הקמה, הכל כלול במנוי חודשי.",
    url: "https://arzac.studio",
    siteName: "Arzac Studio",
    locale: "he_IL",
    alternateLocale: ["en_US", "es_ES", "ru_RU", "ar_SA"],
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Arzac Studio — אתר + CRM + סוכן וואטסאפ AI לעסקים מקומיים בישראל" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arzac Studio — בניית אתר לעסק עם CRM וסוכן וואטסאפ AI",
    description: "אתר + CRM + סוכן וואטסאפ AI לעסקים מקומיים בישראל. אפס דמי הקמה, הכל כלול במנוי חודשי.",
    images: ["/og.png"],
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
    <html lang="he" className={inter.className}>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
