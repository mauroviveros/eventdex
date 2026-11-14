-- R21 · bloque 2: las ediciones anteriores de la org, con sus cifras.
--
-- La portada muestra cuánta gente jugó en las ediciones pasadas: visitantes
-- (registrados con su primera medalla) y medallas. Anon no lee registros ni
-- reclamos (son de cada persona), así que esto es una función security definer
-- que devuelve solo los dos totales, de eventos publicados, públicos y
-- terminados. Nunca una fila de una persona.
-- ---------------------------------------------------------------------------

create function public.past_editions(p_organization_id uuid, p_event_id uuid)
returns table (
  slug          text,
  title         text,
  edition_label text,
  ended_at      timestamptz,
  visitors      bigint,
  medals        bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.slug::text,
    e.title,
    e.edition_label,
    r.ends_at,
    (select count(*) from public.event_registrations g where g.event_id = e.id),
    (select count(*) from public.spot_claims c where c.event_id = e.id)
  from public.events e
  join lateral (
    select max(s.ends_at) as ends_at
    from public.event_schedules s
    where s.event_id = e.id
  ) r on r.ends_at < now()
  where e.organization_id = p_organization_id
    and e.id <> p_event_id
    and e.status = 'published'
    and e.visibility = 'public'
    and e.deleted_at is null
  order by r.ends_at desc
  limit 6;
$$;

revoke all on function public.past_editions(uuid, uuid) from public;
grant execute on function public.past_editions(uuid, uuid) to anon, authenticated;
