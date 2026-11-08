import type { CountdownState } from "@/domain/events";

/** Time until the next session, in the event's local time. */
export function Countdown({ state }: { state: CountdownState }) {
  if (state.kind === "en-curso") {
    return (
      <p className="grid gap-1">
        <span className="font-display text-px-3">En curso</span>
        <span className="text-muted-foreground">
          Termina a las {state.endsAt}
        </span>
      </p>
    );
  }
  if (state.kind === "finalizado") {
    return (
      <p className="grid gap-1">
        <span className="font-display text-px-3 text-muted-foreground">
          Finalizado
        </span>
        <span className="text-muted-foreground">Gracias por venir.</span>
      </p>
    );
  }
  const units = (
    state.days > 0
      ? [
          [state.days, "días"],
          [state.hours, "horas"],
        ]
      : [
          [state.hours, "horas"],
          [state.minutes, "min"],
        ]
  ) as [number, string][];
  return (
    <p className="grid gap-2">
      <span className="text-muted-foreground">Arranca en</span>
      <span className="flex gap-3">
        {units.map(([value, unit]) => (
          <span
            key={unit}
            className="grid justify-items-center border-2 border-lcd-3 px-3 py-2"
          >
            <span className="font-display text-px-3 tabular-nums">
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
