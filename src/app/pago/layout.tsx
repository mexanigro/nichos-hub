import type { Metadata } from "next";
import { Outfit, Source_Sans_3 } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pago — Arzac Studio",
  description: "Complete your subscription payment",
  robots: { index: false, follow: false },
};

export default function PagoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${outfit.variable} ${sourceSans.variable} pago-page`}>
      {children}
    </div>
  );
}
