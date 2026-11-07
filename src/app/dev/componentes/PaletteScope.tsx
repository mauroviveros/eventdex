"use client";

import { type CSSProperties, type ReactNode, useState } from "react";
import { LcdFilters } from "@/components/pixel/LcdFilters";
import { EVENTDEX_HUE, ramp, rampFromHex } from "@/domain/palette";

// Synthetic organizations, only to show the palette swap.
const PRESETS = [
  { id: "eventdex", name: "Eventdex", ramp: ramp(EVENTDEX_HUE) },
  { id: "magenta", name: "Expo de ejemplo", ramp: rampFromHex("#d6336c") },
  { id: "azul", name: "Feria de ejemplo", ramp: rampFromHex("#1e66f5") },
] as const;

/** Applies a four-tone ramp to everything inside and lets you swap it. */
export function PaletteScope({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string>("eventdex");
  const [custom, setCustom] = useState("#e8590c");
  const [scheme, setScheme] = useState<"system" | "light" | "dark">("system");
  const tones =
    selected === "custom"
      ? rampFromHex(custom)
      : (PRESETS.find((p) => p.id === selected) ?? PRESETS[0]).ramp;

  const style = Object.fromEntries(
    tones.map((tone, i) => [`--ramp-${i}`, tone]),
  ) as CSSProperties;

  return (
    <div
      style={style}
      data-scheme={scheme === "system" ? undefined : scheme}
      className="ramp-scope min-h-dvh bg-lcd-0 text-lcd-3"
    >
      <LcdFilters ramp={tones} />
      {/* Sticky only where the switcher fits on one row; on phones it would eat the screen. */}
      <header className="z-10 border-b-2 border-lcd-3 bg-lcd-0 lg:sticky lg:top-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 sm:px-6">
          <fieldset className="flex items-center gap-1">
            <legend className="sr-only">Modo</legend>
            {(
              [
                ["system", "Sistema"],
                ["light", "Claro"],
                ["dark", "Oscuro"],
              ] as const
            ).map(([id, name]) => (
              <label
                key={id}
                className={`flex min-h-11 cursor-pointer items-center border-2 px-2 font-display text-px-1 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-lcd-3 ${
                  scheme === id
                    ? "border-lcd-3 bg-lcd-1"
                    : "border-transparent hover:border-lcd-2"
                }`}
              >
                <input
                  type="radio"
                  name="modo"
                  checked={scheme === id}
                  onChange={() => setScheme(id)}
                  className="sr-only"
                />
                {name}
              </label>
            ))}
          </fieldset>
          <fieldset className="flex items-center gap-1">
            <legend className="sr-only">Paleta</legend>
            {PRESETS.map((p) => (
              <Swatch
                key={p.id}
                checked={selected === p.id}
                onChange={() => setSelected(p.id)}
                label={p.name}
                tones={p.ramp}
              />
            ))}
            <Swatch
              checked={selected === "custom"}
              onChange={() => setSelected("custom")}
              label="Tu color"
              tones={rampFromHex(custom)}
            >
              <input
                type="color"
                value={custom}
                aria-label="Color de marca"
                onChange={(e) => {
                  setCustom(e.target.value);
                  setSelected("custom");
                }}
                className="size-6 cursor-pointer border-2 border-lcd-3 bg-transparent p-0"
              />
            </Swatch>
          </fieldset>
        </div>
      </header>
      {children}
    </div>
  );
}

type SwatchProps = {
  checked: boolean;
  onChange: () => void;
  label: string;
  tones: readonly string[];
  children?: ReactNode;
};

function Swatch({ checked, onChange, label, tones, children }: SwatchProps) {
  return (
    <label
      title={label}
      className={`flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 border-2 px-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-lcd-3 ${
        checked
          ? "border-lcd-3 bg-lcd-1"
          : "border-transparent hover:border-lcd-2"
      }`}
    >
      <input
        type="radio"
        name="paleta"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span aria-hidden className="flex border-2 border-lcd-3">
        {tones.map((t) => (
          <span key={t} className="size-3" style={{ background: t }} />
        ))}
      </span>
      <span className="sr-only font-display text-px-1 lg:not-sr-only">
        {label}
      </span>
      {children}
    </label>
  );
}
