import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { FaqList } from "@/app/panel/(app)/[org]/(con-barra)/eventos/[evento]/FaqList";
import { ConsoleDemo } from "@/components/landing/ConsoleDemo";
import { AccountMenu } from "@/components/panel/AccountMenu";
import { ActiveEvent } from "@/components/panel/ActiveEvent";
import { BrandPreview } from "@/components/panel/BrandPreview";
import { DraftChecklist } from "@/components/panel/DraftChecklist";
import { EditSheet } from "@/components/panel/EditSheet";
import { EventActions } from "@/components/panel/EventActions";
import { EventFilters } from "@/components/panel/EventFilters";
import { OrgSwitcher } from "@/components/panel/OrgSwitcher";
import { PanelShell } from "@/components/panel/PanelShell";
import { PortadaStrip } from "@/components/panel/PortadaStrip";
import { PublishButton } from "@/components/panel/PublishEvent";
import { QrCode } from "@/components/panel/QrCode";
import { RaffleDraw } from "@/components/panel/RaffleDraw";
import { RaffleStage } from "@/components/panel/RaffleStage";
import { RowActions } from "@/components/panel/RowActions";
import { eventCells, StatStrip } from "@/components/panel/StatStrip";
import { TopBar } from "@/components/panel/TopBar";
import { ActionButton } from "@/components/ui/ActionButton";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { DateField } from "@/components/ui/DateField";
import {
  Field,
  FormMessage,
  SelectField,
  TextareaField,
} from "@/components/ui/Field";
import { GoogleSignIn } from "@/components/ui/GoogleSignIn";
import { LogoField } from "@/components/ui/LogoField";
import { SignInCard } from "@/components/ui/SignInCard";
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
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Celebration } from "@/components/visitante/Celebration";
import { Countdown } from "@/components/visitante/Countdown";
import {
  EventCover,
  Levels,
  Marquee,
  MedalsLoading,
  type PublicEvent,
} from "@/components/visitante/EventHome";
import { GalleryViewer } from "@/components/visitante/GalleryViewer";
import {
  History,
  HistoryFailed,
  HistoryLoading,
} from "@/components/visitante/History";
import { LockedMedal } from "@/components/visitante/LockedMedal";
import { MadeWith } from "@/components/visitante/MadeWith";
import { Medal } from "@/components/visitante/Medal";
import { MARQUESINA } from "@/components/visitante/marquesina";
import {
  PerkBlock,
  PerkInSheet,
  PerkSurprise,
  PerkVoucher,
} from "@/components/visitante/PerkPlate";
import { PhaseBadge } from "@/components/visitante/PhaseBadge";
import {
  About,
  Faq,
  HowToGet,
  LinksBar,
  PastEditions,
} from "@/components/visitante/PortadaSections";
import {
  PrizeNotice,
  PrizesLadder,
  PrizesSection,
} from "@/components/visitante/Prizes";
import { ProfileHeader } from "@/components/visitante/ProfileHeader";
import { Progress } from "@/components/visitante/Progress";
import { ShareCardButton } from "@/components/visitante/ShareCardButton";
import { SPOT_STATES, Spot, type SpotSize } from "@/components/visitante/Spot";
import { SpotDirectory } from "@/components/visitante/SpotDirectory";
import { SignInLink, VisitorMenu } from "@/components/visitante/VisitorMenu";
import { buildHistory, type HistoryEdition } from "@/domain/history";
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
const BETO = { name: "Beto P.", claims: 4, avatarUrl: retrato.src };
const PARTICIPANTS = [
  { name: "Ana G.", claims: 5, avatarUrl: null },
  BETO,
  { name: "Cris L.", claims: 3, avatarUrl: null },
  { name: "Dani R.", claims: 2, avatarUrl: null },
  { name: "Eli M.", claims: 2, avatarUrl: retrato.src },
];
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
  organization_id: "ejemplo-org",
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
  links: { website: null, instagram: null, tickets: null, map: null },
  faqs: [],
  photos: [],
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

const sampleEdition = (over: Partial<HistoryEdition>): HistoryEdition => ({
  id: "e",
  slug: "expo-primavera",
  title: "Expo Primavera",
  editionLabel: "2026",
  startsAt: "2026-10-10T12:00:00Z",
  came: true,
  medals: 4,
  total: 7,
  wins: 0,
  ...over,
});

