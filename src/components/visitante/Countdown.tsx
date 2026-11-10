import type { CountdownState } from "@/domain/events";

const CELL = "border-2 border-cell-rule bg-plate shadow-plate";

/** Time until the next session, in the event's local time. */
export function Countdown({ state }: { state: CountdownState }) {
  if (state.kind === "en-curso") {
    return (
      <p className={`grid justify-items-center gap-2 px-6 py-4 ${CELL}`}>
        <span className="font-wide text-title">En curso</span>
        <span className="text-muted-foreground">
          Termina a las {state.endsAt}
        </span>
      </p>
    );
  }
  if (state.kind === "finalizado") {
    return (
      <p className={`grid justify-items-center gap-2 px-6 py-4 ${CELL}`}>
        <span className="font-wide text-title text-muted-foreground">
          Finalizado
        </span>
        <span className="text-muted-foreground">Gracias por venir.</span>
      </p>
    );
  }
  const units: [number, string][] = [
    [state.days, "Días"],
    [state.hours, "Horas"],
    [state.minutes, "Minutos"],
  ];
  return (
    <p className="grid justify-items-center gap-3">
      <span className="font-display text-px-2">Arranca en</span>
      <span className="grid grid-cols-1 gap-2 min-[18rem]:grid-cols-3 sm:gap-3">
        {units.map(([value, unit]) => (
          <span
            key={unit}
            className={`grid justify-items-center gap-2 px-2 py-3 sm:px-3 ${CELL}`}
          >
            <span className="font-wide text-numeral tabular-nums">
              {String(value).padStart(2, "0")}
            </span>
            <span className="font-display text-px-1 text-muted-foreground">
              {unit}
            </span>
          </span>
        ))}
      </span>
    </p>
  );
}
