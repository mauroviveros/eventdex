/**
 * Four-tone LCD ramps. Every palette shares the same lightness per tone, so
 * contrast between tones holds for any hue; the brand only contributes hue
 * and how saturated it is.
 */

export type Ramp = readonly [string, string, string, string];

type Tone = { l: number; c: number };

// Lightness and peak chroma per tone, lightest to darkest.
const TONES: readonly Tone[] = [
  { l: 0.94, c: 0.08 },
  { l: 0.8, c: 0.12 },
  { l: 0.5, c: 0.09 },
  { l: 0.27, c: 0.05 },
];

/** Eventdex's own ramp: pea green. */
export const EVENTDEX_HUE = 125;

export function ramp(hue: number, saturation = 1): Ramp {
  const [a, b, c, d] = TONES.map((t) => {
    const chroma = maxInGamutChroma(t.l, t.c * saturation, hue);
    return `oklch(${t.l} ${round(chroma)} ${round(hue)})`;
  }) as [string, string, string, string];
  return [a, b, c, d];
}

/** Ramp for an organization's brand color (`#rrggbb`). */
export function rampFromHex(hex: string): Ramp {
  const rgb = parseHex(hex);
  if (!rgb) return ramp(EVENTDEX_HUE);
  const [, a, b] = linearSrgbToOklab(rgb.map(toLinear) as Rgb);
  const chroma = Math.hypot(a, b);
  const hue = (Math.atan2(b, a) * 180) / Math.PI;
  // Greys get a grey ramp; anything with real color gets the full profile.
  return ramp((hue + 360) % 360, Math.min(1, chroma / 0.08));
}

/**
 * The one color outside the ramp. Its chroma is well above any ramp tone, so it
 * stays distinguishable even when the brand itself is red.
 */
export const DANGER = {
  light: "oklch(0.44 0.21 27)",
  dark: "oklch(0.7 0.19 27)",
} as const;

/** Euclidean distance in OKLab between two `oklch(l c h)` strings. */
export function distance(x: string, y: string): number {
  const [l1, a1, b1] = toOklab(x);
  const [l2, a2, b2] = toOklab(y);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** Gamma-encoded sRGB channels (0–1) for an `oklch(l c h)` string. */
export function toRgb(oklch: string): Rgb {
  const [l, c, h] = parse(oklch);
  return oklchToLinearSrgb(l, c, h).map((v) => {
    const x = clamp01(v);
    return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
  }) as Rgb;
}

/** WCAG 2 contrast ratio between two `oklch(l c h)` strings. */
export function contrast(fg: string, bg: string): number {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (l1 + 0.05) / (l2 + 0.05);
}

export type Rgb = [number, number, number];

function parse(oklch: string): Rgb {
  const [l = 0, c = 0, h = 0] = oklch.match(/[\d.]+/g)?.map(Number) ?? [];
  return [l, c, h];
}

function toOklab(oklch: string): Rgb {
  const [l, c, h] = parse(oklch);
  const rad = (h * Math.PI) / 180;
  return [l, c * Math.cos(rad), c * Math.sin(rad)];
}

function parseHex(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m?.[1]) return null;
  const n = Number.parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255) as Rgb;
}

function luminance(oklch: string): number {
  const [l, c, h] = parse(oklch);
  const [r, g, b] = oklchToLinearSrgb(l, c, h).map(clamp01);
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function maxInGamutChroma(l: number, c: number, h: number): number {
  let chroma = c;
  while (chroma > 0 && !oklchToLinearSrgb(l, chroma, h).every(inUnit)) {
    chroma -= 0.002;
  }
  return Math.max(0, chroma);
}

function oklchToLinearSrgb(l: number, c: number, h: number): Rgb {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

function linearSrgbToOklab([r, g, b]: Rgb): Rgb {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function toLinear(v: number): number {
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

const inUnit = (v: number) => v >= -1e-4 && v <= 1 + 1e-4;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const round = (v: number) => Math.round(v * 1000) / 1000;
