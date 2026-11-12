import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { QrCode } from "@/components/admin/QrCode";
import { ConsoleDemo } from "@/components/landing/ConsoleDemo";
import { STANDS } from "@/components/landing/stands";
import { Sprite } from "@/components/pixel/Sprite";
import { buttonClass } from "@/components/ui/Button";
import { rampFromHex } from "@/domain/palette";
import { publicOrigin } from "@/domain/spots";
import { CONTACT_EMAIL } from "@/lib/contact";
import { env } from "@/lib/env";

const TITLE = "Eventdex: cada stand de tu evento, una medalla";
const DESCRIPTION =
  "Cada stand es una medalla. Tu público escanea, junta y entra al sorteo, en tu dominio y con tu marca.";
const ORIGIN = publicOrigin(env.NEXT_PUBLIC_ROOT_DOMAIN);

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: ORIGIN },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: ORIGIN,
    siteName: "Eventdex",
    locale: "es_AR",
    type: "website",
  },
};

const CONTACT = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Quiero usar Eventdex en mi evento")}&body=${encodeURIComponent("Fecha:\nSede:\nCantidad de stands:\n")}`;

const SLOT = "grid size-10 place-items-center border-2";

// A piece of the product next to each step, drawn with its real components.
const PIECES = [
  <ul
    key="spots"
    className="grid border-2 border-lcd-3 bg-lcd-0 font-display text-px-1"
  >
    {STANDS.slice(0, 2).map((s) => (
      <li
        key={s.code}
        className="flex items-center gap-3 border-lcd-2 p-2 not-last:border-b-2"
      >
        <Sprite type={s.type} scale={2} label="" />
        {s.code} · {s.name}
      </li>
    ))}
  </ul>,
  <div
    key="qr"
    className="grid w-fit justify-items-center gap-1 border-2 border-lcd-3 bg-lcd-0 p-2"
  >
    <QrCode value={ORIGIN} label="" className="size-24" />
    <span className="font-display text-px-1">{STANDS[0]?.code}</span>
  </div>,
  <div key="medals" className="flex gap-2">
    {STANDS.map((s, i) => (
      <span
        key={s.code}
        className={`${SLOT} ${i < 3 ? "border-lcd-3" : "border-dashed border-lcd-2"}`}
      >
        {i < 3 && <Sprite type={s.type} scale={2} label="" />}
      </span>
    ))}
  </div>,
  <div key="raffle" className="panel grid gap-1 p-4">
    <p className="font-display text-px-2">Extracción 1</p>
    <p className="text-sm">Queda registrada con fecha y hora.</p>
  </div>,
];

const STEPS = [
  {
    title: "Cargá el evento",
    text: "Sede, jornadas y stands. El catálogo queda guardado para la próxima edición.",
  },
  {
    title: "Imprimí los QR",
    text: "Sale una hoja A4 por evento, lista para pegar. Un QR impreso no cambia nunca.",
  },
  {
    title: "Tu público junta medallas",
    text: "Escanea con la cámara del celular y entra con Google. No instala nada, y escanear dos veces no suma dos.",
  },
  {
    title: "Sorteá al cierre",
    text: "Entre quienes participaron, en un par de toques. Cada extracción queda registrada; anular no la borra.",
  },
] as const;

// Real results of the v1 events, published with the owner's approval.
const RESULTS = [
  { name: "Burning Tower Fest · Agosto 2026", people: 253, medals: 764 },
  {
    name: "Lo de Charly TCG · Junio 2026",
    people: 151,
    medals: 263,
  },
  {
    name: "Burning Tower Fest · Mayo 2026",
    people: 198,
    medals: 354,
  },
  {
    name: "Lo de Charly TCG · Abril 2026",
    people: 101,
    medals: 268,
  },
] as const;
const TOTAL_MEDALS = RESULTS.reduce((n, r) => n + r.medals, 0);

// Synthetic brands, only to show the palette swap.
const BRANDS = [
  { host: "tuexpo.ejemplo", color: "#d6336c", offset: "" },
  { host: "tuferia.ejemplo", color: "#1e66f5", offset: "sm:mt-10" },
  { host: "tufestival.ejemplo", color: "#e8590c", offset: "sm:mt-20" },
] as const;

function brandStyle(color: string) {
  return Object.fromEntries(
    rampFromHex(color).map((tone, i) => [`--ramp-${i}`, tone]),
  ) as CSSProperties;
}

function Contact({ className = "" }: { className?: string }) {
  return (
    <a
      href={CONTACT}
      className={buttonClass("primary", `no-underline ${className}`)}
    >
      Escribinos
    </a>
  );
}

