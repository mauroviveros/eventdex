import Link from "next/link";
import { Logo } from "@/components/pixel/Logo";
import { Monogram } from "@/components/ui/Monogram";
import { logoUrl } from "@/lib/data/organizations";

/** The org's mark at the head of its public app: logo (or monogram) and name, back to the home. */
export function OrgBrand({
  org,
}: {
  org: { name: string; logo_path: string | null };
}) {
  return (
    <Link
      href="/"
      className="flex min-h-11 min-w-0 items-center gap-3 font-display text-px-2 no-underline"
    >
      {org.logo_path ? (
        <Logo
          src={logoUrl(org.logo_path)}
          mode="lleno"
          label=""
          className="size-10 shrink-0 object-contain"
        />
      ) : (
        <Monogram text={org.name} />
      )}
      <span className="truncate">{org.name}</span>
    </Link>
  );
}
