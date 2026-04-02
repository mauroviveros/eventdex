import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export * from "./schedule"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const resolveSafeNextPath = (next: string | null) => {
  if (!next) return "/"
  if (!next.startsWith("/")) return "/"
  if (next.startsWith("//")) return "/"
  return next
}
