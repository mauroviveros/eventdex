/**
 * Normaliza el parámetro `next` de un redirect post-login a una ruta interna
 * segura. Rechaza URLs absolutas y protocol-relative (open redirect).
 */
export const resolveSafeNextPath = (next: string | null) => {
  if (!next) return "/";
  if (!next.startsWith("/")) return "/";
  if (next.startsWith("//")) return "/";
  return next;
};
