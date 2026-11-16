// Pixel confetti in the screen's own palette: flat squares, no tilt, three
// tones of the org's ramp. It never runs with reduced motion.

/** A CSS color (the ramp can be oklch) as the hex the library asks for. */
function toHex(css: string) {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return "#000000";
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export const BURSTS = [
  { at: 300, x: 0.2 },
  { at: 550, x: 0.8 },
  { at: 800, x: 0.5 },
  { at: 1100, x: 0.1 },
  { at: 1250, x: 0.9 },
];

/** The award's own: three bursts, no waiting for a name to type in. */
export const AWARD_BURSTS = BURSTS.slice(0, 3).map((b, i) => ({
  ...b,
  at: 150 + i * 250,
}));

// A burst lasts about two seconds from the last tanda; then the canvas goes.
const CANVAS_LIFETIME_MS = 4000;

/**
 * Five bursts of squares, timed after the winner's name has typed in. `scope`
 * carries the --ramp-* tones and hosts the canvas: inside the page's landmark
 * and hidden from readers, since it is decoration.
 */
export async function lcdConfetti(
  scope: HTMLElement,
  // A merit award is shorter than the raffle's finale.
  bursts: readonly { at: number; x: number }[] = BURSTS,
) {
  const { default: confetti } = await import("canvas-confetti");
  const style = getComputedStyle(scope);
  const colors = [1, 2, 3].map((i) =>
    toHex(style.getPropertyValue(`--ramp-${i}`)),
  );
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:100";
  scope.append(canvas);
  const fire = confetti.create(canvas, { resize: true, useWorker: false });
  for (const { at, x } of bursts) {
    setTimeout(() => {
      void fire({
        particleCount: 55,
        spread: 70,
        startVelocity: 38,
        origin: { x, y: 0.6 },
        colors,
        shapes: ["square"],
        flat: true,
        scalar: 1.4,
        ticks: 180,
        disableForReducedMotion: true,
      });
    }, at);
  }
  setTimeout(
    () => {
      fire.reset();
      canvas.remove();
    },
    (BURSTS.at(-1)?.at ?? 0) + CANVAS_LIFETIME_MS,
  );
}
