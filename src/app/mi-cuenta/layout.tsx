import { Instrument_Serif } from "next/font/google";

// La serif de la marca («Arzac studio»), la misma que cargan la landing y /pago.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-at-serif",
  display: "swap",
});

export default function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  return <div className={instrumentSerif.variable}>{children}</div>;
}
