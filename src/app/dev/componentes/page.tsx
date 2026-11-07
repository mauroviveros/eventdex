import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Celebration } from "@/components/visitante/Celebration";
import { Countdown } from "@/components/visitante/Countdown";
import { Medal } from "@/components/visitante/Medal";
import { PhaseBadge } from "@/components/visitante/PhaseBadge";
import { Progress } from "@/components/visitante/Progress";
import banco from "./logos/banco.svg";
import cafe from "./logos/cafe.svg";
import ceramica from "./logos/ceramica.svg";
import { PaletteScope } from "./PaletteScope";
import { Replay } from "./Replay";

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
          title="Progreso"
          note="Un segmento por spot. Los de color relleno marcan la meta del sorteo."
        >
          <div className="grid gap-10 md:grid-cols-2">
            <Progress claimed={0} total={12} goal={8} />
            <Progress claimed={5} total={12} goal={8} />
            <Progress claimed={9} total={12} goal={8} />
            <Progress claimed={7} total={12} goal={8} finished />
          </div>
        </Section>

        <Section
          title="Celebración"
          note="La pantalla de /s/[id] después de escanear, en sus cinco resultados. Ahí el título es el h1."
        >
          <div className="grid items-start justify-items-center gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Replay className="w-full max-w-sm">
              <Celebration
                headingLevel={3}
                spot={CAFE}
                outcome={{ kind: "nueva" }}
                progress={<Progress claimed={6} total={12} goal={8} />}
              />
            </Replay>
            <Celebration
              headingLevel={3}
              spot={RUEDA}
              outcome={{
                kind: "repetida",
                claimedAt: "sáb 14 de nov a las 15:32",
              }}
              progress={<Progress claimed={6} total={12} goal={8} />}
            />
            <Celebration
              headingLevel={3}
              spot={BANCO}
              outcome={{ kind: "inactivo" }}
            />
            <Celebration
              headingLevel={3}
              spot={CERAMICA}
              outcome={{
                kind: "fuera-de-fase",
                startsAt: "sáb 14 de nov a las 14:00",
              }}
            />
            <Celebration
              headingLevel={3}
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
          title="Header del admin"
          note="Con y sin acceso a la plataforma. La sección actual se subraya y lleva aria-current."
        >
          <div className="grid gap-4">
            <div className="border-2 border-dashed border-lcd-2">
              <AdminHeader email="owner@expo.test" isDeveloper={false} />
            </div>
            <div className="border-2 border-dashed border-lcd-2">
              <AdminHeader email="dev@eventdex.test" isDeveloper />
            </div>
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
