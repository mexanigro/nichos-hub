import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://arzac.studio", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://arzac.studio/privacy", lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: "https://arzac.studio/terms", lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];
}
