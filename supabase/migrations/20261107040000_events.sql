-- R2 · bloque 1: sedes, eventos y jornadas.
--
-- El `status` editorial (draft → published → archived | cancelled) se guarda;
-- la fase temporal (upcoming / live / finished) se calcula desde las jornadas
-- en la vista event_phases y nunca se guarda. Ver docs/PROYECTO.md.

create type public.event_status     as enum ('draft', 'published', 'archived', 'cancelled');
-- unlisted: se abre por link pero no aparece en la portada de la org.
create type public.event_visibility as enum ('public', 'unlisted');
create type public.event_phase      as enum ('upcoming', 'live', 'finished');

-- ---------------------------------------------------------------------------
-- venues: sedes de la org. Definen la zona horaria que hereda el evento.
-- ---------------------------------------------------------------------------

create table public.venues (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  address_line    text,
  city            text,
  state           text,
  country         char(2) not null default 'AR',
  postal_code     text,
  timezone        text not null default 'America/Argentina/Buenos_Aires',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,
  deleted_at      timestamptz,

  -- Destino de las FK compuestas: un evento solo usa sedes de su org.
  unique (id, organization_id),
  constraint venues_name_length check (char_length(name) between 2 and 120),
  constraint venues_country_format check (country ~ '^[A-Z]{2}$')
);

create index venues_org_idx on public.venues (organization_id);

create trigger venues_set_updated_at
  before update on public.venues
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- events: cada edición es un evento. Duplicar reemplaza a las series.
-- ---------------------------------------------------------------------------

create table public.events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  venue_id        uuid,
  slug            extensions.citext not null,
  title           text not null,
  edition_label   text,
  summary         text,
  description     text,
  cover_path      text,
  -- Solo para mostrar: los instantes viven en timestamptz.
  timezone        text not null default 'America/Argentina/Buenos_Aires',
  status          public.event_status not null default 'draft',
  visibility      public.event_visibility not null default 'public',
  settings        jsonb not null default '{}'::jsonb,
  published_at    timestamptz,
  created_by      uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,
  deleted_at      timestamptz,

  unique (id, organization_id),
  foreign key (venue_id, organization_id)
    references public.venues (id, organization_id) on delete set null (venue_id),
  constraint events_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  constraint events_title_length check (char_length(title) between 2 and 160),
  constraint events_settings_object check (jsonb_typeof(settings) = 'object'),
  constraint events_published_at check (status <> 'published' or published_at is not null)
);

-- El slug arma la URL pública; se libera al dar de baja el evento.
create unique index events_org_slug_unique
  on public.events (organization_id, slug)
  where deleted_at is null;

-- Camino caliente de la app pública: los publicados de una org.
create index events_org_status_idx
  on public.events (organization_id, status)
  where deleted_at is null;

create index events_venue_idx on public.events (venue_id);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- event_schedules: jornadas. De acá sale la fase.
-- ---------------------------------------------------------------------------

create table public.event_schedules (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  label           text,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,

  foreign key (event_id, organization_id)
    references public.events (id, organization_id) on delete cascade,
  constraint event_schedules_range check (ends_at > starts_at),
  constraint event_schedules_label_length check (char_length(label) <= 60)
);

create index event_schedules_event_idx on public.event_schedules (event_id, starts_at);
create index event_schedules_org_idx on public.event_schedules (organization_id);

create trigger event_schedules_set_updated_at
  before update on public.event_schedules
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- Fase: de la primera jornada al fin de la última. Un evento de sábado y
-- domingo sigue "en curso" el sábado a la noche. Sin jornadas, la fase es null
-- (en la interfaz, "sin fecha").
-- ---------------------------------------------------------------------------

create view public.event_phases
with (security_invoker = true) as
select
  e.id              as event_id,
  e.organization_id,
  min(s.starts_at)  as starts_at,
  max(s.ends_at)    as ends_at,
  case
    when count(s.id) = 0           then null
    when now() < min(s.starts_at)  then 'upcoming'::public.event_phase
    when now() > max(s.ends_at)    then 'finished'::public.event_phase
    else                                'live'::public.event_phase
  end as phase
from public.events e
left join public.event_schedules s on s.event_id = e.id
group by e.id, e.organization_id;

-- ---------------------------------------------------------------------------
-- publish_event: la única forma de publicar. Exige al menos una jornada y deja
-- rastro. Publicar dos veces no hace nada.
-- ---------------------------------------------------------------------------

