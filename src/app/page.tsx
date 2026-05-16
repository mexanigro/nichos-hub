import { Outfit, Source_Sans_3 } from "next/font/google";
import { LandingPage } from "@/components/landing/landing-page";

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

export const metadata = {
  title: "Arzac Studio — Professional websites for local businesses",
  description:
    "Custom website, smart CRM, and AI WhatsApp agent for your business — set up in minutes. From 790 NIS/month.",
};

export default function Page() {
  return (
    <div className={`${outfit.variable} ${sourceSans.variable}`}>
      <LandingPage />
    </div>
  );
}
