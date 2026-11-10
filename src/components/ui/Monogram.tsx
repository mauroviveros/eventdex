const SIZES = {
  sm: "size-8 text-px-1",
  md: "size-10 text-px-2",
  lg: "size-36 text-px-4",
};

export const initialsOf = (text: string) =>
  text
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

/** Initials on an ink square: stands in for a logo or an avatar. */
export function Monogram({
  text,
  size = "md",
}: {
  text: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center bg-lcd-3 font-display text-lcd-0 ${SIZES[size]}`}
    >
      {initialsOf(text)}
    </span>
  );
}
