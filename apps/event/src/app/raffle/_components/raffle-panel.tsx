"use client";

import { CelebrationConfetti } from "@/components/celebration-confetti";
import { Button } from "@/components/ui/button";
import type { RaffleParticipant } from "@/types";
import { ParticipantsPanel } from "./participants-panel";
import { useRaffleDraw } from "./use-raffle-draw";
import { WinnerPanel } from "./winner-panel";

export function RafflePanel({
  participants,
}: {
  participants: RaffleParticipant[];
}) {
  const { winner, isDrawing, isPersistedWinner, displayUser, draw, reset } =
    useRaffleDraw(participants);

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ParticipantsPanel participants={participants} />
        <WinnerPanel
          displayUser={displayUser}
          winner={winner}
          isDrawing={isDrawing}
        />
      </div>

      <Button
        onClick={draw}
        disabled={isDrawing || participants.length === 0 || !!winner}
        className="w-full h-12 font-press-start text-lg"
      >
        {isDrawing ? "Sorteando..." : "INICIAR SORTEO"}
      </Button>

      {winner && (
        <>
          {/* Celebra solo un ganador recién sorteado, no uno recuperado de storage. */}
          {!isPersistedWinner && <CelebrationConfetti trigger />}
          <Button
            onClick={reset}
            variant="outline"
            className="w-full font-press-start"
          >
            Nuevo sorteo
          </Button>
        </>
      )}
    </div>
  );
}
