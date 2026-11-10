import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { SPRITES } from "@/components/pixel/sprites";
import {
  CARD_IMAGE,
  type CardImageTheme,
  VisitorCardImage,
} from "@/components/visitante/VisitorCardImage";
import { isGooglePhoto, largeAvatar } from "@/domain/avatar";
import {
  ACCENT,
  EVENTDEX_HUE,
  ramp,
  rampFromHex,
  toHex,
} from "@/domain/palette";
import type { SpotType } from "@/domain/spots";
import {
  CARD_MEDALS_SHOWN,
  cardCount,
  cardDetails,
  cardName,
} from "@/domain/visitorCard";
import { listMyClaims } from "@/lib/data/claims";
import { logoUrl, spotLogoUrl } from "@/lib/data/organizations";
import { getPublicEvent } from "@/lib/data/public";
import { requireVisitor } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { skinFor } from "@/skins";
import { requireHostOrganization } from "../../organization";

// shortcut: fonts come from Google at runtime, once per instance; commit the TTFs if it ever fails in production
const fonts = new Map<string, Promise<ArrayBuffer>>();

function loadFont(family: string) {
  const known = fonts.get(family);
  if (known) return known;
  const font = fetchFont(family).catch((error) => {
    fonts.delete(family);
    throw error;
  });
  fonts.set(family, font);
  return font;
}

async function fetchFont(family: string) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}`,
  ).then((r) => r.text());
  const url = css.match(/src: url\((.+?)\) format\('truetype'\)/)?.[1];
  if (!url) throw new Error(`No TTF for ${family}`);
  return fetch(url).then((r) => r.arrayBuffer());
}

// shortcut: next/og can't decode webp, so a webp logo falls back to its sprite; convert at upload if the sprites show
const DECODABLE = new Set(["image/png", "image/jpeg"]);

/** An image as a data URI, or null: one bad image must not lose the whole card. */
async function asDataUri(url: string | undefined) {
  if (!url) return null;
  try {
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    const type = response.headers.get("content-type")?.split(";")[0];
    if (!response.ok || !type || !DECODABLE.has(type)) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

function spriteDataUri(type: SpotType, tones: readonly string[]) {
  const rects = SPRITES[type].flatMap((row, y) =>
    [...row].flatMap((px, x) =>
      px === "."
        ? []
        : `<rect x="${x}" y="${y}" width="1" height="1" fill="${tones[Number(px)]}"/>`,
    ),
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" shape-rendering="crispEdges">${rects.join("")}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** The visitor's card for one event as a PNG. Private: it carries their name and photo. */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/publica/[host]/mis-medallas/tarjeta">,
) {
  const { org } = await requireHostOrganization((await params).host);
  const visitor = await requireVisitor();
  const slug = request.nextUrl.searchParams.get("evento");
  if (!slug) notFound();

  const supabase = await createClient();
  const event = await getPublicEvent(supabase, org.id, slug);
  if (!event) notFound();
  const mine = await listMyClaims(supabase, event.id, visitor.id);
  const claimed = new Set(mine.map((c) => c.event_spot_id));
  const medals = event.spots.filter((s) => claimed.has(s.id));
  if (medals.length === 0) notFound();

  const skin = skinFor(org.slug);
  const tones = (
    skin?.ramp ??
    (org.brand_color ? rampFromHex(org.brand_color) : ramp(EVENTDEX_HUE))
  ).map(toHex);
  const theme: CardImageTheme = {
    tones,
    red: toHex(skin?.image.accent ?? ACCENT.red.light),
    yellow: toHex(skin?.image.accent ?? ACCENT.yellow.light),
    font: skin?.image.font ?? "Jersey 10",
    titleFont: skin?.image.font ?? "Press Start 2P",
    charWidth: skin?.image.charWidth ?? 1,
    maxTitleSize: skin ? 104 : 72,
    uppercase: Boolean(skin),
  };

  const families = [...new Set([theme.font, theme.titleFont])];
  const [fontData, photo, orgLogo, medalImages] = await Promise.all([
    Promise.all(families.map(loadFont)),
    visitor.avatarUrl && isGooglePhoto(visitor.avatarUrl)
      ? asDataUri(largeAvatar(visitor.avatarUrl))
      : null,
    org.logo_path ? asDataUri(logoUrl(org.logo_path)) : null,
    Promise.all(
      medals
        .slice(0, CARD_MEDALS_SHOWN)
        .map(
          async (m) =>
            (await asDataUri(spotLogoUrl(m.logoPath))) ??
            spriteDataUri(m.type, tones),
        ),
    ),
  ]);

  return new ImageResponse(
    <VisitorCardImage
      theme={theme}
      title={event.title}
      details={cardDetails(event, new Date())}
      photo={photo}
      name={cardName(visitor)}
      medals={medalImages}
      count={cardCount(medals.length, event.spots.length)}
      orgName={org.name}
      orgLogo={orgLogo}
    />,
    {
      ...CARD_IMAGE,
      fonts: families.map((name, i) => ({
        name,
        data: fontData[i] as ArrayBuffer,
        weight: 400 as const,
        style: "normal" as const,
      })),
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
