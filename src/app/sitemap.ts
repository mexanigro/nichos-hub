import type { MetadataRoute } from "next";

// lastModified fijo: actualizar manualmente cuando cambia el contenido.
// new Date() en cada build hace que Google desconfíe del lastmod.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://arzac.studio", lastModified: new Date("2026-06-11"), changeFrequency: "weekly", priority: 1 },
    { url: "https://arzac.studio/privacy", lastModified: new Date("2026-01-15"), changeFrequency: "yearly", priority: 0.2 },
    { url: "https://arzac.studio/terms", lastModified: new Date("2026-01-15"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
