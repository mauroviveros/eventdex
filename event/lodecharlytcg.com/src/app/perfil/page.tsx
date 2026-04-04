import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/libs/supabase/server";
import { cookies } from "next/headers";
import Image from "next/image";

export default async function Perfil() {
  const supabase = await createClient((await cookies()))
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null
  const since = new Date(user.created_at).toLocaleDateString('es-AR', { month: "2-digit", day: "2-digit", year: "numeric" })
  return (
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
  )
}
