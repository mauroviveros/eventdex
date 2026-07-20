import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Rutas privadas (auth/QR): no tiene sentido rastrearlas.
      disallow: ["/perfil", "/raffle", "/spot/", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
