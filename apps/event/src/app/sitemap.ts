import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

// Solo la landing es pública/indexable; el resto de rutas están detrás de
// login o QR, así que no van al sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
