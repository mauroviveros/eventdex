-- R33 · bloque 1: lecturas de los informes.
--
-- Como las del overview (R32): security invoker, RLS decide qué cuenta cada uno y
-- nada se otorga a anon. Las cifras del evento y su afluencia ya las dan
-- event_overview y event_hourly; acá va lo que pide el informe de un stand y el
-- cuadro de premios y sorteos del Resumen.

-- ---------------------------------------------------------------------------
-- spot_report: un stand dentro de su evento. Las visitas son sus medallas (una
-- por visitante). Primera parada: los visitantes cuya primera medalla, por
-- (momento, id), fue en este stand. Puesto con rank(): dos stands con las mismas
-- medallas comparten el lugar. El promedio y la cuenta de stands son de los
-- activos, como en event_overview; el puesto, entre todos los del evento.
-- ---------------------------------------------------------------------------

create function public.spot_report(p_event_spot_id uuid)
returns table (
  event_id    uuid,
  visits      integer,
  first_stops integer,
  rank        integer,
  stands      integer,
  average     numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (
    select es.event_id from public.event_spots es where es.id = p_event_spot_id
  ),
  per_spot as (
    select es.id, es.is_active, count(c.id)::int as medals
    from public.event_spots es
    left join public.spot_claims c on c.event_spot_id = es.id
    where es.event_id = (select event_id from me)
    group by es.id
  ),
  ranked as (
    select id, medals, rank() over (order by medals desc)::int as rank from per_spot
  )
  select
    m.event_id,
    r.medals,
    (select count(*)::int
     from public.spot_claims c
     where c.event_spot_id = p_event_spot_id
       and not exists (
         select 1 from public.spot_claims f
         where f.registration_id = c.registration_id
           and (f.claimed_at, f.id) < (c.claimed_at, c.id)
       )),
    r.rank,
    (select count(*)::int from per_spot where is_active),
    (select round(avg(medals), 1) from per_spot where is_active)
  from me m
  join ranked r on r.id = p_event_spot_id
$$;

-- ---------------------------------------------------------------------------
-- spot_hourly: las medallas de un stand por hora, en la zona del evento. Solo las
-- horas con actividad, como event_hourly, que da la afluencia de todo el evento.
-- ---------------------------------------------------------------------------

create function public.spot_hourly(p_event_spot_id uuid)
returns table (hour timestamptz, medals integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select date_trunc('hour', c.claimed_at, e.timezone), count(*)::int
  from public.spot_claims c
  join public.events e on e.id = c.event_id
  where c.event_spot_id = p_event_spot_id
  group by 1
  order by 1
$$;

-- ---------------------------------------------------------------------------
-- event_prizes: cada premio por mérito y cada sorteo del evento, para ver si
-- estaban bien calibrados. needed: las medallas que pedía (un porcentaje se
-- calcula sobre los stands activos, como en app.grant_awards). reached: cuántos
-- visitantes sin bloquear llegaron. winners: premios dados o extracciones sin
-- anular. slots: el cupo del premio (null = sin cupo; un sorteo no tiene).
-- ---------------------------------------------------------------------------

create function public.event_prizes(p_event_id uuid)
returns table (
  kind    text,
  id      uuid,
  title   text,
  needed  integer,
  slots   integer,
  winners integer,
  reached integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with total as (
    select count(*) as n from public.event_spots
    where event_id = p_event_id and is_active
  ),
  per_user as (
    select r.user_id, count(c.id) as n
    from public.event_registrations r
    join public.spot_claims c on c.registration_id = r.id
    where r.event_id = p_event_id and r.blocked_at is null
    group by r.user_id
  ),
  prizes as (
    select 'premio' as kind, a.id, a.title,
           case a.kind when 'count' then a.threshold
                else greatest(1, ceil((select n from total) * a.threshold / 100.0))::int end as needed,
           a.slots,
           (select count(*)::int from public.award_winners w where w.award_id = a.id) as winners,
           a.created_at
    from public.event_awards a
    where a.event_id = p_event_id
    union all
    select 'sorteo', ra.id, ra.title, ra.min_claims, null::int,
           (select count(*)::int from public.raffle_draws d
            where d.raffle_id = ra.id and d.voided_at is null),
           ra.created_at
    from public.raffles ra
    where ra.event_id = p_event_id
  )
  select p.kind, p.id, p.title, p.needed, p.slots, p.winners,
         (select count(*)::int from per_user u where u.n >= p.needed)
  from prizes p
  order by p.kind, p.needed, p.created_at, p.id
$$;

revoke all on function public.spot_report(uuid) from public, anon;
revoke all on function public.spot_hourly(uuid) from public, anon;
revoke all on function public.event_prizes(uuid) from public, anon;

grant execute on function public.spot_report(uuid) to authenticated;
grant execute on function public.spot_hourly(uuid) to authenticated;
grant execute on function public.event_prizes(uuid) to authenticated;
