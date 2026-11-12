import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AccountMenu } from "@/components/admin/AccountMenu";
import { AdminShell } from "@/components/admin/AdminShell";
import { BrandPreview } from "@/components/admin/BrandPreview";
import { EditSheet } from "@/components/admin/EditSheet";
import { EventActions } from "@/components/admin/EventActions";
import { EventCard } from "@/components/admin/EventCard";
import { EventFilters } from "@/components/admin/EventFilters";
import { OrgSwitcher } from "@/components/admin/OrgSwitcher";
import { QrCode } from "@/components/admin/QrCode";
import { RaffleDraw } from "@/components/admin/RaffleDraw";
import { StatTile } from "@/components/admin/StatTile";
import { TopBar } from "@/components/admin/TopBar";
import { ConsoleDemo } from "@/components/landing/ConsoleDemo";
import { ActionButton } from "@/components/ui/ActionButton";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { DateField } from "@/components/ui/DateField";
import { Field, FormMessage, SelectField } from "@/components/ui/Field";
import { GoogleSignIn } from "@/components/ui/GoogleSignIn";
import { LogoField } from "@/components/ui/LogoField";
import { Badge } from "@/components/ui/shadcn/badge";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import { Label } from "@/components/ui/shadcn/label";
import { SidebarProvider } from "@/components/ui/shadcn/sidebar";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/shadcn/tabs";
import { Celebration } from "@/components/visitante/Celebration";
import { Countdown } from "@/components/visitante/Countdown";
import {
  EventCover,
  Levels,
  Marquee,
  MedalsLoading,
  type PublicEvent,
} from "@/components/visitante/EventHome";
import { Medal } from "@/components/visitante/Medal";
import { MARQUESINA } from "@/components/visitante/marquesina";
import { PhaseBadge } from "@/components/visitante/PhaseBadge";
import { Progress } from "@/components/visitante/Progress";
import { ShareCardButton } from "@/components/visitante/ShareCardButton";
import { VisitorCard } from "@/components/visitante/VisitorCard";
import { SignInLink, VisitorMenu } from "@/components/visitante/VisitorMenu";
import banco from "./logos/banco.svg";
import cafe from "./logos/cafe.svg";
import ceramica from "./logos/ceramica.svg";
import retrato from "./logos/retrato.png";
import { PaletteScope } from "./PaletteScope";
import { Replay } from "./Replay";
import { TableDemo } from "./TableDemo";
import { ToastDemo } from "./ToastDemo";

/** A sample admin frame: its fixed sidebar is held inside the box (transform makes the box its containing block). */
const FRAME =
  "h-128 transform-gpu overflow-auto border-2 border-lcd-3 [&_[data-slot=sidebar-container]]:h-full [&_[data-slot=sidebar-wrapper]]:min-h-full";

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

