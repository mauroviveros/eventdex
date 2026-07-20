import Image from "next/image";
import { CelebrationConfetti } from "@/components/celebration-confetti";
import { Card, CardContent } from "@/components/ui/card";
import { SpotActions } from "./spot-actions";

interface SpotClaimedProps {
  name: string;
  avatarUrl: string;
  /** El usuario ya tenía la medalla antes de esta visita. */
  alreadyCollected: boolean;
  /** Se coleccionó en esta visita (dispara la celebración). */
  justCollected: boolean;
}

/** Vista de la medalla del spot: muestra el avatar y celebra si se acaba de obtener. */
export function SpotClaimed({
  name,
  avatarUrl,
  alreadyCollected,
  justCollected,
}: SpotClaimedProps) {
  return (
    <>
      <CelebrationConfetti trigger={justCollected} />
      <section className="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center px-1 py-8">
        <Card className="highlight w-full max-w-2xl">
          <CardContent className="space-y-6 px-2 py-8 flex flex-col items-center justify-center">
            {!alreadyCollected && (
              <div className="space-y-2 text-center">
                <h2 className="font-press-start text-2xl text-secondary">
                  ¡Medalla obtenida!
                </h2>
              </div>
            )}

            <picture className="size-32 flex items-center justify-center pixel-border-sm bg-linear-to-br from-medal-gold to-accent medal-glow">
              <Image
                src={avatarUrl}
                alt={name}
                width={128}
                height={128}
                className="size-full opacity-85"
                loading="eager"
                decoding="async"
              />
            </picture>

            <p className="font-press-start text-sm text-center text-foreground max-w-56 word-break">
              {name}
            </p>
          </CardContent>
        </Card>

        <SpotActions />
      </section>
    </>
  );
}
