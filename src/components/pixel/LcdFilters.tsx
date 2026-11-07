import { type Ramp, toRgb } from "@/domain/palette";

type Rgb = [number, number, number];

/**
 * SVG filters that posterize any image (a spot's logo) into the four tones by
 * luminance, mapped to roles: the lightest pixels (a logo's background) land on
 * the ground, the darkest on the ink. In dark mode the roles reverse, so a logo
 * inverts like the rest of the screen. globals.css picks the set per scheme
 * through --logo-*. Render once, inside the scope that owns the ramp.
 */
export function LcdFilters({ ramp }: { ramp: Ramp }) {
  const [r0, r1, r2, r3] = ramp.map(toRgb) as [Rgb, Rgb, Rgb, Rgb];
  // Darkest luminance band first.
  const tables: Record<string, Rgb[]> = {
    "lcd-full": [r3, r2, r1, r0],
    "lcd-mid": [r2, r2, r1, r0],
    "lcd-faded": [r1, r1, r0, r0],
    "lcd-full-dark": [r0, r1, r2, r3],
    "lcd-mid-dark": [r1, r1, r2, r3],
    "lcd-faded-dark": [r2, r2, r3, r3],
  };
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      {Object.entries(tables).map(([id, tones]) => {
        const channel = (c: number) =>
          tones.map((rgb) => (rgb[c] ?? 0).toFixed(4)).join(" ");
        return (
          <filter key={id} id={id} colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"
            />
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues={channel(0)} />
              <feFuncG type="discrete" tableValues={channel(1)} />
              <feFuncB type="discrete" tableValues={channel(2)} />
            </feComponentTransfer>
          </filter>
        );
      })}
    </svg>
  );
}