export default function LandingPage() {
  return (
    <>
      <main>
        <section className="overflow-clip bg-lcd-1">
          <div className="mx-auto grid max-w-6xl justify-items-center gap-x-10 gap-y-8 px-4 pt-6 sm:px-8 lg:min-h-[min(100svh,60rem)] lg:grid-cols-[minmax(0,1fr)_32.5rem] lg:pt-10">
            <div className="grid content-start gap-5 justify-self-start lg:gap-16">
              <div className="flex w-full items-center justify-between gap-4">
                <p className="font-display text-px-3">Eventdex</p>
                <Link
                  href="/ingresar"
                  className={buttonClass("secondary", "no-underline")}
                >
                  Ingresar
                </Link>
              </div>
              <div className="grid justify-items-start gap-5">
                <h1 className="text-balance text-px-4 max-sm:text-px-3 min-[1400px]:text-px-5">
                  Tu evento, jugado stand por stand.
                </h1>
                <p className="max-w-[28rem] text-xl">
                  Cada stand es una medalla: una razón para que tu público vaya
                  a todos.
                </p>
                <Contact />
              </div>
            </div>

            <ConsoleDemo />
          </div>
        </section>

        <section
          aria-labelledby="como"
          className="border-t-2 border-lcd-3 bg-lcd-0"
        >
          <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 sm:px-8 sm:py-24">
            <h2 id="como" className="text-px-3 sm:text-px-4">
              De la planilla al sorteo
            </h2>
            <ol className="grid border-t-2 border-lcd-3">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="grid gap-2 border-b-2 border-lcd-3 py-6 sm:grid-cols-[5rem_18rem_1fr] sm:items-baseline sm:gap-6 lg:grid-cols-[5rem_15rem_1fr_17rem]"
                >
                  <span aria-hidden className="font-display text-px-4">
                    {i + 1}
                  </span>
                  <h3 className="text-px-3">{step.title}</h3>
                  <p className="max-w-[34rem] text-lg">{step.text}</p>
                  <div
                    aria-hidden
                    className="mt-2 sm:col-start-3 sm:self-start lg:col-start-4 lg:mt-0"
                  >
                    {PIECES[i]}
                  </div>
                </li>
              ))}
            </ol>
            <p className="text-sm">Stands de ejemplo.</p>
          </div>
        </section>

        <section
          aria-labelledby="quien"
          className="border-t-2 border-lcd-3 bg-lcd-1"
        >
          <div className="mx-auto grid max-w-5xl gap-5 px-4 py-16 sm:px-8 sm:py-24">
            <h2 id="quien" className="text-balance text-px-3 sm:text-px-4">
              Al cierre, sabés quién participó
            </h2>
            <p className="max-w-[40rem] text-xl">
              Ves quién participó y cuántas medallas juntó. Es para productoras,
              municipios y organizadores de expos y ferias. No vende entradas, y
              nadie instala una app.
            </p>
          </div>
        </section>

        <section aria-labelledby="prueba" className="bg-lcd-3 text-lcd-0">
          <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 sm:px-8 sm:py-24">
            <div className="grid gap-5">
              <h2 id="prueba" className="text-balance text-px-3 sm:text-px-4">
                Lo de Charly TCG y Burning Tower Fest ya lo jugaron cuatro veces
              </h2>
              <p className="max-w-[40rem] text-xl">
                Entre abril y agosto de 2026, 644 personas distintas juntaron
                {TOTAL_MEDALS.toLocaleString("es-AR")} medallas en sus eventos.
              </p>
            </div>
            <table className="w-full border-collapse font-display tabular-nums">
              <caption className="sr-only">
                Resultados de los eventos de Lo de Charly TCG y Burning Tower
                Fest
              </caption>
              <thead>
                <tr className="border-b-2 border-lcd-0 text-left text-px-1 text-lcd-1">
                  <th scope="col" className="py-3 pr-3 font-normal">
                    Evento
                  </th>
                  <th scope="col" className="px-2 py-3 text-right font-normal">
                    Personas
                  </th>
                  <th scope="col" className="py-3 pl-2 text-right font-normal">
                    Medallas
                  </th>
                </tr>
              </thead>
              <tbody className="text-px-1 sm:text-px-2">
                {RESULTS.map((r) => (
                  <tr key={r.name} className="border-b-2 border-lcd-1">
                    <th scope="row" className="py-4 pr-3 text-left font-normal">
                      {r.name}
                    </th>
                    <td className="px-2 py-4 text-right">{r.people}</td>
                    <td className="py-4 pl-2 text-right">{r.medals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="marca" className="bg-lcd-0">
          <div className="mx-auto grid max-w-5xl items-start gap-12 px-4 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_auto]">
            <div className="grid gap-5">
              <h2 id="marca" className="text-balance text-px-3 sm:text-px-4">
                Tu dominio, tu color
              </h2>
              <p className="max-w-[34rem] text-lg">
                Cada organización publica en su propio dominio y con su color.
                Para tu público es la app de tu expo, no la de Eventdex.
              </p>
            </div>
            <div className="grid gap-4">
              <ul className="flex flex-wrap items-start gap-4">
                {BRANDS.map((b) => (
                  <li
                    key={b.host}
                    style={brandStyle(b.color)}
                    data-scheme="light"
                    className={`ramp-scope drop-in flex w-full items-center gap-4 border-2 border-lcd-3 bg-lcd-0 p-4 text-lcd-3 sm:grid sm:w-40 sm:justify-items-center sm:gap-3 ${b.offset}`}
                  >
                    <Sprite type="stand" scale={8} label="Medalla de ejemplo" />
                    <span className="break-words font-display text-px-1 sm:w-full sm:text-center">
                      {b.host}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-sm">Marcas de ejemplo.</p>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="contacto"
          className="border-t-2 border-lcd-3 bg-lcd-1"
        >
          <div className="mx-auto grid max-w-5xl justify-items-start gap-6 px-4 py-16 sm:px-8 sm:py-24">
            <h2 id="contacto" className="text-balance text-px-3 sm:text-px-4">
              Contanos de tu próximo evento
            </h2>
            <p className="max-w-[34rem] text-lg">
              Contanos la fecha, la sede y cuántos stands tenés. Escribinos a{" "}
              <a href={CONTACT} className="underline underline-offset-4">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
            <Contact />
          </div>
        </section>
      </main>
      <footer className="border-t-2 border-lcd-3 bg-lcd-0">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 px-4 py-4 sm:px-8">
          <Link href="/privacidad" className="flex min-h-11 items-center">
            Privacidad
          </Link>
          <Link href="/terminos" className="flex min-h-11 items-center">
            Términos
          </Link>
        </div>
      </footer>
    </>
  );
}
