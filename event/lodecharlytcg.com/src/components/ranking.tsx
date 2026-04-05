import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE_SLUG } from "@/constants";
import { createClient } from "@/libs/supabase/admin";
import { Medal } from "lucide-react";
import Image from "next/image";

type RankingUser = {
  id: string;
  fullName: string;
  avatarUrl: string;
  medals: number;
  firstCollectedAt: number;
  completionAt: number | null;
};

export default async function Ranking() {
  const supabase = createClient()

  // Get all spots for this event
  const { data: spots } = await supabase
    .from("event_spots")
    .select("id, event:event_id(slug)")
    .eq("event.slug", SITE_SLUG);

  if (!spots || spots.length === 0) return null;

  // Get medal history for this event only
  const { data: allHistory } = await supabase
    .from("user_spot_history")
    .select("user_id, spot_id, collected_at, spot:event_spots(event:event_id(slug))")
    .eq("spot.event.slug", SITE_SLUG);

  const totalSpots = spots.length;
  const historyByUser = new Map<string, Array<{ spotId: string; collectedAt: string }>>();

  allHistory?.forEach((record: { user_id: string; spot_id: string; collected_at: string }) => {
    const existing = historyByUser.get(record.user_id) ?? [];
    existing.push({ spotId: record.spot_id, collectedAt: record.collected_at });
    historyByUser.set(record.user_id, existing);
  });

  // Get all users (paginated) so users with 0 medals are included too
  const allUsers: Array<{ id: string; user_metadata?: Record<string, unknown> | null }> = [];
  const perPage = 200;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) break;

    const usersPage = data?.users ?? [];
    allUsers.push(...usersPage);

    if (usersPage.length < perPage) break;
    page += 1;
  }

  const usersRanking: RankingUser[] = allUsers
    .map((user) => {
      const metadata = user.user_metadata ?? {};
      const fullName = (metadata.full_name as string | undefined)
        ?? (metadata.name as string | undefined)
        ?? "Usuario";
      const avatarUrl = (metadata.avatar_url as string | undefined) ?? "";

      const scans = historyByUser.get(user.id) ?? [];
      const scansSorted = [...scans].sort(
        (a, b) => new Date(a.collectedAt).getTime() - new Date(b.collectedAt).getTime()
      );

      // Keep first scan per spot so duplicates don't inflate medals/completion.
      const seenSpots = new Set<string>();
      const uniqueScans = scansSorted.filter((scan) => {
        if (seenSpots.has(scan.spotId)) return false;
        seenSpots.add(scan.spotId);
        return true;
      });

      const medals = uniqueScans.length;
      const firstCollectedAt = uniqueScans[0]
        ? new Date(uniqueScans[0].collectedAt).getTime()
        : Number.POSITIVE_INFINITY;
      const completionAt = medals >= totalSpots && totalSpots > 0
        ? new Date(uniqueScans[totalSpots - 1].collectedAt).getTime()
        : null;

      return {
        id: user.id,
        fullName,
        avatarUrl,
        medals,
        firstCollectedAt,
        completionAt,
      };
    })
    .sort((a, b) => {
      if (b.medals !== a.medals) return b.medals - a.medals;

      // If both completed all spots, who finished first wins.
      if (a.completionAt !== null && b.completionAt !== null && a.completionAt !== b.completionAt) {
        return a.completionAt - b.completionAt;
      }

      // Otherwise, older first scan ranks higher.
      if (a.firstCollectedAt !== b.firstCollectedAt) {
        return a.firstCollectedAt - b.firstCollectedAt;
      }

      return a.fullName.localeCompare(b.fullName, "es");
    });

  if (usersRanking.length === 0) {
    return (
      <Card size="sm" className="my-4">
        <CardHeader>
          <CardTitle className="font-press-start text-secondary text-xl! text-center">
            Ranking
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          Sin coleccionistas aún
        </CardContent>
      </Card>
    );
  }

  const top3 = usersRanking.slice(0, 3);
  const restOfUsers = usersRanking.slice(3);

  // Order top 3 as: gold (1st), silver (2nd), bronze (3rd)
  const medals = ["🥇", "🥈", "🥉"];
  const orderedTop3 = top3.map((user, idx) => ({
    ...user,
    medal: medals[idx],
  }));

  return (
    <Card size="sm" className="my-4">
      <CardHeader>
        <CardTitle className="font-press-start text-secondary text-xl! text-center">
          Rankings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top 3 Podium */}
        {orderedTop3.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-6">
            {orderedTop3.map((user) => (
              <div
                key={user.id}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${user.medal === "🥇"
                  ? "bg-medal-gold/20 border-medal-gold"
                  : user.medal === "🥈"
                    ? "bg-slate-200/20 border-slate-300"
                    : "bg-orange-200/20 border-orange-300"
                  }`}
              >
                {user.avatarUrl && (
                  <Image
                    src={user.avatarUrl}
                    alt={user.fullName}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div className="w-full min-w-0 text-center">
                  <p className="font-bold text-sm truncate">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Medal className="size-3" />
                    {user.medals}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scrollable user list */}
        <div className="max-h-48 overflow-y-auto space-y-2 border-t pt-4">
          {restOfUsers.length > 0 ? (
            restOfUsers.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-secondary/5 hover:bg-secondary/10 transition-colors"
              >
                <div className="text-sm font-bold text-muted-foreground w-6">
                  #{index + 4}
                </div>
                {user.avatarUrl && (
                  <Image
                    src={user.avatarUrl}
                    alt={user.fullName}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{user.fullName}</p>
                </div>
                <div className="flex items-center gap-1 text-accent font-bold">
                  <Medal className="size-4" />
                  {user.medals}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground text-sm py-4">
              Sin más jugadores
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
