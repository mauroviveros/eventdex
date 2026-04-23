import SquaredBackground from "@/components/background/squared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import "@/styles/eventdex.css";
import { GoogleOriginalIcon } from "@devicon/react";
import { ArrowRight, Building2, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <>
      <SquaredBackground />
      <main className="w-full max-w-md flex flex-col justify-center items-center mx-auto h-dvh p-4">
        <header className="text-center mb-10 flex flex-col gap-6">
          <Link href="/">
            <span className="text-5xl font-bold text-gradient">Eventdex</span>
          </Link>

          <hgroup className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Bienvenido</h1>
            <p className="text-muted-foreground">Ingresa a tu cuenta para continuar</p>
          </hgroup>
        </header>

        <Card className="border-gradient bg-card/60 backdrop-blur-xl shadow-2xl shadow-primary/5">
          <CardContent className="space-y-6">
            <form method="post" action="/api/auth/signin">
              <input type="hidden" name="provider" value="google" />
              <Button type="submit" variant="outline" size="lg" className="w-full bg-background/50 hover:bg-accent/80">
                <GoogleOriginalIcon />
                Continuar con Google
              </Button>
            </form>

            <article className="rounded-xl border border-border/60 bg-background/30 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                  <Building2 className="size-4 text-primary" />
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground">¿No tienes una organización?</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Para acceder al dashboard necesitas una organización asignada. Contacta a nuestro equipo para
                    configurar tu cuenta.
                  </p>
                </div>
              </div>

              <Button variant="outline" className="w-full" disabled>
                {/* asChild */}
                {/* <a href="mailto:maurod.viveros@gmail.com"> */}
                <MessageCircle className="size-4 mr-2" />
                Contactar al equipo
                <ArrowRight className="h-3.5 w-3.5 ml-auto transition-transform group-hover:translate-x-1" />
                {/* </a> */}
              </Button>
            </article>
          </CardContent>
        </Card>

        <footer className="flex items-center justify-between mt-6 text-xs text-muted-foreground w-full">
          <Link href="/" className="hover:text-primary transition-colors">
            ← Volver al inicio
          </Link>

          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-primary transition-colors">
              Términos
            </Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacidad
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
