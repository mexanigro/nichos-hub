import type { MetadataRoute } from "next";

// Solo la landing pública (/, /privacy, /terms) debe indexarse.
// El resto son rutas del dashboard/funnel detrás de auth o de checkout.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/clients/",
          "/dashboard/",
          "/pago/",
          "/onboarding/",
          "/login",
          "/mi-cuenta",
          "/asistente",
          "/seguimiento",
          "/messages",
          "/payments",
          "/monitor",
          "/sales",
          "/expenses",
          "/api-costs",
        ],
      },
    ],
    sitemap: "https://arzac.studio/sitemap.xml",
  };
}