const CARD_TYPES = ["stand", "attraction", "sponsor", "activity"] as const;
const CARD_MEDALS = Array.from({ length: 14 }, (_, i) => ({
  id: `m${i}`,
  name: `Stand ${i + 1}`,
  type: CARD_TYPES[i % 4] ?? "stand",
  logoPath: null,
}));
const CARD_ACCOUNT = {
  name: "Ana García",
  email: "ana@example.com",
  avatarUrl: retrato.src,
};
const CARD = {
  org: { name: "Expo de ejemplo", logo_path: null },
  event: SAMPLE.live,
  medals: CARD_MEDALS,
  total: 48,
  now: SAMPLE_NOW,
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
          title="Consola de la landing"
          note="La medalla de un stand, jugable: la cruceta cambia de stand y A escanea; con las cinco, entrás al sorteo. Los stands son de ejemplo."
        >
          <ConsoleDemo />
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

        {/* The public app's look: its components, as they ship. */}
        <div className={`contents ${MARQUESINA}`}>
          <Section
            title="Medalla"
            note="El logo original del spot; sin logo, el sprite de su tipo. Pendiente va en gris y apagada; la nueva pasa de gris a color, en pasos."
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
            note="Fin de la cabecera del dominio de la org. Con sesión: foto (o iniciales), nombre y mail; en el celular solo la foto, y el nombre pasa al menú. Sin sesión: Ingresar, que vuelve a la página actual; en producción, el botón que va directo a Google, con su estado de carga."
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
              <GoogleSignIn next="/" variant="secondary">
                Ingresar
              </GoogleSignIn>
              <Button
                variant="secondary"
                pending
                pendingLabel="Yendo a Google…"
              >
                Ingresar
              </Button>
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
            title="Tarjeta de visitante"
            note="Encabeza Mis medallas desde la primera medalla: muestra hasta 12 y cuenta todas. La foto va tal cual, como un logo; sin foto, el monograma. Sin nombre dice Visitante: nunca el mail. El botón de acá no tiene imagen: al tocarlo muestra el error."
          >
            <div className="flex flex-wrap items-start gap-6">
              <VisitorCard
                {...CARD}
                account={CARD_ACCOUNT}
                medals={CARD_MEDALS.slice(0, 1)}
              />
              <VisitorCard {...CARD} account={CARD_ACCOUNT} total={14} />
              <VisitorCard
                {...CARD}
                event={SAMPLE.single}
                account={{
                  name: "María Victoria Fernández de la Fuente",
                  email: "maria@example.com",
                  avatarUrl: null,
                }}
              />
              <VisitorCard
                {...CARD}
                account={{
                  name: "ana@example.com",
                  email: "ana@example.com",
                  avatarUrl: null,
                }}
                medals={CARD_MEDALS.slice(0, 5)}
              />
              <ShareCardButton href="/dev/sin-imagen" fileName="tarjeta.png" />
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
            title="Portada: banner"
            note="La imagen que sube el staff, tal cual, arriba de la placa del título. Sin banner no se muestra nada."
          >
            <EventCover src={ceramica.src} alt="Cartel de ejemplo" />
          </Section>

          <Section
            title="Portada: medallas cargando"
            note="Mientras llegan las medallas del visitante: la forma de la colección, vacía."
          >
            <MedalsLoading spots={[{ id: "a" }, { id: "b" }, { id: "c" }]} />
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
        </div>

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
          note="La organización arriba (con varias, abre un menú con todas) y la cuenta abajo, con su foto o sus iniciales. Los menús son de shadcn y se abren hacia la página."
        >
          <SidebarProvider className="min-h-0">
            <div className="grid w-64 border-2 border-lcd-3 p-2">
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
              <OrgSwitcher
                current={{
                  slug: "expo",
                  name: "Expo de ejemplo",
                  role: "staff",
                }}
                all={[{ slug: "expo", name: "Expo de ejemplo" }]}
              />
              <AccountMenu account={CARD_ACCOUNT} />
              <AccountMenu
                account={{
                  name: "owner@expo.test",
                  email: "owner@expo.test",
                  avatarUrl: null,
                }}
              />
            </div>
          </SidebarProvider>
        </Section>

        <Section
          title="Ajustes: vista previa de la marca"
          note="La app pública en miniatura, con el color que se está eligiendo. Sin logo, las iniciales; con logo, el archivo tal cual."
        >
          <BrandPreview color="#d6336c" name="Expo de ejemplo" logo={null} />
        </Section>

        <Section
          title="Botón de acción"
          note="Una acción, un botón: campos ocultos, estado pendiente y el error debajo. Lo que no se deshace pide confirmación en un diálogo (AlertDialog de shadcn) con la acción y su objeto, la consecuencia y un botón explícito; el foco arranca en Cancelar. Un éxito del panel se avisa con un toast abajo."
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
            <ToastDemo />
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
          title="Panel: pestañas y tabla con orden"
          note="Tabs de shadcn como la tira de filtros: la activa en tinta, 44 px. DataTable arma columnas con TanStack Table; el orden y la página van en la URL (?orden, ?pag) y los resuelve el server. Debajo de 640 px cada fila es una tarjeta con el nombre de cada columna."
        >
          <Tabs defaultValue="visitantes">
            <TabsList aria-label="Ejemplo de pestañas">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="spots">
                Spots <span className="tabular-nums opacity-80">12</span>
              </TabsTrigger>
              <TabsTrigger value="visitantes">
                Visitantes <span className="tabular-nums opacity-80">3</span>
              </TabsTrigger>
              <TabsTrigger value="sorteo" disabled>
                Deshabilitada
              </TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <p>Datos del evento.</p>
            </TabsContent>
            <TabsContent value="spots">
              <p>Spots del evento.</p>
            </TabsContent>
            <TabsContent value="visitantes">
              <TableDemo />
            </TabsContent>
          </Tabs>
        </Section>

        <Section
          title="Panel: tabla y estados"
          note="Table de shadcn: regla de tinta bajo el encabezado y líneas punteadas entre filas; en el celular se corre de costado. Badge con un tono por estado; el rojo es solo para algo que anda mal."
        >
          <div className="grid gap-6">
            <div className="flex flex-wrap gap-2">
              <Badge>Pendiente</Badge>
              <Badge variant="secondary">Próximo</Badge>
              <Badge variant="outline">Activa</Badge>
              <Badge variant="muted">Finalizado</Badge>
              <Badge variant="muted" className="line-through">
                Anulada
              </Badge>
              <Badge variant="destructive">Suspendida</Badge>
            </div>
            <Table className="min-w-xl">
              <TableCaption className="sr-only">
                Facturas de ejemplo
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="tabular-nums">14/11/26</TableCell>
                  <TableCell>Expo de ejemplo 2026</TableCell>
                  <TableCell className="text-right tabular-nums">
                    $ 1.500,50
                  </TableCell>
                  <TableCell>
                    <Badge>Pendiente</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="tabular-nums">02/10/26</TableCell>
                  <TableCell>Feria de ejemplo</TableCell>
                  <TableCell className="text-right tabular-nums">
                    US$ 99,00
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Pagada</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Section>

        <Section
          title="Panel: barra superior"
          note="El botón que muestra u oculta la barra lateral y dónde estás a la izquierda; las acciones de la pantalla a la derecha. Una página que depende de otra muestra la ruta para volver (migas); en el celular, solo el tramo de arriba. Queda fija al scrollear."
        >
          <SidebarProvider className="grid min-h-0 gap-4">
            <div className="border-2 border-lcd-3">
              <TopBar title="Sedes" />
            </div>
            <div className="border-2 border-lcd-3">
              <TopBar title="Eventos" actions={<Button>Nuevo evento</Button>} />
            </div>
            <div className="border-2 border-lcd-3">
              <TopBar
                title="Expo de ejemplo con un nombre bastante largo"
                crumbs={[{ label: "Eventos", href: "/dev/componentes" }]}
                actions={
                  <>
                    <Button variant="secondary">Editar</Button>
                    <EventActions
                      org="dev"
                      event={{
                        id: "demo-topbar",
                        slug: "componentes",
                        title: "Expo de ejemplo",
                        draft: false,
                      }}
                      hasSpots
                      ready
                      publicUrl="/dev/componentes"
                      support={false}
                    />
                  </>
                }
              />
            </div>
            <div className="border-2 border-lcd-3">
              <TopBar
                title="Hoja de QR"
                crumbs={[
                  { label: "Eventos", href: "/dev/componentes" },
                  { label: "Expo de ejemplo", href: "/dev/componentes#evento" },
                ]}
                actions={<Button>Imprimir</Button>}
              />
            </div>
          </SidebarProvider>
        </Section>

        <Section
          title="Panel: marco"
          note="Barra lateral con la organización, las secciones y la cuenta; la página a la derecha. Se colapsa a íconos (botón de la barra superior, el borde o Ctrl/⌘ B) y lo recuerda. En el celular es un panel que abre el mismo botón. En modo soporte el aviso va sobre la página; en la plataforma, sin organización, muestra la marca."
        >
          <div className="grid gap-6">
            <div className={FRAME}>
              <AdminShell
                account={CARD_ACCOUNT}
                sections={[
                  {
                    href: "/dev/componentes",
                    label: "Eventos",
                    icon: "eventos",
                    exact: true,
                  },
                  { href: "/dev/sedes", label: "Sedes", icon: "sedes" },
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
            <div className={FRAME}>
              <AdminShell
                account={{
                  name: "dev@eventdex.test",
                  email: "dev@eventdex.test",
                  avatarUrl: null,
                }}
                sections={[
                  {
                    href: "/dev/organizaciones",
                    label: "Organizaciones",
                    icon: "plataforma",
                  },
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
          title="Panel: hoja de edición"
          note="EditSheet: un botón que abre una Sheet lateral con formularios, para editar sin salir de la página. Se desplaza sola; Cerrar, Escape o el fondo la cierran y el foco vuelve al botón."
        >
          <div className="flex flex-wrap gap-2">
            <EditSheet
              label="Editar"
              title="Editar Expo de ejemplo 2026"
              description="Datos, sede y banner del evento."
            >
              <Field label="Nombre" defaultValue="Expo de ejemplo 2026" />
              <Field
                label="Dirección en el panel"
                defaultValue="expo-2026"
                disabled
                hint="Queda fija una vez publicado: el link a la portada ya puede estar compartido."
              />
            </EditSheet>
            <EditSheet
              label="Agregar jornadas"
              title="Jornadas"
              description="Cada jornada es un día del evento, con su horario."
              variant="primary"
            >
              <p>Todavía no hay jornadas.</p>
            </EditSheet>
          </div>
        </Section>

        <Section
          title="Panel: tarjeta de evento"
          note="Cuándo y dónde, cómo le fue (stands activos, visitantes, medallas y medallas por visitante) y por dónde se entra. El ⋮ abre las acciones del evento; cada una aparece solo si tiene sentido. Un borrador muestra solo sus stands, con la tira punteada."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <EventCard
              title="Expo de ejemplo 2026"
              phase="finalizado"
              dateLabel="Mayo 2026"
              venue="Predio Norte"
              href="/dev/componentes"
              stats={{ stands: 48, visitors: 92, medals: 178 }}
              actions={
                <EventActions
                  org="dev"
                  event={{
                    id: "demo-1",
                    slug: "componentes",
                    title: "Expo de ejemplo 2026",
                    draft: false,
                  }}
                  hasSpots
                  ready
                  publicUrl="/dev/componentes"
                  support={false}
                />
              }
            />
            <EventCard
              title="Feria de ejemplo"
              phase="en-curso"
              dateLabel="sáb 14 de nov"
              venue="Pabellón A"
              href="/dev/componentes"
              stats={{ stands: 10, visitors: 0, medals: 0 }}
            />
            <EventCard
              title="Edición de invierno"
              phase="borrador"
              dateLabel={null}
              venue={null}
              href="/dev/componentes"
              stats={{ stands: 3, visitors: 0, medals: 0 }}
              actions={
                <EventActions
                  org="dev"
                  event={{
                    id: "demo-2",
                    slug: "componentes",
                    title: "Edición de invierno",
                    draft: true,
                  }}
                  hasSpots
                  ready
                  publicUrl={null}
                  support={false}
                />
              }
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
          note="Input, NativeSelect, Combobox (Popover + Command), Checkbox y Calendar de shadcn en el marco de Field. El error aparece al lado del campo y dice cómo resolverlo. La fecha abre un calendario y manda lo mismo que un input nativo."
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
            <Combobox
              label="Spot del catálogo"
              name="spot"
              options={[
                { value: "a", label: "Café de la Esquina" },
                { value: "b", label: "Rueda gigante" },
                { value: "c", label: "Taller de cerámica" },
              ]}
              placeholder="Elegí un spot"
              empty="Ningún spot del catálogo se llama así."
              hint="Se busca escribiendo. Probá con algo que no esté."
            />
            <Combobox
              label="Spot del catálogo"
              name="spot-elegido"
              options={[{ value: "b", label: "Rueda gigante" }]}
              placeholder="Elegí un spot"
              empty="Ningún spot del catálogo se llama así."
              defaultValue="b"
            />
            <Combobox
              label="Spot del catálogo"
              name="spot-error"
              options={[{ value: "b", label: "Rueda gigante" }]}
              placeholder="Elegí un spot"
              empty="Ningún spot del catálogo se llama así."
              error="Elegí un spot del catálogo."
            />
            <DateField label="Empieza" name="empieza" time />
            <DateField
              label="Termina"
              name="termina"
              time
              defaultValue="2026-11-14T22:00"
            />
            <DateField
              label="Fecha"
              name="fecha"
              defaultValue="2026-11-14"
              error="Elegí la fecha de la factura."
            />
            <Label className="min-h-11 font-sans text-base">
              <Checkbox defaultChecked />
              <span>Activo: su QR entrega medalla.</span>
            </Label>
            <Label className="min-h-11 font-sans text-base">
              <Checkbox disabled />
              <span>Quitar el logo</span>
            </Label>
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
