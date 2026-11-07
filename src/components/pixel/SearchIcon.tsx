/** 8×8 pixel magnifier in currentColor. */
export function SearchIcon() {
  return (
    <svg
      aria-hidden
      width={16}
      height={16}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      fill="currentColor"
      className="shrink-0"
    >
      {/* Lens ring */}
      <rect x="1" y="0" width="3" height="1" />
      <rect x="0" y="1" width="1" height="3" />
      <rect x="4" y="1" width="1" height="3" />
      <rect x="1" y="4" width="3" height="1" />
      {/* Handle */}
      <rect x="4" y="4" width="2" height="2" />
      <rect x="6" y="6" width="2" height="2" />
    </svg>
  );
}
