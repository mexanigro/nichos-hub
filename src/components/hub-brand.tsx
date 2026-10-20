import { Instrument_Serif } from "next/font/google";
import { LogoMark } from "@/components/landing/logo-mark";

// La marca de Arzac (la de la landing, Liam 2026-10-15) sobre el tema oscuro del hub.
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], display: "swap" });

export function HubBrand({ size = 18, textClass = "text-[17px]" }: { size?: number; textClass?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-text" style={{ ["--bg-circle" as string]: "var(--color-bg-card)" }}>
      <LogoMark size={size} color="currentColor" />
      <span className={`${serif.className} ${textClass} leading-none tracking-[-0.01em]`}>
        Arzac <em className="italic text-[#d8a484]">studio</em>
      </span>
    </span>
  );
}
