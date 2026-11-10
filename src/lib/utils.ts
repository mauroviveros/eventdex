import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Our font sizes (globals.css @theme): unregistered, twMerge reads `text-px-1`
// as a color and drops it next to `text-lcd-3`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "px-1",
        "px-2",
        "px-3",
        "px-4",
        "px-5",
        "title",
        "title-lg",
        "numeral",
      ],
    },
  },
});

/** Joins classes; a later Tailwind class beats an earlier one of its group. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
