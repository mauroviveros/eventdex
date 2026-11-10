"use client";

import { useEffect, useRef, useState } from "react";
import { PixelIcon } from "@/components/pixel/icons";
import { Calendar } from "@/components/ui/shadcn/calendar";
import { CONTROL, Input } from "@/components/ui/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/shadcn/popover";
import { cn } from "@/lib/utils";
import { FieldFrame } from "./Field";

type Props = {
  label: string;
  /** Posts `YYYY-MM-DD`, or `YYYY-MM-DDTHH:mm` with `time`: what a native date or datetime-local input posts. */
  name: string;
  hint?: string;
  error?: string;
  defaultValue?: string;
  /** Also asks for the hour, next to the date. */
  time?: boolean;
};

const SHOWN = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

// A plain calendar date, no zone: built and read in local time on both ends.
const toDate = (iso: string) => {
  const [y = 0, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const toIso = (d: Date) =>
  [d.getFullYear(), d.getMonth() + 1, d.getDate()]
    .map((n) => String(n).padStart(2, "0"))
    .join("-");

const split = (value: string, time: boolean) =>
  time ? [value.slice(0, 10), value.slice(11, 16)] : [value, ""];

/**
 * A date (and hour) picked on a shadcn calendar, inside the same frame as
 * Field. It posts the same string a native input would, so actions don't
 * change. Half filled (a date without hour) posts empty: the action asks for
 * both.
 */
export function DateField({
  label,
  name,
  hint,
  error,
  defaultValue = "",
  time = false,
}: Props) {
  const [date, setDate] = useState(() => split(defaultValue, time)[0] ?? "");
  const [clock, setClock] = useState(() => split(defaultValue, time)[1] ?? "");
  const [open, setOpen] = useState(false);
  const hidden = useRef<HTMLInputElement>(null);
  // What a form reset goes back to: the latest default (the values sent back
  // after a failed submit, or nothing after a saved one).
  const initial = useRef(defaultValue);
  initial.current = defaultValue;

  useEffect(() => {
    const form = hidden.current?.form;
    if (!form) return;
    const onReset = () => {
      const [d = "", t = ""] = split(initial.current, time);
      setDate(d);
      setClock(t);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [time]);

  const value =
    date && (!time || clock) ? (time ? `${date}T${clock}` : date) : "";
  const shown = date ? SHOWN.format(toDate(date)) : "Elegí la fecha";
  const year = new Date().getFullYear();

  return (
    <FieldFrame
      label={label}
      hint={hint}
      error={error}
      className=""
      control={(a11y) => (
        <div className="flex gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                {...a11y}
                aria-label={`${label}: ${shown}`}
                className={cn(
                  CONTROL,
                  "flex flex-1 items-center gap-3 text-left",
                  !date && "text-muted-foreground",
                )}
              >
                <PixelIcon name="calendario" />
                <span className="truncate">{shown}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent aria-label={`${label}: elegí la fecha`}>
              <Calendar
                mode="single"
                // The chosen day (or today) takes the focus, so arrows move by day.
                autoFocus
                selected={date ? toDate(date) : undefined}
                defaultMonth={date ? toDate(date) : undefined}
                // shortcut: the year dropdown spans ±5 years, widen it if an invoice or edition falls outside
                startMonth={new Date(year - 5, 0)}
                endMonth={new Date(year + 5, 11)}
                onSelect={(day) => {
                  setDate(day ? toIso(day) : "");
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
          {time && (
            <Input
              type="time"
              aria-label={`${label}: hora`}
              aria-invalid={a11y["aria-invalid"]}
              aria-describedby={a11y["aria-describedby"]}
              value={clock}
              onChange={(e) => setClock(e.target.value)}
              className="w-32"
            />
          )}
          <input ref={hidden} type="hidden" name={name} value={value} />
        </div>
      )}
    />
  );
}
