import { PixelIcon } from "@/components/pixel/icons";
import { Sprite } from "@/components/pixel/Sprite";
import { EmailSignIn } from "@/components/ui/EmailSignIn";
import { GoogleSignIn } from "@/components/ui/GoogleSignIn";
import type { SpotType } from "@/domain/spots";

type Props = {
  spot: { name: string; code: string; type: SpotType };
  /** This page, to come back to and claim the medal. */
  next: string;
};

/**
 * /s/[id] without a session: the stand's medal under a padlock, and one button.
 * Locked, it is always the sprite of its type in silhouette; the logo is what
 * the celebration reveals once the page claims it, back from Google.
 */
export function LockedMedal({ spot, next }: Props) {
  return (
    <article className="panel grid w-full max-w-sm gap-6 px-6 py-8">
      <div className="grid justify-items-center gap-4 text-center">
        <h1 className="font-wide text-title">¡Bien ahí!</h1>
        <div className="relative">
          <div className="grid size-40 place-items-center border-2 border-dashed border-lcd-2">
            <Sprite type={spot.type} scale={11} mode="silueta" label="" />
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
      <GoogleSignIn next={next} className="w-full">
        Ingresá con Google para sumarla
      </GoogleSignIn>
      {process.env.NODE_ENV !== "production" && <EmailSignIn next={next} />}
    </article>
  );
}
