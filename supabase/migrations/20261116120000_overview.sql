-- R32 · bloque 1: lecturas del overview de la org y de cada evento.
--
-- Todas security invoker: RLS decide qué filas cuenta cada uno. El equipo cuenta
-- todo lo de su org; cualquier otro, solo lo suyo. Nada se otorga a anon.
--
-- El registro nace en claim_spot() con la primera medalla, así que «registrados»
-- y «con una medalla» son lo mismo: el embudo va registrados → la mitad → todas.

-- Nombre que ve el equipo: el elegido, el de Google o «Visitante». Nunca el mail.
create function app.visitor_name(p_display text, p_full text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(nullif(trim(p_display), ''), nullif(trim(p_full), ''), 'Visitante');
$$;

revoke all on function app.visitor_name(text, text) from public;
grant execute on function app.visitor_name(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- event_overview: las cifras del evento y el embudo. La mitad y todas cuentan
-- solo los stands activos: uno apagado no da medalla.
-- ---------------------------------------------------------------------------

create function public.event_overview(p_event_id uuid)
returns table (
  visitors    integer,
  half        integer,
  complete    integer,
  medals      integer,
  stands      integer,
  idle_stands integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with active as (
    select id from public.event_spots where event_id = p_event_id and is_active
  ),
  goal as (
    select count(*)::int as stands, greatest(1, ceil(count(*) / 2.0))::int as half
    from active
  ),
  per_user as (
    select c.user_id, count(*) as n
    from public.spot_claims c
    where c.event_id = p_event_id and c.event_spot_id in (select id from active)
    group by c.user_id
  )
  select
    (select count(*)::int from public.event_registrations r where r.event_id = p_event_id),
    (select count(*)::int from per_user u where g.stands > 0 and u.n >= g.half),
    (select count(*)::int from per_user u where g.stands > 0 and u.n >= g.stands),
    (select count(*)::int from public.spot_claims c where c.event_id = p_event_id),
    g.stands,
    (select count(*)::int from active a
     where not exists (select 1 from public.spot_claims c where c.event_spot_id = a.id))
  from goal g
$$;

-- ---------------------------------------------------------------------------
-- event_hourly: medallas y visitantes nuevos por hora, en la zona del evento.
-- Solo las horas con actividad: los huecos los completa la vista.
-- ---------------------------------------------------------------------------

create function public.event_hourly(p_event_id uuid)
returns table (hour timestamptz, medals integer, newcomers integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    date_trunc('hour', c.claimed_at, e.timezone),
    count(*)::int,
    -- Nuevo: la primera medalla de su registro cae en esta hora.
    (count(*) filter (where not exists (
      select 1 from public.spot_claims p
      where p.registration_id = c.registration_id and p.claimed_at < c.claimed_at
    )))::int
  from public.spot_claims c
  join public.events e on e.id = c.event_id
  where c.event_id = p_event_id
  group by 1
  order by 1
$$;

-- ---------------------------------------------------------------------------
-- event_spot_ranking: cada stand del evento con sus medallas, de más a menos.
-- Incluye los que no tienen ninguna y los apagados (la vista los marca).
-- ---------------------------------------------------------------------------

create function public.event_spot_ranking(p_event_id uuid)
returns table (event_spot_id uuid, code text, name text, is_active boolean, medals integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select es.id, es.code, coalesce(es.name_override, es.snapshot ->> 'name', s.name),
         es.is_active, count(c.id)::int
  from public.event_spots es
  -- left: quien no lee el catálogo usa el nombre congelado al publicar.
  left join public.spots s on s.id = es.spot_id
  left join public.spot_claims c on c.event_spot_id = es.id
  where es.event_id = p_event_id
  group by es.id, s.name
  order by 5 desc, es.code
$$;

-- ---------------------------------------------------------------------------
-- org_overview: visitantes únicos de la org y cuántos fueron a dos o más eventos.
-- ---------------------------------------------------------------------------

create function public.org_overview(p_organization_id uuid)
returns table (visitors integer, returned integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)::int, (count(*) filter (where u.events >= 2))::int
  from (
    select r.user_id, count(distinct r.event_id) as events
    from public.event_registrations r
    join public.events e on e.id = r.event_id and e.deleted_at is null
    where r.organization_id = p_organization_id
    group by r.user_id
  ) u
$$;

-- ---------------------------------------------------------------------------
-- org_activity: lo último que pasó en la org, o en un evento si se pasa. Medallas
-- (la primera de cada visitante marca su llegada), premios ganados y sorteos sin
-- anular. Como mucho 100 filas.
-- ---------------------------------------------------------------------------

create function public.org_activity(
  p_organization_id uuid,
  p_event_id        uuid default null,
  p_limit           integer default 30
)
returns table (
  happened_at timestamptz,
  kind        text,
  event_id    uuid,
  user_id     uuid,
  visitor     text,
  detail      text,
  is_first    boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with lim as (select least(greatest(coalesce(p_limit, 30), 1), 100) as n)
  select * from (
    (select c.claimed_at, 'medalla', c.event_id, c.user_id,
            app.visitor_name(p.display_name, p.full_name),
            coalesce(es.name_override, es.snapshot ->> 'name', s.name),
            not exists (
              select 1 from public.spot_claims f
              where f.registration_id = c.registration_id and f.claimed_at < c.claimed_at
            )
     from public.spot_claims c
     join public.events e on e.id = c.event_id and e.deleted_at is null
     join public.event_spots es on es.id = c.event_spot_id
     left join public.spots s on s.id = es.spot_id
     left join public.profiles p on p.id = c.user_id
     where c.organization_id = p_organization_id
       and (p_event_id is null or c.event_id = p_event_id)
     order by c.claimed_at desc
     limit (select n from lim))
    union all
    (select w.won_at, 'premio', w.event_id, w.user_id,
            app.visitor_name(p.display_name, p.full_name), a.title, false
     from public.award_winners w
     join public.event_awards a on a.id = w.award_id
     join public.events e on e.id = w.event_id and e.deleted_at is null
     left join public.profiles p on p.id = w.user_id
     where w.organization_id = p_organization_id
       and (p_event_id is null or w.event_id = p_event_id)
     order by w.won_at desc
     limit (select n from lim))
    union all
    -- Sin cuenta (borrada), queda el nombre congelado al extraer.
    (select d.drawn_at, 'sorteo', ra.event_id, d.winner_user_id,
            case when p.id is null then d.winner_name
                 else app.visitor_name(p.display_name, p.full_name) end,
            ra.title, false
     from public.raffle_draws d
     join public.raffles ra on ra.id = d.raffle_id
     join public.events e on e.id = ra.event_id and e.deleted_at is null
     left join public.profiles p on p.id = d.winner_user_id
     where d.organization_id = p_organization_id
       and d.voided_at is null
       and (p_event_id is null or ra.event_id = p_event_id)
     order by d.drawn_at desc
     limit (select n from lim))
  ) a (happened_at, kind, event_id, user_id, visitor, detail, is_first)
  order by happened_at desc
  limit (select n from lim)
$$;

revoke all on function public.event_overview(uuid) from public, anon;
revoke all on function public.event_hourly(uuid) from public, anon;
revoke all on function public.event_spot_ranking(uuid) from public, anon;
revoke all on function public.org_overview(uuid) from public, anon;
revoke all on function public.org_activity(uuid, uuid, integer) from public, anon;

grant execute on function public.event_overview(uuid) to authenticated;
grant execute on function public.event_hourly(uuid) to authenticated;
grant execute on function public.event_spot_ranking(uuid) to authenticated;
grant execute on function public.org_overview(uuid) to authenticated;
grant execute on function public.org_activity(uuid, uuid, integer) to authenticated;
