import { PixelIcon } from "@/components/pixel/icons";
import { AUTHOR } from "@/lib/author";

const LINK =
  "inline-flex min-h-11 items-center gap-2 no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2";

function Credit() {
  return (
    <a href={AUTHOR.url} target="_blank" rel="noopener" className={LINK}>
      Hecho con
      <span role="img" aria-label="amor" className="text-accent-red">
        <PixelIcon name="corazon" size={16} />
      </span>
      por {AUTHOR.name}
    </a>
  );
}

/**
 * The credit at the foot of the public app: "Hecho con ♥ por Mauro Viveros",
 * linking to the author's site (src/lib/author.ts). Quiet on purpose: the
 * organization's brand leads, this only signs the work.
 */
export function MadeWith() {
  return (
    <footer className="px-4 pb-10 pt-8 text-center font-display text-px-1 text-muted-foreground">
      <Credit />
    </footer>
  );
}
