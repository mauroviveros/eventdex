import { AlertIcon } from "@/components/pixel/AlertIcon";
import { PixelIcon } from "@/components/pixel/icons";
import { Sprite } from "@/components/pixel/Sprite";
import { EmailSignIn } from "@/components/ui/EmailSignIn";
import { GoogleSignIn } from "@/components/ui/GoogleSignIn";
import type { SpotType } from "@/domain/spots";

type Props = {
  spot: { name: string; code: string; type: SpotType };
  /** This page, to come back to and claim the medal. */
  next: string;
  /** Google sent back an error (`?error=auth`): say so above the button, to retry. */
  failed?: boolean;
  /** 1 on /s/[id]; lower where it sits under other headings (the catalog). */
  headingLevel?: 1 | 2 | 3;
};

/**
 * /s/[id] without a session: the stand's medal under a padlock, and one button.
 * Locked, it is always the sprite of its type in silhouette; the logo is what
 * the celebration reveals once the page claims it, back from Google.
 */
export function LockedMedal({
  spot,
  next,
  failed = false,
  headingLevel = 1,
}: Props) {
  const Heading = `h${headingLevel}` as const;
  return (
    <article className="panel grid w-full max-w-sm gap-6 px-6 py-8">
      <div className="grid justify-items-center gap-4 text-center">
        <Heading className="font-wide text-title">¡Bien ahí!</Heading>
        <div className="relative">
          <div className="grid size-40 place-items-center border-2 border-dashed border-lcd-2">
            <Sprite
              type={spot.type}
              scale={11}
              mode="silueta"
              label="Medalla bloqueada"
            />
          </div>
          <span className="absolute -right-4 -bottom-4 grid size-12 place-items-center border-2 border-lcd-3 bg-plate text-lcd-3 shadow-plate">
            <PixelIcon name="candado" size={32} />
          </span>
        </div>
        <div className="grid gap-1">
          <p className="text-px-3 text-balance font-display">{spot.name}</p>
          <p className="font-display text-px-1 text-muted-foreground">
            {spot.code}
          </p>
        </div>
        <p>Desbloqueala con un toque: entrás con Google y es tuya.</p>
      </div>
      {failed && (
        <p role="alert" className="flex items-start gap-2 text-danger">
          <span className="mt-1">
            <AlertIcon />
          </span>
          No pudimos completar el ingreso. Probá de nuevo: la medalla te sigue
          esperando.
        </p>
      )}
      <GoogleSignIn next={next} className="w-full">
        Ingresá con Google para sumarla
      </GoogleSignIn>
      {process.env.NODE_ENV !== "production" && <EmailSignIn next={next} />}
    </article>
  );
}
