import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE_SLUG } from "@/constants";
import { createClient } from "@/libs/supabase/server";
import { cn } from "@/utils";
import { cookies } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function Perfil() {
  const supabase = await createClient((await cookies()))
  const { data: { user } } = await supabase.auth.getUser()
  const { data: spots } = await supabase
    .from("event_spots")
    .select(`*, event:event_id(id, slug, config)`)
    .eq("event.slug", SITE_SLUG)

  if (!user) return notFound()
  const since = new Date(user.created_at).toLocaleDateString('es-AR', { month: "2-digit", day: "2-digit", year: "numeric" })
  const { data: history } = await supabase
    .from("user_spot_history")
    .select(`*, spot:event_spots(*, event:event_id(slug))`)
    .eq("user_id", user.id)
    .eq("spot.event.slug", SITE_SLUG)
  return (
    <>
      <Card size="sm" className="highlight m-4">
        <CardContent className="grid gap-4 grid-cols-[auto_1fr] ">
          <Card className="p-0 h-fit w-fit row-span-1 sm:row-span-2 col-span-1">
            <Image
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata.full_name}
              width={100}
              height={100}
              loading="eager"
              decoding="sync"
            />
          </Card>

          <article className="min-w-0">
            <h2 className="font-press-start text-lg text-balance text-foreground">{user.user_metadata.full_name}</h2>
            <p className="text-xl text-pretty text-muted-foreground truncate">{user.email}</p>
          </article>

          <div className="space-x-2 flex items-center flex-wrap col-span-2 sm:col-span-1 gap-2">
            <Badge className="uppercase font-bold text-base">USUARIO</Badge>
            <span className="text-lg">Desde: {since}</span>
          </div>
        </CardContent>
      </Card>

      <Card size="sm" className="my-4">
        <CardHeader>
          <CardTitle className="font-press-start text-secondary text-xl! text-center">Medallas obtenidas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 justify-items-center">
          {spots?.map(({ avatar_path, name, id }, index) => {
            const avatar_url = supabase.storage.from("spot").getPublicUrl(avatar_path).data.publicUrl;
            return (
              <div
                className={cn([
                  "flex items-center justify-center pixel-border-sm transition-all w-32 h-32 text-3xl bg-linear-to-br ",
                  history?.some(h => !!h.collected_at && h.spot_id === id) ? "from-medal-gold to-accent shadow-medal-gold shadow-sm" : "bg-medal-locked grayscale opacity-50"
                ])}
                key={index}
              >
                <Image
                  src={avatar_url}
                  alt={name}
                  width={128}
                  height={128}
                  loading="eager"
                  decoding="sync"
                  className="w-full h-full object-cover opacity-85"
                />
              </div>
            )
          })}
        </CardContent>
      </Card>
    </>
  )
}
