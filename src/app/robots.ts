import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/clients/", "/dashboard/", "/api/", "/pago/", "/onboarding/status/"],
      },
    ],
    sitemap: "https://arzac.studio/sitemap.xml",
  };
}
