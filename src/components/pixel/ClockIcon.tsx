/** 8×8 pixel clock, drawn in currentColor. */
export function ClockIcon({ size = 24 }: { size?: number }) {
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
      <path d="M2 0h4v1H2zM1 1h1v1H1zM6 1h1v1H6zM0 2h1v4H0zM7 2h1v4H7zM1 6h1v1H1zM6 6h1v1H6zM2 7h4v1H2zM4 2h1v2h1v1H4z" />
    </svg>
  );
}
