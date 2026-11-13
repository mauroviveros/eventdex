"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { PixelIcon } from "@/components/pixel/icons";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/Field";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  frameDelay,
  type Participant,
  STAGE_FRAMES,
  stageFrames,
} from "@/domain/raffles";
import { drawOnStageAction } from "@/lib/actions/raffles";
import { lcdConfetti } from "@/lib/confetti";

export type Stage =
  | { kind: "idle" }
  // `frame` and `ms` make each name that goes by a new element that fades in
  // and out for as long as it stays.
  | { kind: "drawing"; shown: Participant; frame: number; ms: number }
  | {
      kind: "won";
      name: string;
      number: number;
      claims: number | null;
      avatarUrl: string | null;
    }
  | { kind: "error"; message: string };

// shortcut: lists the first names that fit in a few lines, page them if a raffle has thousands
const MAX_LISTED = 120;

// Medals drawn as squares: past this they would be a wall, the number says the rest.
const MAX_PIPS = 12;

// The server may have drawn before the connection dropped: never just say "try again".
const LOST =
  "Se cortó la conexión y no sabemos si salió el sorteo. Mirá la pestaña Sorteo antes de probar de nuevo.";

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const medals = (n: number) =>
  `${n.toLocaleString("es-AR")} ${n === 1 ? "medalla" : "medallas"}`;

/** The face on the plate: ink on paper, so it stands out from the ink ground. */
function Face({
  name,
  src,
  className = "",
}: {
  name: string;
  src: string | null;
  className?: string;
}) {
  return (
    <UserAvatar
      name={name}
      src={src}
      size="xl"
      className={`size-36 border-2 border-lcd-0 sm:size-56 ${className}`}
      fallbackClassName="bg-lcd-0 text-lcd-3"
    />
  );
}

/**
 * The raffle for the stage: a plate where the draw happens (faces fading by,
 * then the winner with confetti), a button, and below it, plainly, who took
 * part. The server draws (draw_raffle); the faces that go by are only scenery
 * and the screen lands on the winner it answered with. With reduced motion it
 * lands at once, without confetti.
 */
