import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="relative mt-16 pt-32 pb-20 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(252_87%_67%/0.12),transparent_60%)]" />
      <div className="relative mx-auto max-w-4xl text-center">
        {/* <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-primary" />
          Now powering 10,000+ events worldwide
        </div> */}

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Transforma tus eventos físicos en <span className="text-gradient">experiencias interactivas</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground mb-10">
          Los visitantes escanean códigos QR, obtienen insignias, completan recorridos y se mantienen activos. Todo esto
          mientras usted recibe análisis en tiempo real e información útil para la toma de decisiones.
        </p>

        <article className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="default" size="lg" className="text-base px-8 h-12" asChild>
            <Link href="/dashboard">
              Comienza tu evento
              <ArrowRight />
            </Link>
          </Button>

          <Button variant="outline" size="lg" className="text-base px-8 h-12">
            Ver más
          </Button>
        </article>
      </div>
    </section>
  );
}
