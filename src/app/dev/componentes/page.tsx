import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AccountMenu } from "@/components/admin/AccountMenu";
import { AdminShell } from "@/components/admin/AdminShell";
import { BrandPreview } from "@/components/admin/BrandPreview";
import { EventCard } from "@/components/admin/EventCard";
import { EventFilters } from "@/components/admin/EventFilters";
import { OrgSwitcher } from "@/components/admin/OrgSwitcher";
import { QrCode } from "@/components/admin/QrCode";
import { RaffleDraw } from "@/components/admin/RaffleDraw";
import { StatTile } from "@/components/admin/StatTile";
import { TopBar } from "@/components/admin/TopBar";
import { ActionButton } from "@/components/ui/ActionButton";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, SelectField } from "@/components/ui/Field";
import { LogoField } from "@/components/ui/LogoField";
import { Celebration } from "@/components/visitante/Celebration";
import { Countdown } from "@/components/visitante/Countdown";
import {
  Levels,
  Marquee,
  type PublicEvent,
} from "@/components/visitante/EventHome";
import { Medal } from "@/components/visitante/Medal";
import { PhaseBadge } from "@/components/visitante/PhaseBadge";
import { Progress } from "@/components/visitante/Progress";
import { SignInLink, VisitorMenu } from "@/components/visitante/VisitorMenu";
import banco from "./logos/banco.svg";
import cafe from "./logos/cafe.svg";
import ceramica from "./logos/ceramica.svg";
import { PaletteScope } from "./PaletteScope";
import { Replay } from "./Replay";

// The catalog's buttons answer like a failed write, so the error state shows.
async function catalogAction() {
  "use server";
  return {
    ok: false as const,
    error: "Así se ve un error de la acción.",
    values: {},
  };
}

// Synthetic events, only for the catalog. Fixed "now": sat 14 nov 2026, 12:00 in Buenos Aires.
const SAMPLE_CLAIM = "2026-11-14T18:32:00Z";
const CELEBRATION = {
  headingLevel: 3 as const,
  timeZone: "America/Argentina/Buenos_Aires",
  eventHref: "#",
};

const SAMPLE_NOW = new Date("2026-11-14T15:00:00Z");
const SAMPLE_TIMEZONE = "America/Argentina/Buenos_Aires";
const SAMPLE_DRAW = {
  id: "ganadora",
  draw_number: 2,
  name: "Ana García",
  email: "ana@example.com",
  winner_name: "Ana G.",
  eligible_count: 348,
  drawn_at: "2026-11-14T22:05:00Z",
  voided_at: null as string | null,
  void_reason: null as string | null,
};
const day = (id: string, starts: string, ends: string, label?: string) => ({
  id,
  label: label ?? null,
  starts_at: starts,
  ends_at: ends,
});
const sampleEvent = (
  schedules: PublicEvent["schedules"],
  venue: PublicEvent["venue"] = {
    name: "Predio Norte",
    address_line: "Av. de Ejemplo 1234",
    city: "Tucumán",
    state: null,
  },
): PublicEvent => ({
  id: "ejemplo",
  slug: "expo-de-ejemplo",
  title: "Expo de ejemplo 2026",
  edition_label: null,
  summary: "Tres jornadas de stands, atracciones y talleres.",
  description: null,
  cover_path: null,
  timezone: "America/Argentina/Buenos_Aires",
  status: "published",
  visibility: "public",
  venue,
  schedules,
  spots: [],
  hasWinners: false,
});
const SAMPLE = {
  upcoming: sampleEvent([
    day("u1", "2026-11-21T13:00:00Z", "2026-11-21T23:00:00Z"),
    day("u2", "2026-11-22T13:00:00Z", "2026-11-22T22:00:00Z"),
  ]),
  live: sampleEvent([
    day("l1", "2026-11-13T13:00:00Z", "2026-11-13T23:00:00Z"),
    day("l2", "2026-11-14T13:00:00Z", "2026-11-14T23:00:00Z"),
    day("l3", "2026-11-15T13:00:00Z", "2026-11-15T22:00:00Z"),
  ]),
  finished: sampleEvent([
    day("f1", "2026-11-07T13:00:00Z", "2026-11-07T23:00:00Z"),
    day("f2", "2026-11-08T13:00:00Z", "2026-11-08T22:00:00Z"),
  ]),
  single: sampleEvent(
    [day("s1", "2026-12-05T14:00:00Z", "2026-12-05T21:00:00Z", "Única")],
    null,
  ),
};