const SAMPLE_HISTORY = buildHistory([
  sampleEdition({
    id: "1",
    editionLabel: "2023",
    startsAt: "2023-10-14T12:00:00Z",
    medals: 3,
    total: 5,
  }),
  sampleEdition({
    id: "2",
    editionLabel: "2024",
    startsAt: "2024-10-12T12:00:00Z",
    came: false,
    medals: 0,
    total: 6,
  }),
  sampleEdition({
    id: "3",
    editionLabel: "2025",
    startsAt: "2025-10-11T12:00:00Z",
    medals: 6,
    total: 6,
    wins: 1,
  }),
  sampleEdition({ id: "4" }),
]);

export const metadata: Metadata = {
  title: "Componentes · Eventdex",
  robots: { index: false },
};

const CARD_ACCOUNT = {
  name: "Ana García",
  email: "ana@example.com",
  avatarUrl: retrato.src,
};
// Synthetic spots and logos, only for the catalog.
type Prize = Parameters<typeof PrizesSection>[0]["prizes"][number];

const PRIZES: Prize[] = [
  {
    id: "p1",
    title: "Pase doble",
    description: "Dos entradas para la próxima edición.",
    imageUrl: undefined,
    minClaims: 1,
  },
  {
    id: "p2",
    title: "Kit de coleccionista",
    description: "Mochila, cuaderno y una lámina firmada.",
    imageUrl: undefined,
    minClaims: 3,
  },
  {
    id: "p3",
    title: "Viaje",
    description: null,
    imageUrl: undefined,
    minClaims: 9,
  },
];

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
            title="Spot"
            note="Spot: la forma única de dibujar un spot, en todos sus estados y tamaños. Borde sólido es tuyo (conseguido, nuevo); punteado, todavía no (oculto, bloqueado, pendiente, inactivo). El bloqueado es siempre el sprite en silueta bajo un candado, aunque tenga logo. xs en la tarjeta y la consola, sm en la colección, md en la consola, lg en la celebración."
          >
            <Replay>
              <div className="grid gap-6">
                {(["xs", "sm", "md", "lg"] as SpotSize[]).map((size) => (
                  <div key={size} className="grid gap-2">
                    <p className="font-display text-px-1">{size}</p>
                    <ul className="flex flex-wrap items-end gap-5">
                      {SPOT_STATES.map((state) => (
                        <li
                          key={state}
                          className="grid justify-items-center gap-2"
                        >
                          <Spot
                            state={state}
                            size={size}
                            type={CAFE.type}
                            logo={
                              state === "conseguido" ? CAFE.logo : undefined
                            }
                            label={`${CAFE.name}: ${state}`}
                          />
                          <span
                            aria-hidden
                            className="font-display text-px-1 text-muted-foreground"
                          >
                            {state}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Replay>
          </Section>

          <Section
            title="Medalla"
            note="El logo original del spot; sin logo, el sprite de su tipo. Pendiente va en gris y apagada; la nueva pasa de gris a color, en pasos."
          >
            <div className="flex flex-wrap items-start gap-6">
              <Medal {...CAFE} state="conseguido" />
              <Medal {...RUEDA} state="pendiente" />
              <Replay>
                <Medal {...CERAMICA} state="nuevo" />
              </Replay>
              <Medal {...BANCO} state="inactivo" />
              <Medal {...RUEDA} state="conseguido" />
            </div>
          </Section>

          <Section
            title="Visor de fotos"
            note="GalleryViewer: la galería de la portada. Tocar una foto la abre entera, con su epígrafe y «3 de 6» en una placa; anterior y siguiente, flechas del teclado, deslizar en el celular y Esc. En escritorio es un diálogo con la placa al costado; en el celular, la foto casi a pantalla completa (queda un borde de 12 px de la página, que al tocarlo cierra) con la placa sobre el pie. En los extremos el botón queda sin efecto pero conserva el foco. Al cerrar, el foco vuelve a la miniatura de la última foto vista. Sin animación, así que no hay nada que reducir."
          >
            <GalleryViewer
              photos={[
                {
                  id: "1",
                  src: retrato.src,
                  caption: "El patio a la apertura",
                },
                {
                  id: "2",
                  src: cafe.src,
                  caption:
                    "Café de la Esquina, con fila desde temprano; la mesa larga se armó para que cada visitante se lleve su pieza.",
                },
                { id: "3", src: retrato.src, caption: null },
              ]}
            />
          </Section>

          <Section
            title="Cuenta del visitante"
            note="Fin de la cabecera del dominio de la org. Con sesión: foto (o iniciales), nombre y mail; en el celular solo la foto, y el nombre pasa al menú. El equipo suma «Ir al sorteo» (el primero; el visitante común no lo ve), que lleva al panel del dominio raíz. Sin sesión: Ingresar, que vuelve a la página actual; en producción, el botón que va directo a Google, con su estado de carga."
          >
            <div className="flex flex-wrap items-start gap-8 pb-40">
              <VisitorMenu
                account={{
                  name: "Mauro Viveros",
                  email: "mauro@ejemplo.com",
                  avatarUrl: null,
                }}
                raffleHref="/dev/sorteo"
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
            title="Encabezado del visitante"
            note="ProfileHeader: arriba de Mis medallas. Arriba la persona (foto o monograma, nombre y mail; si el nombre es el mail, no se repite). Bajo una línea, a la izquierda el badge de rol (solo si es del equipo: Dueño o Equipo) y desde cuándo juega, y a la derecha compartir la tarjeta, que existe desde la primera medalla. Sin nada de eso el pie desaparece. El botón de acá no tiene imagen: al tocarlo muestra el error."
          >
            <div className="grid gap-6">
              <ProfileHeader
                account={CARD_ACCOUNT}
                teamRole="owner"
                since="2026-03-29T12:00:00Z"
                share={
                  <ShareCardButton
                    href="/dev/sin-imagen"
                    fileName="tarjeta.png"
                    variant="secondary"
                  />
                }
              />
              <ProfileHeader
                account={CARD_ACCOUNT}
                since="2026-03-29T12:00:00Z"
                share={null}
              />
              <ProfileHeader
                account={{
                  name: "María Victoria Fernández de la Fuente",
                  email: "maria.victoria.fernandez.de.la.fuente@ejemplo.com",
                  avatarUrl: null,
                }}
                teamRole="staff"
                since={null}
                share={
                  <ShareCardButton
                    href="/dev/sin-imagen"
                    fileName="tarjeta.png"
                    variant="secondary"
                  />
                }
              />
              <ProfileHeader
                account={{
                  name: "ana@example.com",
                  email: "ana@example.com",
                  avatarUrl: null,
                }}
                since={null}
                share={null}
              />
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
                  perk={
                    <PerkVoucher perk="10 % de descuento en tu primer café" />
                  }
                />
              </Replay>
              <Celebration
                {...CELEBRATION}
                spot={RUEDA}
                outcome={{ kind: "repetida", claimedAt: SAMPLE_CLAIM }}
                progress={<Progress claimed={6} total={12} />}
                perk={<PerkInSheet href="#" />}
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
            title="Medalla bloqueada"
            note="LockedMedal: /s/[id] sin sesión (la segunda, con ?error=auth: Google falló y se reintenta). Siempre el sprite del tipo en silueta, aunque el spot tenga logo; el logo lo revela la celebración al volver de Google. El link por mail aparece solo en desarrollo."
          >
            <div className="grid items-start justify-items-center gap-6 md:grid-cols-2">
              <LockedMedal spot={CAFE} next="/s/demo" headingLevel={3} />
              <LockedMedal
                spot={{
                  name: "Asociación de Artesanos y Productores Regionales",
                  code: "C07",
                  type: "sponsor",
                }}
                next="/s/demo"
                failed
                headingLevel={3}
              />
            </div>
          </Section>

          <Section
            title="Beneficios"
            note="Lo que da cada stand. PerkVoucher: el cupón de la celebración, solo con medalla nueva. PerkBlock: la ficha del stand (sin la medalla es una promesa). PerkSurprise: un beneficio sorpresa antes de la medalla. SpotDirectory: la grilla de la portada, con la etiqueta en el marco y la ficha al tocar."
          >
            <div className="grid items-start gap-10">
              <div className="grid w-full max-w-sm gap-4">
                <PerkVoucher perk="10 % de descuento en tu primer café" />
                <PerkBlock perk="10 % de descuento en tu primer café" claimed />
                <PerkBlock
                  perk="10 % de descuento en tu primer café"
                  claimed={false}
                />
                <PerkSurprise />
              </div>
              <SpotDirectory
                claimedIds={["1"]}
                spots={[
                  {
                    id: "1",
                    name: "Café de la Esquina",
                    code: "A01",
                    type: "stand",
                    description: "Café de especialidad y medialunas.",
                    booth: "Pabellón 1",
                    perk: "10 % de descuento en tu primer café",
                    surprise: false,
                  },
                  {
                    id: "2",
                    name: "Taller de cerámica",
                    code: "A02",
                    type: "stand",
                    description: "Modelá tu propia taza.",
                    booth: "Pabellón 2",
                    perk: null,
                    surprise: true,
                  },
                  {
                    id: "3",
                    name: "Rueda gigante",
                    code: "A03",
                    type: "attraction",
                    description: null,
                    booth: null,
                    perk: null,
                    surprise: false,
                  },
                ]}
              />
            </div>
          </Section>

          <Section
            title="Tu historial"
            note="El historial del visitante en /mis-medallas, plegado bajo su colección. Con varias ediciones (sellos ganados y por ganar), con una sola, sin historial, cargando y con error: el resto de la página sigue en pie."
          >
            <div className="grid max-w-3xl gap-6">
              <History history={SAMPLE_HISTORY} current="expo-primavera" />
              <History
                history={buildHistory([sampleEdition({ id: "solo" })])}
              />
              <History history={buildHistory([])} />
              <HistoryLoading />
              <HistoryFailed />
            </div>
          </Section>

          <Section
            title="La página del evento"
            note="Lo que carga el staff en la pestaña Página. About: la descripción, un párrafo por línea en blanco. LinksBar: los links como botones, entradas lleno. HowToGet: la sede y el mapa. Faq: preguntas como acordeón nativo. FaqList: las preguntas del panel con ▲▼ para subir y bajar (la primera sin ▲, la última sin ▼); se mueve al instante y, si no se puede guardar —acá no, el evento no existe—, vuelve a su lugar y avisa. PastEditions: ediciones anteriores con sus cifras. La galería usa fotos del Storage y se ve en la portada. TextareaField: el campo de varias líneas del panel."
          >
            <div className="grid max-w-3xl gap-10">
              <About
                text={
                  "Tres jornadas para recorrer con calma.\n\nCada stand tiene su medalla."
                }
              />
              <LinksBar
                links={{
                  tickets: "https://example.com/entradas",
                  website: "https://example.com",
                  instagram: "https://instagram.com/ejemplo",
                  map: "https://maps.example.com",
                }}
              />
              <HowToGet
                venue={{
                  name: "Predio Norte",
                  address_line: "Av. de Ejemplo 1234",
                  city: "Tucumán",
                  state: "Tucumán",
                }}
                mapUrl="https://maps.example.com"
              />
              <Faq
                faqs={[
                  {
                    id: "1",
                    question: "¿Cuánto cuesta la entrada?",
                    answer: "Es gratuita.",
                  },
                  {
                    id: "2",
                    question: "¿Hay estacionamiento?",
                    answer: "Sí, un playón frente a la entrada.",
                  },
                ]}
              />
              <div className="grid gap-3">
                <p className="font-display text-px-1">
                  Ordenar las preguntas (panel)
                </p>
                <FaqList
                  org="demo"
                  faqs={[
                    {
                      id: "00000000-0000-4000-8000-0000000000a1",
                      question: "¿Cuánto cuesta la entrada?",
                      answer: "Es gratuita.",
                    },
                    {
                      id: "00000000-0000-4000-8000-0000000000a2",
                      question: "¿Hay estacionamiento?",
                      answer: "Sí, un playón frente a la entrada.",
                    },
                    {
                      id: "00000000-0000-4000-8000-0000000000a3",
                      question: "¿Puedo ir con chicos?",
                      answer: "Sí, hay una plaza de juegos.",
                    },
                  ]}
                />
              </div>
              <PastEditions
                editions={[
                  {
                    slug: "expo-2025",
                    title: "Expo de ejemplo",
                    editionLabel: "2025",
                    endedAt: "2025-11-09T22:00:00Z",
                    visitors: 1280,
                    medals: 3410,
                  },
                  {
                    slug: "expo-2024",
                    title: "Expo de ejemplo",
                    editionLabel: "2024",
                    endedAt: "2024-11-10T22:00:00Z",
                    visitors: 1,
                    medals: 1,
                  },
                ]}
              />
              <TextareaField
                label="Sobre el evento"
                name="demo-about"
                hint="Opcional. Separá los párrafos con una línea en blanco."
              />
              <TextareaField
                label="Respuesta"
                name="demo-answer"
                defaultValue="x"
                error="Escribí la respuesta."
                aria-invalid
              />
            </div>
          </Section>

          <Section
            title="Premios"
            note="PrizesSection (portada: placa por premio, compacta sin imagen), PrizesLadder (Mis medallas) y PrizeNotice (celebración: la barra con la copa de cada premio y el próximo). Un premio de una medalla no lleva copa ni barra: no es una meta. Los premios que piden más medallas que stands no se muestran."
          >
            <div className="grid items-start gap-10">
              <PrizesSection prizes={PRIZES} claimed={1} total={4} />
              <PrizesLadder prizes={PRIZES} claimed={2} total={4} />
              <div className="panel w-full max-w-sm p-6">
                <PrizeNotice prizes={PRIZES} claimed={1} total={4} />
              </div>
              <div className="panel w-full max-w-sm p-6">
                <PrizeNotice
                  prizes={[PRIZES[0] as Prize]}
                  claimed={1}
                  total={45}
                />
              </div>
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
            title="Hecho con"
            note="La firma al pie de la app pública: discreta, en texto apagado, con el corazón en rojo de acento. Lleva a la web del autor (src/lib/author.ts)."
          >
            <MadeWith />
          </Section>

          <Section
            title="Barra de la vista previa"
            note="La barra del equipo sobre «Ver portada»: oscura, de una línea y fija arriba, como la de un CMS. Vuelve al evento, elige la fase en la que se lee la portada (arranca en la real) y avisa qué falta cargar. Sin jornadas no hay fase para elegir."
          >
            <div className="grid gap-6">
              <PortadaStrip
                sticky={false}
                base="/panel/expo/eventos/primavera"
                draft={false}
                real="finalizado"
                shown="finalizado"
                missing={[]}
              />
              <PortadaStrip
                sticky={false}
                base="/panel/expo/eventos/primavera"
                draft={false}
                real="proximo"
                shown="en-curso"
                missing={[{ label: "fotos", href: "#" }]}
              />
              <PortadaStrip
                sticky={false}
                base="/panel/expo/eventos/primavera"
                draft
                real={null}
                shown={null}
                missing={[
                  { label: "descripción", href: "#" },
                  { label: "preguntas", href: "#" },
                  { label: "jornadas", href: "#" },
                ]}
              />
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
              <PanelShell
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
              </PanelShell>
            </div>
            <div className={FRAME}>
              <PanelShell
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
              </PanelShell>
            </div>
          </div>
        </Section>

        <Section
          title="Panel: cifras y filtros"
          note="StatStrip: las cifras de un evento o de la plataforma en celdas regladas, con leyenda opcional; tres celdas dejan la última a todo el ancho en el celular. Abajo, el buscador con filtros por fase, que viven en la URL."
        >
          <div className="grid gap-6">
            <StatStrip
              cells={eventCells({ stands: 58, visitors: 290, medals: 532 })}
            />
            <StatStrip
              cells={[
                ["Organizaciones", "4", "1 suspendida"],
                ["Eventos en curso", "1", "En este momento"],
                ["Facturas pendientes", "0", "Nada por cobrar"],
              ]}
            />
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
          title="Ingresar"
          note="SignInCard: el login del panel, con su título y su texto. Con ?error=auth suma el aviso; el link por mail aparece solo en desarrollo. El del visitante es la pantalla de título de /ingresar en el dominio de cada organización."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <SignInCard next="/panel" failed={false} title="Ingresá a Eventdex">
              Para organizar tus eventos. Si te invitaron, usá el mismo mail de
              la invitación.
            </SignInCard>
            <SignInCard next="/panel" failed title="Ingresá a Eventdex">
              Para organizar tus eventos. Si te invitaron, usá el mismo mail de
              la invitación.
            </SignInCard>
          </div>
        </Section>

        <Section
          title="Panel: publicar"
          note="PublishButton: el Publicar de un borrador listo. Pregunta antes en el ConfirmDialog del panel, que conserva el error (acá falla, porque el evento no existe) y devuelve el foco."
        >
          <PublishButton
            org="dev"
            event={{
              id: "00000000-0000-4000-8000-000000000000",
              title: "Feria de ejemplo",
            }}
          />
        </Section>

        <Section
          title="Avatar"
          note="UserAvatar: la foto de una persona, o sus iniciales si no tiene o no carga. Todas las fotos de la app pasan por acá. Tamaños sm, md, lg y xl; con foto y sin foto."
        >
          <div className="flex flex-wrap items-end gap-6">
            {(["sm", "md", "lg"] as const).map((size) => (
              <div key={size} className="flex items-end gap-3">
                <UserAvatar name="Beto Pérez" src={retrato.src} size={size} />
                <UserAvatar name="Beto Pérez" size={size} />
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Panel: sorteo en escenario"
          note="RaffleStage: el sorteo para proyectar. Listo (vivo: sortea, pasan las fotos unos cuatro segundos y al final falla porque el sorteo no existe, para ver el error), sorteando, ganador (con confeti, que solo sale en el vivo) y sin participantes. Con movimiento reducido el ganador aparece sin animación ni confeti. Una foto y el resto con iniciales."
        >
          <div className="grid gap-10">
            <RaffleStage
              raffleId="00000000-0000-4000-8000-000000000000"
              participants={PARTICIPANTS}
              canDraw
            />
            <RaffleStage
              raffleId="00000000-0000-4000-8000-000000000000"
              participants={PARTICIPANTS}
              canDraw
              initial={{ kind: "drawing", shown: BETO, frame: 0, ms: 400 }}
            />
            <RaffleStage
              raffleId="00000000-0000-4000-8000-000000000000"
              participants={PARTICIPANTS.slice(0, 2)}
              canDraw
              initial={{
                kind: "won",
                name: "Beto P.",
                number: 1,
                claims: 4,
                avatarUrl: retrato.src,
              }}
            />
            <RaffleStage
              raffleId="00000000-0000-4000-8000-000000000000"
              participants={[]}
              canDraw
            />
          </div>
        </Section>

        <Section
          title="Panel: acciones de una fila"
          note="RowActions: el ⋮ de una fila (un miembro, una invitación). Cada opción corre su acción y avisa con un toast; lo que no se deshace confirma antes en un diálogo que conserva el error. Acá las dos fallan, para ver el error."
        >
          <div className="flex max-w-xl items-center justify-between gap-4 border-2 border-lcd-3 px-4 py-3">
            <p>Martín Miembro</p>
            <RowActions
              name="Martín Miembro"
              actions={[
                {
                  label: "Hacer owner",
                  action: catalogAction,
                  fields: {},
                  done: "Martín Miembro ahora es owner.",
                },
                {
                  label: "Quitar",
                  action: catalogAction,
                  fields: {},
                  done: "Martín Miembro ya no está en el equipo.",
                  confirm: {
                    title: "Quitar a Martín Miembro",
                    message:
                      "Deja de tener acceso a la organización. Para que vuelva, hay que invitarlo de nuevo.",
                    label: "Sí, quitar",
                    pending: "Quitando…",
                  },
                },
              ]}
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
                label="Edición"
                defaultValue="2026"
                hint="Opcional. Distingue esta edición de las anteriores."
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
          title="Panel: evento activo"
          note="Arriba del dashboard: el evento en curso o, si no hay, el próximo, con sus cifras y los atajos del día. Hoja de QR aparece con stands; Sorteo, solo en curso; Ver portada, siempre."
        >
          <div className="grid gap-6">
            <ActiveEvent
              org="dev"
              event={{
                slug: "componentes",
                title: "Feria de ejemplo",
                edition: "2026",
                phase: "en-curso",
                dates: "sáb 14 al dom 15 de nov",
                venue: "Pabellón A",
                stats: { stands: 12, visitors: 340, medals: 980 },
              }}
            />
            <ActiveEvent
              org="dev"
              event={{
                slug: "componentes",
                title: "Edición de invierno",
                edition: null,
                phase: "proximo",
                dates: "sáb, 20 jun",
                venue: null,
                stats: { stands: 0, visitors: 0, medals: 0 },
              }}
            />
          </div>
        </Section>

        <Section
          title="Panel: para publicar"
          note="Los borradores con lo que les falta y el siguiente paso. Jornadas es lo que pide publicar; la sede es opcional."
        >
          <DraftChecklist
            org="dev"
            drafts={[
              {
                slug: "componentes",
                title: "Edición de invierno",
                edition: null,
                hasSchedules: false,
                hasSpots: false,
                hasVenue: false,
              },
              {
                slug: "componentes",
                title: "Expo de ejemplo",
                edition: "2027",
                hasSchedules: true,
                hasSpots: false,
                hasVenue: true,
              },
              {
                slug: "componentes",
                title: "Feria de primavera",
                edition: null,
                hasSchedules: true,
                hasSpots: true,
                hasVenue: true,
              },
            ]}
          />
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
