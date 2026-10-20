import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Arzac Studio",
    short_name: "Arzac",
    description:
      "אתר מקצועי + CRM + התראות במייל לעסקים מקומיים בישראל. מנוי חודשי קבוע, הכל כלול.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    lang: "he",
    dir: "rtl",
    icons: [
      // La A del logo de la landing (LogoMark), en tinta sobre el fondo crema; src/app/icon.png es la misma.
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
