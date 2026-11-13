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

const BURSTS = [
  { at: 300, x: 0.2 },
  { at: 550, x: 0.8 },
  { at: 800, x: 0.5 },
  { at: 1100, x: 0.1 },
  { at: 1250, x: 0.9 },
];

/** Five bursts, timed after the winner's name has typed in, of squares from the stage; `scope` carries the --ramp-* tones. */
export async function lcdConfetti(scope: HTMLElement) {
  const { default: confetti } = await import("canvas-confetti");
  const style = getComputedStyle(scope);
  const colors = [1, 2, 3].map((i) =>
    toHex(style.getPropertyValue(`--ramp-${i}`)),
  );
  for (const { at, x } of BURSTS) {
    setTimeout(() => {
      confetti({
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
}
