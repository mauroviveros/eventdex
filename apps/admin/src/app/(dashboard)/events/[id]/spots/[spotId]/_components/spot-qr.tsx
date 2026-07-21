import Link from "next/link";
import QRCode from "qrcode";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * QR del spot: apunta al `/spot/[id]` del deploy público del evento. Server
 * component: el PNG se genera en el server y viaja como data URL.
 */
export async function SpotQr({
  eventId,
  spotId,
  siteUrl,
}: {
  eventId: string;
  spotId: string;
  siteUrl: string | null;
}) {
  if (!siteUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>QR del spot</CardTitle>
          <CardDescription>
            Configurá la{" "}
            <Link href={`/events/${eventId}`} className="underline">
              URL pública del evento
            </Link>{" "}
            para generar el link y el QR de este spot.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const spotUrl = `${siteUrl}/spot/${spotId}`;
  const qrDataUrl = await QRCode.toDataURL(spotUrl, {
    width: 512,
    margin: 1,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR del spot</CardTitle>
        <CardDescription>
          Imprimilo y pegalo en el spot: al escanearlo, los participantes
          reclaman la medalla.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* biome-ignore lint/performance/noImgElement: data URL generada en el server; next/image no aplica. */}
        <img
          src={qrDataUrl}
          alt={`QR de ${spotUrl}`}
          className="size-40 rounded-lg border bg-white p-2"
        />
        <Input readOnly defaultValue={spotUrl} />
        <div className="text-muted-foreground text-xs">
          <a
            href={qrDataUrl}
            download={`spot-${spotId}.png`}
            className="underline"
          >
            Descargar PNG
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
