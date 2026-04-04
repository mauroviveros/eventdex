import { LoginDialog } from "@/components/dialogs/login";
import { Card, CardContent } from "@/components/ui/card";
import { SITE_SLUG } from "@/constants";
import { createClient } from "@/libs/supabase/server";
import { cookies } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function SpotQR({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  const { data: spot } = await supabase
    .from("event_spots")
    .select(`*, event:event_id(id, slug, config)`)
    .eq("id", id)
    .eq("event.slug", SITE_SLUG)
    .maybeSingle();

  if (!spot || !spot.event) notFound();

  const isLoggedIn = !!user;
  if (!isLoggedIn) return <LoginDialog open={true} />

  const { data: history, error } = await supabase.from("user_spot_history").select("id").eq("user_id", user.id).eq("spot_id", spot.id).maybeSingle();
  const hasCollected = !!history;
  if (!hasCollected && !error) {
    await supabase.from("user_spot_history").insert({ user_id: user.id, spot_id: spot.id, collected_at: new Date().toISOString() })
  }

  const avatar_url = supabase.storage.from("spot").getPublicUrl(spot.avatar_path).data.publicUrl;

  return (
    <>
      <section className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-1 py-8"> {/* px-4 pokecard */}
        <Card className="highlight w-full max-w-2xl">
          <CardContent className="space-y-6 px-2 py-8 flex flex-col items-center justify-center">
            <div className="space-y-2 text-center">
              <h2 className="font-press-start text-2xl text-pretty text-secondary">¡Has conseguido una medalla!</h2>
            </div>

            <picture className="size-32 flex items-center justify-center pixel-border-sm bg-linear-to-br from-medal-gold to-accent medal-glow">
              <Image
                src={avatar_url}
                alt={spot.name}
                width={128}
                height={128}
                className="size-full opacity-85"
                loading="eager"
                decoding="async"
              />
            </picture>
          </CardContent>
        </Card>
      </section>
    </>

  );
}


// 1ee1e080-fd73-4796-9cbc-183225ce1cba
// 2d947897-c77e-45e7-aedc-30f729edc5dd
// 7a9c60fd-1b79-4fcf-9383-7c1dd59caccc
// 86bed9e3-200e-4c45-ace7-c03262003bb0
// 8fae90a3-4f67-4ccf-bd6f-ec42db9a91ba
// <section className="min-h-[calc(100dvh-5rem)] w-full max-w-sm flex flex-col items-center justify-center mx-auto py-4">
//   <PokemonCard className="" />
// </section>