create function public.publish_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
begin
  select * into v_event
  from public.events
  where id = p_event_id and deleted_at is null
  for update;

  if not found or not (select app.is_org_member(v_event.organization_id)) then
    raise exception 'El evento no existe o no es de tu organización'
      using errcode = 'insufficient_privilege';
  end if;

  if v_event.status = 'published' then
    return;
  end if;

  if v_event.status <> 'draft' then
    raise exception 'Solo se publica un borrador'
      using errcode = 'check_violation';
  end if;

  if not exists (select 1 from public.event_schedules where event_id = p_event_id) then
    raise exception 'El evento necesita al menos una jornada para publicarse'
      using errcode = 'check_violation';
  end if;

  update public.events
  set status = 'published', published_at = now()
  where id = p_event_id;

  perform app.audit(v_event.organization_id, 'event.published', 'event', p_event_id);
end;
$$;

revoke all on function public.publish_event(uuid) from public, anon;
grant execute on function public.publish_event(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
--
-- anon: eventos publicados (también los unlisted: RLS no distingue "listar"
-- de "abrir por link"; la portada filtra por visibility), sus jornadas y su
-- sede. Equipo: todo lo de su org. Developer: lee todo (modo soporte) y no
-- escribe.
-- ---------------------------------------------------------------------------

alter table public.venues          enable row level security;
alter table public.events          enable row level security;
alter table public.event_schedules enable row level security;

-- venues
create policy venues_select_anon on public.venues
  for select to anon
  using (exists (
    select 1 from public.events e
    where e.venue_id = venues.id and e.status = 'published' and e.deleted_at is null
  ));

create policy venues_select on public.venues
  for select to authenticated
  using (
    (select app.is_org_member(organization_id))
    or (select app.is_developer())
    or exists (
      select 1 from public.events e
      where e.venue_id = venues.id and e.status = 'published' and e.deleted_at is null
    )
  );

create policy venues_insert on public.venues
  for insert to authenticated
  with check ((select app.is_org_member(organization_id)));

create policy venues_update on public.venues
  for update to authenticated
  using ((select app.is_org_member(organization_id)))
  with check ((select app.is_org_member(organization_id)));

-- events
create policy events_select_anon on public.events
  for select to anon
  using (status = 'published' and deleted_at is null);

create policy events_select on public.events
  for select to authenticated
  using (
    (status = 'published' and deleted_at is null)
    or (select app.is_org_member(organization_id))
    or (select app.is_developer())
  );

create policy events_insert on public.events
  for insert to authenticated
  with check ((select app.is_org_member(organization_id)));

create policy events_update on public.events
  for update to authenticated
  using ((select app.is_org_member(organization_id)))
  with check ((select app.is_org_member(organization_id)));

-- event_schedules
create policy event_schedules_select_anon on public.event_schedules
  for select to anon
  using (exists (
    select 1 from public.events e
    where e.id = event_schedules.event_id and e.status = 'published' and e.deleted_at is null
  ));

create policy event_schedules_select on public.event_schedules
  for select to authenticated
  using (
    (select app.is_org_member(organization_id))
    or (select app.is_developer())
    or exists (
      select 1 from public.events e
      where e.id = event_schedules.event_id and e.status = 'published' and e.deleted_at is null
    )
  );

create policy event_schedules_insert on public.event_schedules
  for insert to authenticated
  with check ((select app.is_org_member(organization_id)));

create policy event_schedules_update on public.event_schedules
  for update to authenticated
  using ((select app.is_org_member(organization_id)))
  with check ((select app.is_org_member(organization_id)));

create policy event_schedules_delete on public.event_schedules
  for delete to authenticated
  using ((select app.is_org_member(organization_id)));

-- ---------------------------------------------------------------------------
-- Permisos. Sedes y eventos se dan de baja con deleted_at, no se borran.
-- status y published_at quedan fuera: solo publish_event() los cambia.
-- organization_id tampoco se actualiza: nada se muda de org.
-- ---------------------------------------------------------------------------

grant select on public.venues to anon, authenticated;
grant insert (organization_id, name, address_line, city, state, country, postal_code, timezone)
  on public.venues to authenticated;
grant update (name, address_line, city, state, country, postal_code, timezone, deleted_at)
  on public.venues to authenticated;

grant select on public.events to anon, authenticated;
grant insert (organization_id, venue_id, slug, title, edition_label, summary, description,
              cover_path, timezone, visibility, settings)
  on public.events to authenticated;
grant update (venue_id, slug, title, edition_label, summary, description, cover_path,
              timezone, visibility, settings, deleted_at)
  on public.events to authenticated;

grant select on public.event_schedules to anon, authenticated;
grant insert (event_id, organization_id, label, starts_at, ends_at)
  on public.event_schedules to authenticated;
grant update (label, starts_at, ends_at) on public.event_schedules to authenticated;
grant delete on public.event_schedules to authenticated;

grant select on public.event_phases to anon, authenticated;
