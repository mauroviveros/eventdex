import { initialsOf } from "@/components/ui/Monogram";

export const CARD_IMAGE = { width: 1080, height: 1920 };

const CONTENT_WIDTH = 876;
// Two lines at the name's size, in the widest font. The renderer's own clamp misaligns.
const MAX_NAME = 30;

export type CardImageTheme = {
  /** Lightest to darkest, as hex: images are always on the light tones. */
  tones: readonly string[];
  red: string;
  yellow: string;
  font: string;
  titleFont: string;
  /** Average character width of the title font, over its size. */
  charWidth: number;
  maxTitleSize: number;
  uppercase: boolean;
};

type Props = {
  theme: CardImageTheme;
  title: string;
  details: string;
  /** Data URIs: the renderer shouldn't go to the network on its own. */
  photo: string | null;
  name: string;
  medals: readonly string[];
  count: string;
  orgName: string;
  orgLogo: string | null;
};

/** The largest multiple of 8 where the longest word still fits on one line. */
function titleSize(title: string, theme: CardImageTheme) {
  const longest = Math.max(...title.split(/\s+/).map((w) => w.length));
  const fit = Math.floor(CONTENT_WIDTH / (longest * theme.charWidth) / 8) * 8;
  return Math.max(24, Math.min(theme.maxTitleSize, fit));
}

function shortened(name: string) {
  // By code points: slicing the string could cut an emoji in half.
  const chars = Array.from(name);
  if (chars.length <= MAX_NAME) return name;
  return `${chars.slice(0, MAX_NAME).join("").trimEnd()}...`;
}

function Picture({
  src,
  size,
  fit = "contain",
}: {
  src: string;
  size: number;
  fit?: "contain" | "cover";
}) {
  return (
    // biome-ignore lint/performance/noImgElement: rendered to a PNG by next/og, never served as HTML
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{ objectFit: fit }}
    />
  );
}

/** La Pantalla for sharing: a 9:16 image, what VisitorCard shows. */
export function VisitorCardImage({
  theme,
  title,
  details,
  photo,
  name,
  medals,
  count,
  orgName,
  orgLogo,
}: Props) {
  const [ground, , rule, ink] = theme.tones;
  const initials = (text: string, box: number, size: number) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: box,
        height: box,
        background: ink,
        color: ground,
        fontSize: size,
      }}
    >
      {initialsOf(text)}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: 36,
        background: rule,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          gap: 32,
          padding: "48px 60px",
          background: ground,
          border: `6px solid ${ink}`,
          color: ink,
          fontFamily: theme.font,
          textAlign: "center",
          textTransform: theme.uppercase ? "uppercase" : "none",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "block",
              fontFamily: theme.titleFont,
              fontSize: titleSize(title, theme),
              lineHeight: 1.25,
              color: theme.red,
            }}
          >
            {title}
          </div>
          {details && (
            <div
              style={{ display: "block", fontSize: 50, color: theme.yellow }}
            >
              {details}
            </div>
          )}
        </div>

        <div style={{ display: "flex", border: `6px solid ${ink}` }}>
          {photo ? (
            <Picture src={photo} size={380} fit="cover" />
          ) : (
            initials(name, 380, 160)
          )}
        </div>

        <div
          style={{
            display: "block",
            fontSize: 90,
            lineHeight: 1.25,
          }}
        >
          {shortened(name)}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 12,
          }}
        >
          {medals.map((src, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list, rendered once
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 120,
                height: 120,
                border: `5px solid ${ink}`,
              }}
            >
              <Picture src={src} size={96} />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", fontSize: 80 }}>{count}</div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 50,
          }}
        >
          {orgLogo ? (
            <Picture src={orgLogo} size={88} />
          ) : (
            initials(orgName, 88, 50)
          )}
          <span>{orgName}</span>
        </div>
      </div>
    </div>
  );
}
