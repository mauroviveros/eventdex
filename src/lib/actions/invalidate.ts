import { updateTag } from "next/cache";
import { ORGANIZATIONS_TAG } from "@/lib/data/public";

/**
 * Drops the cached host → organization lookups, so the public app sees an org
 * or domain change right away. Call it from every Server Action that changes
 * an organization (name, brand, status) or its domains.
 */
export function invalidateOrganizations() {
  updateTag(ORGANIZATIONS_TAG);
}
