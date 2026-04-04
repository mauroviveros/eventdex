import { cn } from "@/utils"
import { Trophy } from "lucide-react"
import Link from "next/link"
import { ComponentProps } from "react"
import { InstagramIcon } from "./icons/lucide-instagram"

type Props = ComponentProps<'span'>
export const PokemonCard = ({ className }: Props) => (
  // borde de la carta
  <article
    className={cn("rounded-xl p-1.5 overflow-hidden w-full", className)}
    style={{ background: "linear-gradient(145deg, hsl(45 85% 60%), hsl(30 70% 40%), hsl(45 90% 55%), hsl(35 65% 35%))" }}
  >
    {/* inner card */}
    <div className="bg-[#353527] text-card-foreground overflow-hidden">
      {/* top bar - type HP & nombre */}
      <header className="font-press-start flex items-center justify-between text-foreground px-4 pt-3 pb-1 gap-1">
        <span className="text-[10px] truncate">Pokestock Caballito TCG</span>
        <span className="text-[9px] text-secondary">
          HP<span className="text-foreground">100</span>
        </span>
      </header>
      {/* area de ilustracion */}
      <picture className="block mx-3 mb-2">
        <div className="relative aspect-4/3 flex items-center justify-center border-2 border-border rounded-xs bg-border/20">

        </div>
      </picture>

      <p className="px-4 pb-2 text-sm text-muted-foreground italic min-h-5"></p>

      <div className="mx-3 mb-2 border border-border rounded-xs bg-border/20 p-3 h-28">

      </div>

      <div className="mx-3 mb-2 border border-border rounded-xs bg-border/20 px-3 py-2">
        <Link
          href="https://www.instagram.com/pokestockcaballito/"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-accent transition-colors"
        >
          <InstagramIcon size={14} />
          <span className="text-sm">@pokestockcaballito</span>
        </Link>

      </div>

      <div className="mx-3 mb-3">
        <div className="flex items-center justify-center gap-2 py-2 bg-accent/20 border border-accent rounded-sm">
          <Trophy size={14} className="text-accent" />
          <span className="text-sm text-accent">¡Medalla obtenida!</span>
        </div>
      </div>

      <footer className="px-4 pb-3 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          lodecharlytcg.com 2026 · #001/005
        </span>

        <span className="text-[10px] text-muted-foreground">
          ★
        </span>
      </footer>
    </div>
  </article>
)