export function RaffleStage({
  raffleId,
  participants,
  canDraw,
  initial = { kind: "idle" },
}: {
  raffleId: string;
  participants: Participant[];
  canDraw: boolean;
  /** Where it starts: only the catalog needs another place than the beginning. */
  initial?: Stage;
}) {
  const [stage, setStage] = useState<Stage>(initial);
  const id = useId();
  const router = useRouter();
  // A draw can't be undone: a second tap before the first ends must do nothing.
  const running = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const winnerText = useRef<HTMLParagraphElement>(null);
  const focusWinner = useRef(false);
  // The list as it was when the draw began: the winner leaves it once it lands.
  const [frozen, setFrozen] = useState<Participant[] | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // When the button goes away (nobody left to draw) the focus goes to the winner.
  useEffect(() => {
    if (stage.kind === "won" && focusWinner.current) {
      focusWinner.current = false;
      winnerText.current?.focus();
    }
  }, [stage]);

  const drawing = stage.kind === "drawing";
  const listed = frozen ?? participants;

  async function draw() {
    if (running.current) return;
    running.current = true;
    try {
      const snapshot = participants;
      setFrozen(snapshot);
      const first = snapshot[0];
      if (first) {
        setStage({
          kind: "drawing",
          shown: first,
          frame: 0,
          ms: frameDelay(0),
        });
      }

      let refused = false;
      const request = drawOnStageAction(raffleId)
        .catch(() => ({ ok: false as const, error: LOST, lost: true }))
        .then((result) => {
          refused = !result.ok;
          return result;
        });

      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced) {
        for (const [i, who] of stageFrames(snapshot, STAGE_FRAMES).entries()) {
          // A refusal stops the show: there is no winner to wait for.
          if (refused || !mounted.current) break;
          const ms = frameDelay(i);
          setStage({ kind: "drawing", shown: who, frame: i, ms });
          await sleep(ms);
        }
      }

      const result = await request;
      if (!mounted.current) return;
      setFrozen(null);
      if (result.ok) {
        focusWinner.current = true;
        setStage({
          kind: "won",
          name: result.data.name,
          number: result.data.drawNumber,
          claims: result.data.claims,
          avatarUrl: result.data.avatarUrl,
        });
        if (!reduced && root.current) void lcdConfetti(root.current);
      } else {
        setStage({ kind: "error", message: result.error });
        // If it did go through, the winner is gone from the list once it reloads.
        if ("lost" in result) router.refresh();
      }
    } finally {
      running.current = false;
    }
  }

  return (
    <div ref={root} className="grid gap-8">
      <section
        aria-labelledby={`${id}-escenario`}
        // Re-keyed on the win so the pulsing frame plays once per winner.
        key={stage.kind === "won" ? `won-${stage.number}` : "plate"}
        style={{ outline: "2px solid var(--lcd-0)", outlineOffset: -12 }}
        className={`grid min-h-[28rem] content-between gap-8 bg-primary p-8 text-primary-foreground sm:p-12 ${
          stage.kind === "won" ? "stage-frame" : ""
        }`}
      >
        <h2 id={`${id}-escenario`} className="sr-only">
          Sorteo
        </h2>

        <div className="grid place-items-center">
          {stage.kind === "drawing" ? (
            // What goes by is not read out: only the winner is.
            <div
              key={stage.frame}
              aria-hidden
              style={{ "--frame-ms": `${stage.ms}ms` } as React.CSSProperties}
              className="stage-pass grid w-full items-center gap-8 sm:grid-cols-[auto_1fr]"
            >
              <Face name={stage.shown.name} src={stage.shown.avatarUrl} />
              <p className="font-display text-px-4 wrap-anywhere">
                {stage.shown.name}
              </p>
            </div>
          ) : stage.kind === "won" ? (
            <div className="grid w-full items-center gap-8 sm:grid-cols-[auto_1fr]">
              <Face
                name={stage.name}
                src={stage.avatarUrl}
                className="stage-pop"
              />
              <div className="grid gap-4">
                <p
                  ref={winnerText}
                  tabIndex={-1}
                  className="stage-reveal font-display text-px-4 wrap-anywhere focus:outline-none sm:text-px-5"
                >
                  {stage.name}
                </p>
                <p className="text-lg">
                  Ganador n.º {stage.number.toLocaleString("es-AR")}
                </p>
                {stage.claims !== null && (
                  <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-lg">
                    <span className="inline-flex gap-1" aria-hidden>
                      {Array.from(
                        { length: Math.min(stage.claims, MAX_PIPS) },
                        (_, i) => i,
                      ).map((i) => (
                        <span
                          key={i}
                          style={{ "--i": i } as React.CSSProperties}
                          className="stage-pip size-4 bg-lcd-0"
                        />
                      ))}
                    </span>
                    {medals(stage.claims)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid justify-items-center gap-5 text-center">
              <PixelIcon name="trofeo" size={128} />
              <p className="font-display text-px-3 wrap-anywhere">
                {participants.length === 0
                  ? "Nadie para sortear por ahora"
                  : "Presioná el botón para comenzar el sorteo"}
              </p>
            </div>
          )}
        </div>

        {/* Always mounted: a live region added along with its content stays silent. */}
        <p role="status" className="sr-only">
          {stage.kind === "drawing" && "Sorteando."}
          {stage.kind === "won" && `Ganador: ${stage.name}`}
        </p>

        {/* The frozen list, so the button stays (pending) while the draw runs. */}
        {canDraw && listed.length > 0 && (
          <Button
            onClick={draw}
            pending={drawing}
            pendingLabel="Sorteando…"
            className="min-h-14 w-full border-lcd-0 bg-lcd-0 px-8 text-px-2 text-lcd-3 hover:border-lcd-1 hover:bg-lcd-1"
          >
            {stage.kind === "won" ? "Sortear otro" : "Sortear"}
          </Button>
        )}
      </section>

      {stage.kind === "error" && (
        <FormMessage tone="error">{stage.message}</FormMessage>
      )}

      {listed.length > 0 && (
        <section aria-labelledby={`${id}-participantes`} className="grid gap-3">
          <h2 id={`${id}-participantes`} className="text-px-2">
            Participaron {listed.length.toLocaleString("es-AR")}
          </h2>
          {/* Names only: no medals, no photos. Who took part, not who has more. */}
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-lg text-muted-foreground">
            {listed.slice(0, MAX_LISTED).map((who, i) => (
              <li
                // Public names repeat ("Ana G."): the position is the identity.
                // biome-ignore lint/suspicious/noArrayIndexKey: names can repeat
                key={i}
              >
                {who.name}
              </li>
            ))}
            {listed.length > MAX_LISTED && (
              <li>
                y {(listed.length - MAX_LISTED).toLocaleString("es-AR")} más
              </li>
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
