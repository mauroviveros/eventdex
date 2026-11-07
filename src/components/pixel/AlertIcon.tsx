/** 8×8 pixel warning sign, drawn in currentColor. */
export function AlertIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden
      className="shrink-0"
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      fill="currentColor"
    >
      <path
        d="M3 0h2v1h1v2h1v2h1v3H0V5h1V3h1V1h1zM3.5 2v3h1V2zm0 4v1h1V6z"
        fillRule="evenodd"
      />
    </svg>
  );
}
