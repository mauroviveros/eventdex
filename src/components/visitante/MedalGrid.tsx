import { Medal } from "@/components/visitante/Medal";
import type { SpotType } from "@/domain/spots";
import { spotLogoUrl } from "@/lib/data/organizations";

type Props = {
  spots: readonly {
    id: string;
    name: string;
    code: string;
    type: SpotType;
    logoPath: string | null;
  }[];
  /** The ids of the spots this visitor already has. */
  claimed: ReadonlySet<string>;
  label?: string;
};

/** A collection of medals: what the visitor has, and silhouettes for the rest. */
export function MedalGrid({ spots, claimed, label }: Props) {
  return (
    <ul
      aria-label={label}
      className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] justify-items-center gap-y-6"
    >
      {spots.map((s) => (
        <li key={s.id}>
          <Medal
            name={s.name}
            code={s.code}
            type={s.type}
            logo={spotLogoUrl(s.logoPath)}
            state={claimed.has(s.id) ? "conseguido" : "pendiente"}
          />
        </li>
      ))}
    </ul>
  );
}
