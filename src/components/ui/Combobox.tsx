"use client";

import { useState } from "react";
import { Chevron } from "@/components/pixel/Chevron";
import { FieldFrame } from "@/components/ui/Field";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/shadcn/command";
import { CONTROL } from "@/components/ui/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/shadcn/popover";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  /** The form field it fills, through a hidden input. */
  name: string;
  options: { value: string; label: string }[];
  placeholder: string;
  /** What the search says when nothing matches. */
  empty: string;
  defaultValue?: string;
  hint?: string;
  error?: string;
};

/**
 * A select you can type into (Popover + Command), for lists too long for the
 * native one. It posts like a select: a hidden input with the chosen value.
 * A value that left the options (just added, say) goes back to empty.
 */
export function Combobox({
  label,
  name,
  options,
  placeholder,
  empty,
  defaultValue = "",
  hint,
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const current = options.find((o) => o.value === value);

  return (
    <FieldFrame
      label={label}
      hint={hint}
      error={error}
      className=""
      control={(a11y) => (
        <Popover open={open} onOpenChange={setOpen}>
          <input type="hidden" name={name} value={current?.value ?? ""} />
          <PopoverTrigger asChild>
            <button
              type="button"
              role="combobox"
              aria-expanded={open}
              {...a11y}
              className={cn(
                CONTROL,
                "flex items-center justify-between gap-2 text-left",
                !current && "text-muted-foreground",
              )}
            >
              <span className="truncate">{current?.label ?? placeholder}</span>
              <Chevron />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
            <Command>
              <CommandInput placeholder="Buscar…" aria-label={label} />
              <CommandList>
                <CommandEmpty>{empty}</CommandEmpty>
                {options.map((o) => (
                  <CommandItem
                    key={o.value}
                    // Ids keep two spots with the same name apart; search goes by name.
                    value={o.value}
                    keywords={[o.label]}
                    onSelect={() => {
                      setValue(o.value);
                      setOpen(false);
                    }}
                    className="justify-between"
                  >
                    <span className="truncate">{o.label}</span>
                    {o.value === value && (
                      <span className="font-display text-px-1">Elegido</span>
                    )}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    />
  );
}
