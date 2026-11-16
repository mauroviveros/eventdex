import { isActivityKind } from "@/domain/overview";
import type { Supabase } from "@/lib/supabase/server";

/**
 * The overview's reads, for the team. RLS decides what each count includes: the
 * team counts its whole org, anyone else only their own rows.
 */

/** The event's figures and funnel; zeros for an event with nothing yet. */
export async function getEventOverview(supabase: Supabase, eventId: string) {
  const { data, error } = await supabase.rpc("event_overview", {
    p_event_id: eventId,
  });
  if (error) throw error;
  const o = data[0];
  return {
    visitors: o?.visitors ?? 0,
    half: o?.half ?? 0,
    complete: o?.complete ?? 0,
    medals: o?.medals ?? 0,
    stands: o?.stands ?? 0,
    idleStands: o?.idle_stands ?? 0,
  };
}

export type EventOverview = Awaited<ReturnType<typeof getEventOverview>>;

/** Medals and newcomers per hour of the event's zone, only the hours with any. */
export async function listEventHours(supabase: Supabase, eventId: string) {
  const { data, error } = await supabase.rpc("event_hourly", {
    p_event_id: eventId,
  });
  if (error) throw error;
  return data;
}

/** Every stand of the event by medals, the most first. */
export async function listSpotRanking(supabase: Supabase, eventId: string) {
  const { data, error } = await supabase.rpc("event_spot_ranking", {
    p_event_id: eventId,
  });
  if (error) throw error;
  return data.map((s) => ({
    id: s.event_spot_id,
    code: s.code,
    name: s.name,
    active: s.is_active,
    medals: s.medals,
  }));
}

export type RankedSpot = Awaited<ReturnType<typeof listSpotRanking>>[number];

/** Unique visitors of the org and how many came to two or more events. */
export async function getOrgOverview(supabase: Supabase, orgId: string) {
  const { data, error } = await supabase.rpc("org_overview", {
    p_organization_id: orgId,
  });
  if (error) throw error;
  return { visitors: data[0]?.visitors ?? 0, returned: data[0]?.returned ?? 0 };
}

/**
 * The latest of the org, or of one event: medals (the first one of each visitor
 * marks their arrival), awards won and draws that stand. Newest first.
 */
export async function listActivity(
  supabase: Supabase,
  orgId: string,
  { eventId, limit }: { eventId?: string; limit?: number } = {},
) {
  const { data, error } = await supabase.rpc("org_activity", {
    p_organization_id: orgId,
    p_event_id: eventId,
    p_limit: limit,
  });
  if (error) throw error;
  return data.flatMap(({ kind, ...r }) =>
    isActivityKind(kind)
      ? [
          {
            kind,
            at: r.happened_at,
            eventId: r.event_id,
            userId: r.user_id,
            visitor: r.visitor,
            detail: r.detail,
            first: r.is_first,
          },
        ]
      : [],
  );
}

export type Activity = Awaited<ReturnType<typeof listActivity>>[number];
