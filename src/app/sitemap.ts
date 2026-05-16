import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://arzac.studio", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://arzac.studio/mi-cuenta", lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];
}
