import { DateTime } from "luxon";
import { Countdown } from "@/components/countdown";
import { Card, CardContent } from "@/components/ui/card";
import { SpotActions } from "./spot-actions";

interface SpotInactiveProps {
  /** true = el evento todavía no empezó; false = ya finalizó. */
  eventHasNotStartedYet: boolean;
  /** Inicio del primer horario, para la cuenta regresiva (si aún no empezó). */
  startDatetime?: string;
}

/** Vista cuando el spot existe pero el evento no está activo (aún no empezó o ya terminó). */
export function SpotInactive({
  eventHasNotStartedYet,
  startDatetime,
}: SpotInactiveProps) {
  return (
    <section className="flex flex-col gap-4 min-h-[calc(100dvh-5rem)] items-center justify-center px-4 py-8">
      <Card className="highlight w-full max-w-2xl" variant="pixel">
        <CardContent className="flex flex-col items-center justify-center space-y-4 px-4 py-10 text-center">
          <h2 className="font-press-start text-2xl text-secondary">
            {eventHasNotStartedYet
              ? "El evento todavía no comenzó"
              : "El evento finalizo"}
          </h2>
          <p className="max-w-md text-lg text-muted-foreground">
            {eventHasNotStartedYet
              ? "Volvé más tarde para participar."
              : "¡Gracias por participar!"}
          </p>
          {eventHasNotStartedYet && startDatetime && (
            <Countdown
              start_datetime={startDatetime}
              initial={DateTime.now().toMillis()}
            />
          )}
        </CardContent>
      </Card>

      <SpotActions />
    </section>
  );
}
