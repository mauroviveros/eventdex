/**
 * URL base pública del sitio. Se usa para metadata absoluta (Open Graph,
 * canonical), el sitemap y el robots.
 *
 * En Vercel toma el dominio del deployment; `NEXT_PUBLIC_SITE_URL` lo sobreescribe
 * (útil para un dominio custom). Cae a localhost en desarrollo.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");
