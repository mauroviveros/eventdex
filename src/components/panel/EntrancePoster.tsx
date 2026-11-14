import { QrCode } from "@/components/panel/QrCode";
import { PixelIcon } from "@/components/pixel/icons";

type Props = {
  orgName: string;
  eventTitle: string;
  dates: string | null;
  venue: string | null;
  /** The prizes a visitor can win, from the lowest minimum to the highest. */
  prizes: {
    id: string;
    title: string;
    minClaims: number;
    imageUrl?: string;
  }[];
  hostname: string;
  url: string;
};

const medals = (n: number) => (n === 1 ? "1 medalla" : `${n} medallas`);

/**
 * The entrance poster: one A4 that says why to scan, with the QR of the event's
 * page. The event's marquee on top, the best prize as the poster's focus and
 * the others under it. `print-color-adjust: exact` keeps the plates and the
 * ground when printed: browsers drop backgrounds by default and the sheet
 * would come out as plain white.
 */
export function EntrancePoster({
  orgName,
  eventTitle,
  dates,
  venue,
  prizes,
  hostname,
  url,
}: Props) {
  const top = prizes.at(-1);
  const rest = prizes.slice(0, -1).reverse();
  return (
    <article className="mx-auto grid aspect-[210/297] w-full max-w-[190mm] break-inside-avoid grid-rows-[auto_auto_1fr_auto] gap-[6mm] border-2 border-lcd-3 bg-lcd-0 p-[8mm] text-center text-lcd-3 [-webkit-print-color-adjust:exact] [print-color-adjust:exact]">
      <header className="grid justify-items-center">
        {dates && (
          <p className="-mb-0.5 border-2 border-b-0 border-plate-rule bg-plate px-4 py-2 font-display text-px-2 text-accent-yellow">
            {dates}
          </p>
        )}
        <div className="panel grid w-full gap-2 px-4 py-5">
          <h1 className="font-wide text-title text-accent-red">{eventTitle}</h1>
          <p className="text-sm">{venue ? `${orgName} · ${venue}` : orgName}</p>
        </div>
      </header>
      <p className="font-wide text-title">Juntá medallas, ganá premios</p>
      {top ? (
        <div className="grid content-center gap-3">
          <div className="panel grid justify-items-center gap-2 bg-lcd-1 px-4 py-5">
            <p className="font-display text-px-2">Premio mayor</p>
            {top.imageUrl ? (
              // biome-ignore lint/performance/noImgElement: prize images come from Storage, at most 1.5 MB; this is a print page
              <img
                src={top.imageUrl}
                alt=""
                className="aspect-[4/3] h-[28mm] w-auto max-w-full border-2 border-lcd-3 object-cover"
              />
            ) : (
              <span className="text-accent-yellow">
                <PixelIcon name="trofeo" size={64} />
              </span>
            )}
            <p className="font-wide text-title text-balance">{top.title}</p>
            <p className="text-base">
              {top.minClaims === 1
                ? "Con tu primera medalla ya entrás"
                : `Juntá ${medals(top.minClaims)} y entrás al sorteo`}
            </p>
          </div>
          {rest.length > 0 && (
            <ol className="grid gap-2 text-left">
              {rest.map((p) => (
                <li
                  key={p.id}
                  className="grid grid-cols-[auto_1fr] items-center gap-3 border-2 border-lcd-3 px-3 py-2"
                >
                  <span className="text-accent-yellow">
                    <PixelIcon name="trofeo" size={24} />
                  </span>
                  <span className="grid">
                    <span className="font-display text-px-2">{p.title}</span>
                    <span className="text-sm">
                      {p.minClaims === 1
                        ? "Con tu primera medalla ya entrás"
                        : `Entrás con ${medals(p.minClaims)}`}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : (
        <p className="self-center text-lg">
          Escaneá el QR de cada stand y sumá su medalla.
        </p>
      )}
      <div className="grid justify-items-center gap-2">
        <QrCode
          value={url}
          label={`QR de la página del evento en ${hostname}`}
          className="w-[60mm]"
        />
        <p className="font-display text-px-3">Escaneá y empezá</p>
        <p className="text-sm">{hostname}</p>
      </div>
    </article>
  );
}
