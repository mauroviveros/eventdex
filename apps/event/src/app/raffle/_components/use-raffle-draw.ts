import { useEffect, useState } from "react";
import type { RaffleParticipant } from "@/types";

const STORAGE_KEY = "raffle_winner";

/**
 * Lógica del sorteo: mantiene el ganador (persistido en localStorage para
 * sobrevivir recargas), corre la animación de selección ponderada por cantidad
 * de spots, y expone el candidato mostrado en cada frame del sorteo.
 */
export function useRaffleDraw(participants: RaffleParticipant[]) {
  const [winner, setWinner] = useState<RaffleParticipant | null>(null);
  const [currentCandidate, setCurrentCandidate] =
    useState<RaffleParticipant | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  // Distingue un ganador recién sorteado de uno recuperado de localStorage
  // (este último no vuelve a disparar la celebración).
  const [isPersistedWinner, setIsPersistedWinner] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setWinner(JSON.parse(raw) as RaffleParticipant);
        setIsPersistedWinner(true);
      }
    } catch (err) {
      console.error("Error leyendo ganador guardado:", err);
    }
  }, []);

  useEffect(() => {
    try {
      if (winner) localStorage.setItem(STORAGE_KEY, JSON.stringify(winner));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error("Error guardando ganador:", err);
    }
  }, [winner]);

  const draw = () => {
    if (participants.length === 0) return;

    setIsDrawing(true);
    setWinner(null);
    setCurrentCandidate(null);

    // Cada usuario recibe tantas "boletas" como spots haya coleccionado.
    const tickets = participants.flatMap((participant) =>
      Array.from({ length: participant.spot_count }, () => participant),
    );

    // Animación visual: arranca lenta y acelera hacia el final.
    const totalIterations = 80;
    let iteration = 0;

    const step = () => {
      const candidate = tickets[Math.floor(Math.random() * tickets.length)];
      setCurrentCandidate(candidate);
      iteration++;

      if (iteration >= totalIterations) {
        setWinner(candidate);
        setIsPersistedWinner(false);
        setCurrentCandidate(null);
        setIsDrawing(false);
        return;
      }

      const progress = iteration / totalIterations;
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      const delay = 10 + (1 - easeOutQuad) * 120;
      setTimeout(step, delay);
    };

    step();
  };

  const reset = () => {
    setWinner(null);
    setCurrentCandidate(null);
    setIsDrawing(false);
    setIsPersistedWinner(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return {
    winner,
    isDrawing,
    isPersistedWinner,
    displayUser: winner ?? currentCandidate,
    draw,
    reset,
  };
}
