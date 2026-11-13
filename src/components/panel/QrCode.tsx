import { encode } from "uqr";

/**
 * A QR code drawn as one SVG path in currentColor: crisp at any print size and
 * no JavaScript in the browser. Medium error correction survives a scuffed sheet.
 * The quiet zone (four modules) is part of the drawing, so it can't be cropped.
 */
export function QrCode({
  value,
  label,
  className = "",
}: {
  value: string;
  /** What the code opens, for screen readers. */
  label: string;
  className?: string;
}) {
  const { data, size } = encode(value, { ecc: "M", border: 4 });
  let d = "";
  data.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) d += `M${x} ${y}h1v1h-1z`;
    });
  });
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      className={`bg-lcd-0 ${className}`}
    >
      <path d={d} fill="currentColor" />
    </svg>
  );
}
