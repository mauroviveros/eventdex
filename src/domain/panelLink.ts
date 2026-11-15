import { publicOrigin } from "./spots";

/**
 * The raffle of an event in the panel. The panel lives only on the root domain
 * (on an organization's own host `/panel` is a 404), so from the public app the
 * link has to be absolute.
 */
export function raffleLink(
  rootDomain: string,
  orgSlug: string,
  eventSlug: string,
) {
  const path = `/panel/${encodeURIComponent(orgSlug)}/eventos/${encodeURIComponent(eventSlug)}`;
  return `${publicOrigin(rootDomain)}${path}?tab=sorteo`;
}
