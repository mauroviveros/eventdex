"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/Field";
import { frameDelay, STAGE_FRAMES, stageFrames } from "@/domain/raffles";
import { drawOnStageAction } from "@/lib/actions/raffles";

export type Stage =
  | { kind: "idle" }
  | { kind: "drawing"; shown: string }
  | { kind: "won"; name: string; number: number }
  | { kind: "error"; message: string };

// shortcut: lists the first names that fit on one screen, add columns or paging if a raffle has thousands
const MAX_LISTED = 120;

// The server may have drawn before the connection dropped: never just say "try again".
const LOST =
  "Se cortó la conexión y no sabemos si salió el sorteo. Mirá la pestaña Sorteo antes de probar de nuevo.";

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * The raffle for the stage: the names on show, a button, and the winner in big
 * letters. The server draws (draw_raffle); the names that go by are only
 * scenery and the screen lands on the name it answered with. With reduced
 * motion it lands at once.
 */
export function RaffleStage({
  raffleId,
  names,
  canDraw,
  initial = { kind: "idle" },
}: {
  raffleId: string;
  names: string[];
  canDraw: boolean;
  /** Where it starts: only the catalog needs another place than the beginning. */
  initial?: Stage;
}) {
  const [stage, setStage] = useState<Stage>(initial);
  const id = useId();
  const router = useRouter();
  // A draw can't be undone: a second tap before the first ends must do nothing.
  const running = useRef(false);
  const winnerText = useRef<HTMLParagraphElement>(null);
  const focusWinner = useRef(false);
  // The list as it was when the draw began: the winner leaves it once it lands.
  const [frozen, setFrozen] = useState<string[] | null>(null);
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
  const listed = frozen ?? names;

  async function draw() {
    if (running.current) return;
    running.current = true;
    try {
      const snapshot = names;
      setFrozen(snapshot);
      setStage({ kind: "drawing", shown: snapshot[0] ?? "" });

      let refused = false;
      const request = drawOnStageAction(raffleId)
        .catch(() => ({ ok: false as const, error: LOST, lost: true }))
        .then((result) => {
          refused = !result.ok;
          return result;
        });

      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced) {
        for (const [i, name] of stageFrames(snapshot, STAGE_FRAMES).entries()) {
          // A refusal stops the show: there is no winner to wait for.
          if (refused || !mounted.current) break;
          setStage({ kind: "drawing", shown: name });
          await sleep(frameDelay(i));
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
        });
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
    <div className="grid gap-10">
      <section
        aria-labelledby={`${id}-escenario`}
        className="grid justify-items-center gap-6 border-2 border-lcd-3 px-4 py-10 text-center sm:px-10 sm:py-16"
      >
        <h2 id={`${id}-escenario`} className="sr-only">
          Sorteo
        </h2>
        <div className="grid min-h-44 w-full place-items-center">
          {stage.kind === "drawing" ? (
            // What goes by is not read out: only the winner is.
            <p
              aria-hidden
              className="font-display text-px-3 wrap-anywhere sm:text-px-4 lg:text-px-5"
            >
              {stage.shown}
            </p>
          ) : stage.kind === "won" ? (
            <div className="grid gap-4">
              <p className="font-display text-px-1">
                Extracción {stage.number.toLocaleString("es-AR")}
              </p>
              <p
                ref={winnerText}
                tabIndex={-1}
                className="font-display text-px-3 wrap-anywhere focus:outline-none sm:text-px-4 lg:text-px-5"
              >
                {stage.name}
              </p>
            </div>
          ) : (
            <p className="font-display text-px-2 text-muted-foreground sm:text-px-3">
              {names.length === 0
                ? "Nadie para sortear por ahora"
                : "Listo para sortear"}
            </p>
          )}
        </div>

        {/* Always mounted: a live region added along with its content stays silent. */}
        <p role="status" className="sr-only">
          {stage.kind === "drawing" && "Sorteando."}
          {stage.kind === "won" && `Ganador: ${stage.name}`}
        </p>

        {stage.kind === "error" && (
          <FormMessage tone="error">{stage.message}</FormMessage>
        )}

        {/* The frozen list, so the button stays (pending) while the draw runs. */}
        {canDraw && listed.length > 0 && (
          <Button
            onClick={draw}
            pending={drawing}
            pendingLabel="Sorteando…"
            className="min-h-14 px-8 text-px-2"
          >
            {stage.kind === "won" ? "Sortear otro" : "Sortear"}
          </Button>
        )}
      </section>

      {listed.length > 0 && (
        <section aria-labelledby={`${id}-participantes`} className="grid gap-4">
          <h2 id={`${id}-participantes`} className="text-px-2">
            Participan {listed.length.toLocaleString("es-AR")}
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-lg">
            {listed.slice(0, MAX_LISTED).map((name, i) => (
              // Public names repeat ("Ana G."): the position is the identity.
              // biome-ignore lint/suspicious/noArrayIndexKey: names can repeat
              <li key={i}>{name}</li>
            ))}
          </ul>
          {listed.length > MAX_LISTED && (
            <p className="text-muted-foreground">
              y {(listed.length - MAX_LISTED).toLocaleString("es-AR")} más
            </p>
          )}
        </section>
      )}
    </div>
  );
}
