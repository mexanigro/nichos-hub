import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Arzac Studio",
    short_name: "Arzac",
    description:
      "אתר מקצועי + CRM + סוכן וואטסאפ AI לעסקים מקומיים בישראל. אפס דמי הקמה, הכל כלול במנוי חודשי.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    lang: "he",
    dir: "rtl",
    icons: [
      { src: "/logo-icon.png", sizes: "any", type: "image/png" },
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
  };
}
