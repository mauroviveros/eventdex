type Surface = { kind: "raiz" } | { kind: "publica"; host: string };

/**
 * Decides which surface serves a request from its Host header.
 * `rootDomain` includes the port in local development (`localhost:3000`).
 * The root (`raiz`) serves the landing, /ingresar and, under /panel, the panel.
 * `deploymentHosts` are Vercel's own URLs for this deployment and branch: they
 * behave like the root, so the dashboard thumbnail and previews are not a 404.
 */
export function surfaceFor(
  host: string,
  rootDomain: string,
  deploymentHosts: (string | undefined)[] = [],
): Surface {
  const h = host.toLowerCase();
  const root = rootDomain.toLowerCase();
  if (h === root || h === `www.${root}`) return { kind: "raiz" };
  if (deploymentHosts.some((d) => d?.toLowerCase() === h)) {
    return { kind: "raiz" };
  }
  return { kind: "publica", host: h };
}

/**
 * Path the proxy rewrites to. The root host serves its folders as they are
 * (`(landing)/`, `ingresar/`, `panel/`); an organization's host goes to
 * `publica/[host]/`, which the root host must not reach directly.
 */
export function internalPath(surface: Surface, pathname: string): string {
  if (surface.kind === "publica") {
    const rest = pathname === "/" ? "" : pathname;
    return `/publica/${encodeURIComponent(surface.host)}${rest}`;
  }
  // A folder starting with _ is private in the app router: always a 404.
  if (pathname === "/publica" || pathname.startsWith("/publica/")) {
    return "/_publica";
  }
  return pathname;
}