export const metadata: Metadata = {
  title: "Componentes · Eventdex",
  robots: { index: false },
};

// Synthetic spots and logos, only for the catalog.
const CAFE = {
  name: "Café de la Esquina",
  code: "A12",
  type: "stand",
  logo: cafe.src,
} as const;
const RUEDA = {
  name: "Rueda gigante",
  code: "B03",
  type: "attraction",
} as const;
const CERAMICA = {
  name: "Taller de cerámica",
  code: "C07",
  type: "activity",
  logo: ceramica.src,
} as const;
const BANCO = {
  name: "Banco Auspiciante",
  code: "S01",
  type: "sponsor",
  logo: banco.src,
} as const;

export default function ComponentesPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <PaletteScope>
      <main className="mx-auto grid max-w-6xl gap-12 px-4 py-8 sm:px-6">
        <div className="grid gap-1">
          <h1 className="text-px-3 sm:text-px-4">Componentes</h1>
          <p className="text-sm text-muted-foreground">
            Datos y logos de ejemplo. Solo en desarrollo.
          </p>
        </div>

        <Section
          title="Paleta"
          note="Cuatro tonos de un solo color. Cada organización recibe los suyos desde su color de marca; el contraste lo fija la luminosidad. En modo oscuro se invierten."
        >
          <div className="grid grid-cols-4 border-2 border-lcd-3 sm:max-w-xl">
            {[
              ["0", "Fondo", "bg-lcd-0"],
              ["1", "Relleno", "bg-lcd-1"],
              ["2", "Secundario", "bg-lcd-2 text-lcd-0"],
              ["3", "Tinta", "bg-lcd-3 text-lcd-0"],
            ].map(([n, name, cls]) => (
              <div key={n} className={`grid h-20 content-end p-2 ${cls}`}>
                <span className="font-display text-px-1">--lcd-{n}</span>
                <span className="text-xs">{name}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Campo de logo"
          note="Avisa si el archivo pasa de 1 MB antes de enviar el formulario."
        >
          <div className="grid max-w-md gap-6">
            <LogoField hint="PNG, JPG o WebP, hasta 1 MB." />
            <LogoField
              hint="PNG, JPG o WebP, hasta 1 MB."
              error="Subí una imagen PNG, JPG o WebP."
            />
          </div>
        </Section>

        <Section
          title="Medalla"
          note="El logo del spot pasado a los cuatro tonos; sin logo, el sprite de su tipo. La nueva se revela de claro a oscuro, en pasos."
        >
          <div className="flex flex-wrap items-start gap-6">
            <Medal {...CAFE} state="conseguida" />
            <Medal {...RUEDA} state="pendiente" />
            <Replay>
              <Medal {...CERAMICA} state="nueva" />
            </Replay>
            <Medal {...BANCO} state="inactiva" />
            <Medal {...RUEDA} state="conseguida" />
          </div>
        </Section>

        <Section
          title="Cuenta del visitante"
          note="Fin de la cabecera del dominio de la org. Con sesión: foto (o iniciales), nombre y mail; en el celular solo la foto, y el nombre pasa al menú. Sin sesión: Ingresar, que vuelve a la página actual."
        >
          <div className="flex flex-wrap items-start gap-8 pb-40">
            <VisitorMenu
              account={{
                name: "Mauro Viveros",
                email: "mauro@ejemplo.com",
                avatarUrl: null,
              }}
            />
            <VisitorMenu
              account={{
                name: "visitante@ejemplo.com",
                email: "visitante@ejemplo.com",
                avatarUrl: null,
              }}
            />
            <SignInLink />
          </div>
        </Section>

        <Section
          title="Progreso"
          note="Un segmento por spot. Sin meta (R5: alcanza con una medalla) habla de completar la colección; con meta, los segmentos de color relleno marcan la del sorteo."
        >
          <div className="grid gap-10 md:grid-cols-2">
            <Progress claimed={0} total={12} />
            <Progress claimed={5} total={12} />
            <Progress claimed={12} total={12} />
            <Progress claimed={7} total={12} finished />
            <Progress claimed={5} total={12} goal={8} />
            <Progress claimed={9} total={12} goal={8} />
          </div>
        </Section>

        <Section
          title="Celebración"
          note="La pantalla de /s/[id] después de escanear, en sus cinco resultados (fuera de fase, antes y después). Ahí el título es el h1."
        >
          <div className="grid items-start justify-items-center gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Replay className="w-full max-w-sm">
              <Celebration
                {...CELEBRATION}
                spot={CAFE}
                outcome={{ kind: "nueva", claimedAt: SAMPLE_CLAIM }}
                progress={<Progress claimed={6} total={12} />}
              />
            </Replay>
            <Celebration
              {...CELEBRATION}
              spot={RUEDA}
              outcome={{ kind: "repetida", claimedAt: SAMPLE_CLAIM }}
              progress={<Progress claimed={6} total={12} />}
            />
            <Celebration
              {...CELEBRATION}
              spot={BANCO}
              outcome={{ kind: "inactivo" }}
            />
            <Celebration
              {...CELEBRATION}
              spot={CERAMICA}
              outcome={{
                kind: "fuera-de-fase",
                startsAt: "2026-11-14T17:00:00Z",
                endsAt: "2026-11-16T01:00:00Z",
                ended: false,
              }}
            />
            <Celebration
              {...CELEBRATION}
              spot={CERAMICA}
              outcome={{
                kind: "fuera-de-fase",
                startsAt: "2026-11-14T17:00:00Z",
                endsAt: "2026-11-16T01:00:00Z",
                ended: true,
              }}
            />
            <Celebration
              {...CELEBRATION}
              spot={CAFE}
              outcome={{ kind: "bloqueado" }}
            />
          </div>
        </Section>

        <Section
          title="Cuenta regresiva"
          note="Hasta la próxima jornada, en la hora local del evento."
        >
          <div className="flex flex-wrap gap-12">
            <Countdown
              state={{ kind: "faltan", days: 3, hours: 14, minutes: 6 }}
            />
            <Countdown
              state={{ kind: "faltan", days: 0, hours: 2, minutes: 45 }}
            />
            <Countdown state={{ kind: "en-curso", endsAt: "22:00" }} />
            <Countdown state={{ kind: "finalizado" }} />
          </div>
        </Section>

        <Section
          title="Portada: cartel"
          note="La apertura de la portada pública: fecha en una pestaña, título en la placa de doble filete, sede en otra pestaña, y la cuenta regresiva. Con una sola jornada, el horario va en la pestaña; sin sede, la pestaña de abajo no está."
        >
          <div className="grid gap-12">
            <Marquee event={SAMPLE.upcoming} now={SAMPLE_NOW} />
            <Marquee event={SAMPLE.live} now={SAMPLE_NOW} />
            <Marquee event={SAMPLE.finished} now={SAMPLE_NOW} />
            <Marquee event={SAMPLE.single} now={SAMPLE_NOW} />
          </div>
        </Section>

        <Section
          title="Portada: jornadas como niveles"
          note="La jornada de ahora (o la próxima) es una celda rellena de doble filete; las que faltan van punteadas y las terminadas, apagadas."
        >
          <div className="grid gap-12">
            <Levels event={SAMPLE.live} now={SAMPLE_NOW} />
            <Levels event={SAMPLE.upcoming} now={SAMPLE_NOW} />
          </div>
        </Section>

        <Section title="Fase" note="Del evento, calculada desde sus jornadas.">
          <div className="flex flex-wrap gap-3">
            <PhaseBadge phase="borrador" />
            <PhaseBadge phase="proximo" />
            <PhaseBadge phase="en-curso" />
            <PhaseBadge phase="finalizado" />
            <PhaseBadge phase="sin-fecha" />
          </div>
        </Section>

        <Section
          title="Botones"
          note="44 px de alto como mínimo. El texto dice qué hace."
        >
          <div className="flex flex-wrap gap-3">
            <Button>Publicar evento</Button>
            <Button variant="secondary">Ver mis medallas</Button>
            <Button variant="danger">Anular extracción</Button>
            <Button pending pendingLabel="Publicando…">
              Publicar evento
            </Button>
            <Button disabled>Publicar evento</Button>
          </div>
        </Section>

        <Section
          title="Panel: barra lateral"
          note="La organización arriba (con varias, se despliega para cambiar) y la cuenta abajo, que abre hacia arriba. La sección actual es una celda invertida."
        >
          <div className="grid max-w-64 border-2 border-lcd-3">
            <div className="border-b-2 border-lcd-3">
              <OrgSwitcher
                current={{
                  slug: "expo",
                  name: "Expo de ejemplo",
                  role: "owner",
                }}
                all={[
                  { slug: "expo", name: "Expo de ejemplo" },
                  { slug: "feria", name: "Feria de ejemplo" },
                ]}
              />
            </div>
            <div className="grid gap-1 p-2">
              <span className="flex min-h-11 items-center bg-lcd-3 px-3 font-display text-px-1 text-lcd-0">
                Eventos
              </span>
              <span className="flex min-h-11 items-center px-3 font-display text-px-1">
                Spots
              </span>
            </div>
            <div className="mt-24 border-t-2 border-lcd-3">
              <AccountMenu email="owner@expo.test" />
            </div>
          </div>
        </Section>

        <Section
          title="Ajustes: vista previa de la marca"
          note="La app pública en miniatura, con el color que se está eligiendo. Sin logo, las iniciales; con logo, posterizado a los cuatro tonos."
        >
          <BrandPreview color="#d6336c" name="Expo de ejemplo" logo={null} />
        </Section>

        <Section
          title="Botón de acción"
          note="Una acción, un botón: campos ocultos, estado pendiente y el error debajo. Lo que no se deshace pide confirmación: el primer clic explica la consecuencia y ofrece un segundo botón explícito."
        >
          <div className="flex flex-wrap items-start gap-6">
            <ActionButton
              action={catalogAction}
              fields={{}}
              label="Archivar"
              pendingLabel="Archivando…"
            />
            <ActionButton
              action={catalogAction}
              fields={{}}
              label="Quitar del evento"
              pendingLabel="Quitando…"
              confirm={{
                message:
                  "Su QR deja de funcionar, también el que ya esté impreso.",
                label: "Quitar A12",
              }}
            />
          </div>
        </Section>

        <Section
          title="Panel: extracción del sorteo"
          note="Ganador para cantar en el escenario, sorteando (el botón) y anulada, que queda registrada con su motivo."
        >
          <Button variant="primary" pending pendingLabel="Sorteando…">
            Sacar ganador
          </Button>
          <ul className="grid max-w-prose">
            <RaffleDraw draw={SAMPLE_DRAW} timezone={SAMPLE_TIMEZONE}>
              <Button className="w-fit">Anular</Button>
            </RaffleDraw>
            <RaffleDraw
              draw={{
                ...SAMPLE_DRAW,
                id: "anulada",
                draw_number: 1,
                name: "Beto Ruiz",
                voided_at: SAMPLE_DRAW.drawn_at,
                void_reason: "No se presentó",
              }}
              timezone={SAMPLE_TIMEZONE}
            />
          </ul>
        </Section>

        <Section
          title="Panel: QR de un spot"
          note="Un solo path SVG en el color de tinta, con su zona de silencio. Se imprime nítido a cualquier tamaño; en papel siempre sale oscuro sobre claro."
        >
          <div className="flex flex-wrap items-end gap-6">
            <QrCode
              value="https://expo.com.ar/s/00000000-0000-4000-8000-000000000000"
              label="QR de ejemplo"
              className="w-40"
            />
            <QrCode
              value="https://expo.com.ar/s/00000000-0000-4000-8000-000000000000"
              label="QR de ejemplo, chico"
              className="w-24"
            />
          </div>
        </Section>

        <Section
          title="Panel: barra superior"
          note="Dónde estás a la izquierda y la única acción principal de la pantalla a la derecha. Queda fija al scrollear."
        >
          <div className="grid gap-4">
            <div className="border-2 border-lcd-3">
              <TopBar title="Sedes" />
            </div>
            <div className="border-2 border-lcd-3">
              <TopBar title="Eventos" actions={<Button>Nuevo evento</Button>} />
            </div>
          </div>
        </Section>

        <Section
          title="Panel: marco"
          note="Barra lateral con la organización, las secciones y la cuenta; la página a la derecha. En el celular la barra pasa arriba. En modo soporte suma el aviso bajo la organización; en la plataforma, sin organización, muestra la marca."
        >
          <div className="grid gap-6">
            <div className="h-128 overflow-auto border-2 border-lcd-3">
              <AdminShell
                email="owner@expo.test"
                sections={[
                  { href: "/dev/componentes", label: "Eventos", exact: true },
                  { href: "/dev/sedes", label: "Sedes" },
                ]}
                org={{
                  current: {
                    slug: "expo",
                    name: "Expo de ejemplo",
                    role: "owner",
                  },
                  all: [{ slug: "expo", name: "Expo de ejemplo" }],
                }}
                notice={
                  <p className="border-b-2 border-lcd-3 bg-lcd-1 px-3 py-2 font-display text-px-1">
                    Modo soporte · solo lectura
                  </p>
                }
              >
                <TopBar title="Eventos" />
                <p className="px-4 py-8 sm:px-6">Contenido de la página.</p>
              </AdminShell>
            </div>
            <div className="h-128 overflow-auto border-2 border-lcd-3">
              <AdminShell
                email="dev@eventdex.test"
                sections={[
                  { href: "/dev/organizaciones", label: "Organizaciones" },
                ]}
              >
                <TopBar title="Plataforma" />
                <p className="px-4 py-8 sm:px-6">Contenido de la página.</p>
              </AdminShell>
            </div>
          </div>
        </Section>

        <Section
          title="Panel: métricas y filtros"
          note="Las cifras de la organización y el buscador con filtros por fase. Los filtros viven en la URL."
        >
          <div className="grid gap-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile
                label="Eventos"
                value={3}
                caption="en la organización"
              />
              <StatTile
                label="Stands"
                value={58}
                caption="en todos los eventos"
              />
              <StatTile label="Medallas" value={532} caption="conseguidas" />
              <StatTile label="Visitantes" value={290} caption="registrados" />
            </div>
            <EventFilters
              basePath="/dev/componentes"
              current="todos"
              counts={{
                todos: 3,
                "en-curso": 1,
                proximo: 0,
                finalizado: 1,
                borrador: 1,
              }}
            />
          </div>
        </Section>

        <Section
          title="Panel: tarjeta de evento"
          note="Cuándo y dónde, cómo le fue y por dónde se entra. Recorrido promedio: qué parte de los stands visitó cada visitante. Sin métricas todavía (antes de R3 y R5), la tarjeta muestra solo la entrada."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <EventCard
              title="Expo de ejemplo 2026"
              phase="finalizado"
              dateLabel="Mayo 2026"
              venue="Predio Norte"
              href="/dev/componentes"
              stats={{
                stands: 48,
                visitors: 92,
                claims: 178,
                completion: 0.04,
                href: "/dev/componentes",
              }}
            />
            <EventCard
              title="Feria de ejemplo"
              phase="en-curso"
              dateLabel="sáb 14 de nov"
              venue="Pabellón A"
              href="/dev/componentes"
              stats={{
                stands: 10,
                visitors: 198,
                claims: 354,
                completion: 0.53,
                href: "/dev/componentes",
              }}
            />
            <EventCard
              title="Edición de invierno"
              phase="borrador"
              dateLabel={null}
              venue={null}
              href="/dev/componentes"
            />
          </div>
        </Section>

        <Section
          title="Tipografía"
          note="Jersey 10 para títulos, contadores y códigos, en múltiplos de 10 px. Atkinson Hyperlegible Next para todo lo que se lee."
        >
          <div className="grid gap-3">
            <p className="font-display text-px-3 sm:text-px-4">
              Expo de ejemplo 2026
            </p>
            <p className="font-display text-px-3">Medallas del evento</p>
            <p className="font-display text-px-2">A12 · B03 · C07 · S01</p>
            <p className="max-w-prose text-base">
              Recorré el predio, escaneá el QR de cada stand y juntá medallas.
              Al cierre, quienes llegan a la meta entran al sorteo.
            </p>
            <p className="text-sm text-muted-foreground">
              sáb 14 de nov, 14:00 a 22:00
            </p>
          </div>
        </Section>

        <Section
          title="Campos"
          note="El error aparece al lado del campo y dice cómo resolverlo."
        >
          <div className="grid max-w-md gap-6">
            <Field
              label="Nombre del evento"
              placeholder="Expo de ejemplo 2026"
            />
            <Field
              label="Código del spot"
              hint="Corto y legible, se imprime con el QR."
              defaultValue="A12"
            />
            <Field
              label="Código del spot"
              defaultValue="A12"
              error="Ya hay un spot con el código A12 en este evento. Probá con otro."
            />
            <Field label="Dominio" defaultValue="expo.com.ar" disabled />
            <SelectField
              label="Sede"
              defaultValue=""
              hint="Los horarios se muestran en America/Argentina/Buenos Aires."
            >
              <option value="">Sin sede por ahora</option>
              <option value="norte">Predio Norte</option>
            </SelectField>
            <Field label="Empieza" type="datetime-local" />
            <FormMessage tone="success">Sede creada.</FormMessage>
            <FormMessage tone="error">
              No pudimos guardar. Probá de nuevo en un rato.
            </FormMessage>
          </div>
        </Section>
      </main>
    </PaletteScope>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6">
      <div className="grid gap-1 border-b-2 border-lcd-3 pb-3">
        <h2 className="text-px-2 sm:text-px-3">{title}</h2>
        <p className="max-w-prose text-sm text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  );
}
