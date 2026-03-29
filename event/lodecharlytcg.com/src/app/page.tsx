import { Countdown } from "@/components/countdown";
import { Card, CardContent } from "@/components/ui/card";
import { SITE } from "@/constants";
import { Icon } from "@iconify/react";

export const Hero = () => (
  <section className="flex-1 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-2 py-8 gap-8">
    <div className="max-w-3xl mx-auto flex flex-col items-center">
      <Card size="sm" className="mx-4">
        <CardContent className="flex items-center gap-2">
          <Icon icon="pixelarticons:clock" className="text-muted-foreground size-5" />
          <span className="text-xl text-accent">{SITE.schedules}</span>
        </CardContent>
      </Card>

      <Card className="highlight z-10">
        <CardContent className="font-press-start text-center space-y-1 px-2">
          <h1 className="text-3xl text-secondary text-balance">{SITE.title}</h1>
          <p className="text-xs text-muted-foreground text-pretty">{SITE.description}</p>
        </CardContent>
      </Card>

      <Card size="sm" className="mx-4">
        <CardContent>
          <h3 className="text-xl text-accent">{SITE.location}</h3>
          <p className="text-muted-foreground">{SITE.address}</p>
        </CardContent>
      </Card>
    </div>

    <Countdown />
  </section>
)

export default function Home() {
  return (
    <>
      <Hero/>
    </>
  )
}
