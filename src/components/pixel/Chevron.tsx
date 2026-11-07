/** 8×8 pixel chevron pointing down, in currentColor. Rotate it with className. */
export function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      width={16}
      height={16}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      fill="currentColor"
      className={`shrink-0 ${className}`}
    >
      <path d="M1 2h1v1h1v1h2V3h1V2h1v2H6v1H5v1H3V5H2V4H1z" />
    </svg>
  );
}
