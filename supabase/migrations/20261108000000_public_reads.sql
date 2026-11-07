-- R4 · bloque 1: resolución pública por host y lecturas de la portada.
--
-- Funciones security invoker: corren con los permisos de quien llama (anon),
-- así que RLS sigue siendo la barrera. Solo ordenan y filtran lo que anon ya
-- puede leer.

-- La organización activa que sirve un host. Sin filas si el host no existe o la
-- org está suspendida o dada de baja. Una consulta: el proxy la usa en cada
-- request (con caché).
create function public.resolve_organization(p_host text)
returns table (
  id               uuid,
  slug             extensions.citext,
  name             text,
  brand_color      text,
  logo_path        text,
  default_timezone text
)
language sql
stable
set search_path = ''
as $$
  select o.id, o.slug, o.name, o.brand_color, o.logo_path, o.default_timezone
  from public.organization_domains d
  join public.organizations o on o.id = d.organization_id
  where d.hostname = lower(trim(p_host))
    and o.status = 'active'
    and o.deleted_at is null;
$$;

-- El evento que muestra la portada de una org, entre los publicados, públicos y
-- sin baja: el que está en curso (si hay varios, el que empezó antes); si no, el
-- próximo; si no, el último que terminó. Null si no hay ninguno.
create function public.resolve_active_event(p_organization_id uuid)
returns uuid
language sql
stable
set search_path = ''
as $$
  select e.id
  from public.events e
  join lateral (
    select min(s.starts_at) as starts_at, max(s.ends_at) as ends_at
    from public.event_schedules s
    where s.event_id = e.id
  ) r on r.starts_at is not null
  where e.organization_id = p_organization_id
    and e.status = 'published'
    and e.visibility = 'public'
    and e.deleted_at is null
  order by
    case
      when now() between r.starts_at and r.ends_at then 0
      when now() < r.starts_at then 1
      else 2
    end,
    -- En curso y próximos: el que empieza antes.
    case when now() <= r.ends_at then r.starts_at end asc nulls last,
    -- Terminados: el más reciente.
    r.ends_at desc
  limit 1;
$$;

revoke all on function public.resolve_organization(text) from public;
revoke all on function public.resolve_active_event(uuid) from public;
grant execute on function public.resolve_organization(text) to anon, authenticated;
grant execute on function public.resolve_active_event(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Spots de eventos publicados: públicos. Lo que muestran sale del snapshot (un
-- evento publicado siempre lo tiene), así que el catálogo (`spots`) sigue
-- privado.
-- ---------------------------------------------------------------------------

create policy event_spots_select_anon on public.event_spots
  for select to anon
  using (exists (
    select 1 from public.events e
    where e.id = event_spots.event_id and e.status = 'published' and e.deleted_at is null
  ));

drop policy event_spots_select on public.event_spots;

create policy event_spots_select on public.event_spots
  for select to authenticated
  using (
    (select app.is_org_member(organization_id))
    or (select app.is_developer())
    or exists (
      select 1 from public.events e
      where e.id = event_spots.event_id and e.status = 'published' and e.deleted_at is null
    )
  );

grant select on public.event_spots to anon;
