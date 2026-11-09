"use client";

import { useState } from "react";
import { Chevron } from "@/components/pixel/Chevron";
import { Sprite } from "@/components/pixel/Sprite";
import type { SpotType } from "@/domain/spots";

// Synthetic stands, only to try the mechanic.
const STANDS: { code: string; name: string; type: SpotType }[] = [
  { code: "A01", name: "Café de la Esquina", type: "stand" },
  { code: "A02", name: "Rueda gigante", type: "attraction" },
  { code: "A03", name: "Banco del Parque", type: "sponsor" },
  { code: "A04", name: "Taller de cerámica", type: "activity" },
  { code: "A05", name: "Dulces del Sur", type: "stand" },
];

const STATUS = {
  new: "¡Medalla nueva!",
  repeat: "Esta ya la tenías",
  pending: "Todavía no la tenés",
};

const PAD = [
  {
    label: "Subir al stand anterior",
    step: -1,
    cell: "col-start-2 row-start-1",
    icon: "rotate-180",
  },
  {
    label: "Stand anterior",
    step: -1,
    cell: "col-start-1 row-start-2",
    icon: "rotate-90",
  },
  {
    label: "Stand siguiente",
    step: 1,
    cell: "col-start-3 row-start-2",
    icon: "-rotate-90",
  },
  {
    label: "Bajar al stand siguiente",
    step: 1,
    cell: "col-start-2 row-start-3",
    icon: "",
  },
] as const;

/** A handheld that plays the visitor's loop: walk to a stand, scan it, get the medal. */
export function ConsoleDemo() {
  const [selected, setSelected] = useState(2);
  const [claimed, setClaimed] = useState<ReadonlySet<number>>(
    new Set([0, 1, 2]),
  );
  const [status, setStatus] = useState<keyof typeof STATUS>("new");
  // Remounts the sprite so a new medal develops again.
  const [scans, setScans] = useState(0);

  const stand = STANDS[selected];
  if (!stand) return null;
  const owned = claimed.has(selected);

  function move(step: number) {
    const next = (selected + step + STANDS.length) % STANDS.length;
    setSelected(next);
    setStatus(claimed.has(next) ? "repeat" : "pending");
  }

  function scan() {
    setScans((n) => n + 1);
    if (owned) {
      setStatus("repeat");
      return;
    }
    setClaimed(new Set(claimed).add(selected));
    setStatus("new");
  }

  return (
    <section
      aria-label="Probá cómo se junta una medalla"
      className="w-full max-w-[32.5rem] border-2 border-b-0 border-lcd-3 bg-lcd-0 px-5 pt-5 pb-12 sm:px-10 sm:pt-10 sm:pb-20"
    >
      <div className="bg-lcd-2 p-4 sm:p-6">
        <div className="grid min-h-[25rem] content-between justify-items-center gap-3 border-2 border-lcd-3 bg-lcd-0 p-4 text-center sm:p-6">
          <p className="font-display text-px-1">
            {stand.code} · {stand.name}
          </p>
          <div
            className={`grid size-36 place-items-center border-2 ${
              owned ? "border-lcd-3" : "border-dashed border-lcd-2"
            } ${status === "new" ? "bg-lcd-1" : ""}`}
          >
            <Sprite
              key={`${selected}-${scans}`}
              type={stand.type}
              scale={9}
              mode={
                !owned ? "silueta" : status === "new" ? "revelando" : "lleno"
              }
              label={stand.name}
            />
          </div>
          <p aria-live="polite" className="font-display text-px-3">
            {STATUS[status]}
            <span className="sr-only"> {stand.name}</span>
          </p>
          <div className="grid justify-items-center gap-2">
            <div aria-hidden className="flex gap-2">
              {STANDS.map((s, i) => (
                <span
                  key={s.code}
                  className={`grid size-8 place-items-center border-2 sm:size-10 ${
                    claimed.has(i)
                      ? "border-lcd-3"
                      : "border-dashed border-lcd-2"
                  }`}
                >
                  {claimed.has(i) && (
                    <Sprite type={s.type} scale={2} label="" />
                  )}
                </span>
              ))}
            </div>
            <p className="font-display text-px-1">
              {claimed.size} de {STANDS.length} medallas
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between sm:mt-8">
        <div className="grid grid-cols-3 grid-rows-3">
          {PAD.map((arm) => (
            <button
              key={arm.label}
              type="button"
              aria-label={arm.label}
              onClick={() => move(arm.step)}
              className={`grid size-12 place-items-center bg-lcd-3 text-lcd-0 hover:bg-lcd-2 ${arm.cell}`}
            >
              <Chevron className={arm.icon} />
            </button>
          ))}
          <span
            aria-hidden
            className="col-start-2 row-start-2 size-12 bg-lcd-3"
          />
        </div>
        <div className="grid justify-items-center gap-2">
          <button
            type="button"
            onClick={scan}
            aria-label="Escanear el QR de este stand"
            className="grid size-20 place-items-center border-2 border-lcd-3 bg-accent-red font-display text-px-3 text-lcd-0 hover:bg-lcd-3"
          >
            A
          </button>
          <span aria-hidden className="font-display text-px-1">
            Escanear
          </span>
        </div>
      </div>
    </section>
  );
}
