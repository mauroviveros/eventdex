export type Surface =
  | { kind: "landing" }
  | { kind: "admin" }
  | { kind: "publica"; host: string };

/**
 * Decides which surface serves a request from its Host header.
 * `rootDomain` includes the port in local development (`localhost:3000`).
 */
export function surfaceFor(
  host: string,
  rootDomain: string,
  adminHost: string,
): Surface {
  const h = host.toLowerCase();
  const root = rootDomain.toLowerCase();
  if (h === root || h === `www.${root}`) return { kind: "landing" };
  if (h === adminHost.toLowerCase()) return { kind: "admin" };
  return { kind: "publica", host: h };
}

/** Internal path the proxy rewrites to. These folders are never reached directly. */
export function internalPath(surface: Surface, pathname: string): string {
  const rest = pathname === "/" ? "" : pathname;
  if (surface.kind === "publica") {
    return `/publica/${encodeURIComponent(surface.host)}${rest}`;
  }
  return `/${surface.kind}${rest}`;
}
