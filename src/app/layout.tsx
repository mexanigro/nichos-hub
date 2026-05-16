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
  alternates: { canonical: "/" },
  openGraph: {
    title: "Arzac Studio — Websites for Local Businesses",
    description: "Website + CRM + AI WhatsApp agent. Ready in 3 minutes.",
    url: "https://arzac.studio",
    siteName: "Arzac Studio",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Arzac Studio" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arzac Studio — Websites for Local Businesses",
    description: "Website + CRM + AI WhatsApp agent. Ready in 3 minutes.",
    images: ["/og-image.jpg"],
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
