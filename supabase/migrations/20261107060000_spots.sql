-- R3 · bloque 1: catálogo de spots y spots del evento.
--
-- Un spot es de la organización y vive sin evento; ponerlo en un evento crea un
-- event_spot, que es lo que apunta el QR (/s/[id], permanente). Al publicar, el
-- event_spot congela nombre, descripción, logo y tipo en `snapshot`: renombrar el
-- spot en el catálogo no reescribe ediciones publicadas. Ver docs/PROYECTO.md.

create type public.spot_type as enum ('stand', 'attraction', 'sponsor', 'activity');

-- ---------------------------------------------------------------------------
-- spots: el catálogo. Se archivan, no se borran.
-- ---------------------------------------------------------------------------

create table public.spots (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  description     text,
  type            public.spot_type not null default 'stand',
  logo_path       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,
  archived_at     timestamptz,

  unique (id, organization_id),
  constraint spots_name_length check (char_length(name) between 2 and 120),
  constraint spots_description_length check (char_length(description) <= 500)
);

create index spots_org_idx on public.spots (organization_id);

create trigger spots_set_updated_at
  before update on public.spots
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- event_spots: un spot puesto en un evento. Todo lo propio de esta edición
-- (código, puesto, puntos, activo, overrides) vive acá.
-- ---------------------------------------------------------------------------

create table public.event_spots (
  id                   uuid primary key default gen_random_uuid(),
  event_id             uuid not null,
  organization_id      uuid not null references public.organizations (id) on delete cascade,
  spot_id              uuid not null,
  -- Corto y legible, se imprime junto al QR: "A12".
  code                 text not null,
  name_override        text,
  description_override text,
  booth                text,
  points               int not null default 1,
  is_active            boolean not null default true,
  sort_order           int not null default 0,
  -- Copia del catálogo congelada al publicar. Solo la escriben las funciones.
  snapshot             jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz,

  foreign key (event_id, organization_id)
    references public.events (id, organization_id) on delete cascade,
  -- restrict: un spot usado en un evento no se borra (se archiva).
  foreign key (spot_id, organization_id)
    references public.spots (id, organization_id) on delete restrict,
  unique (event_id, code),
  unique (event_id, spot_id),
  constraint event_spots_code_format check (code ~ '^[A-Z0-9][A-Z0-9-]{0,9}$'),
  constraint event_spots_points_positive check (points between 1 and 1000),
  constraint event_spots_name_override_length check (char_length(name_override) between 2 and 120),
  constraint event_spots_booth_length check (char_length(booth) <= 60)
);

create index event_spots_org_idx on public.event_spots (organization_id);
create index event_spots_spot_idx on public.event_spots (spot_id, organization_id);

create trigger event_spots_set_updated_at
  before update on public.event_spots
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- Snapshot
-- ---------------------------------------------------------------------------

create function app.spot_snapshot(p_spot public.spots)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'name',        p_spot.name,
    'description', p_spot.description,
    'logo_path',   p_spot.logo_path,
    'type',        p_spot.type,
    'frozen_at',   now()
  );
$$;

-- Al poner un spot en un evento: no se usan spots archivados, y si el evento ya
-- está publicado el snapshot se toma en ese momento.
create function app.prepare_event_spot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_spot public.spots;
begin
  select * into v_spot from public.spots where id = new.spot_id;

  if v_spot.archived_at is not null then
    raise exception 'El spot está archivado: desarchivalo para usarlo en un evento'
      using errcode = 'check_violation';
  end if;

  new.snapshot := case
    when exists (select 1 from public.events where id = new.event_id and status = 'published')
      then app.spot_snapshot(v_spot)
  end;
  return new;
end;
$$;

revoke all on function app.spot_snapshot(public.spots) from public;
revoke all on function app.prepare_event_spot() from public;

create trigger event_spots_prepare
  before insert on public.event_spots
  for each row execute function app.prepare_event_spot();

-- publish_event (R2) + congelar los snapshots de los spots del evento.
create or replace function public.publish_event(p_event_id uuid)
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

  update public.event_spots es
  set snapshot = app.spot_snapshot(s)
  from public.spots s
  where s.id = es.spot_id and es.event_id = p_event_id;

  update public.events
  set status = 'published', published_at = now()
  where id = p_event_id;

  perform app.audit(v_event.organization_id, 'event.published', 'event', p_event_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS: el equipo administra lo de su org; el developer lee (modo soporte).
-- Las lecturas públicas (portada y QR) llegan en R4 y R5.
-- ---------------------------------------------------------------------------

alter table public.spots       enable row level security;
alter table public.event_spots enable row level security;

create policy spots_select on public.spots
  for select to authenticated
  using ((select app.is_org_member(organization_id)) or (select app.is_developer()));

create policy spots_insert on public.spots
  for insert to authenticated
  with check ((select app.is_org_member(organization_id)));

create policy spots_update on public.spots
  for update to authenticated
  using ((select app.is_org_member(organization_id)))
  with check ((select app.is_org_member(organization_id)));

create policy event_spots_select on public.event_spots
  for select to authenticated
  using ((select app.is_org_member(organization_id)) or (select app.is_developer()));

create policy event_spots_insert on public.event_spots
  for insert to authenticated
  with check ((select app.is_org_member(organization_id)));

create policy event_spots_update on public.event_spots
  for update to authenticated
  using ((select app.is_org_member(organization_id)))
  with check ((select app.is_org_member(organization_id)));

create policy event_spots_delete on public.event_spots
  for delete to authenticated
  using ((select app.is_org_member(organization_id)));

-- Sin delete en spots (se archivan). snapshot no se escribe desde la API; el
-- spot y el evento de un event_spot no cambian.
grant select on public.spots to authenticated;
grant insert (organization_id, name, description, type, logo_path) on public.spots to authenticated;
grant update (name, description, type, logo_path, archived_at) on public.spots to authenticated;

grant select on public.event_spots to authenticated;
grant insert (event_id, organization_id, spot_id, code, name_override, description_override,
              booth, points, is_active, sort_order)
  on public.event_spots to authenticated;
grant update (code, name_override, description_override, booth, points, is_active, sort_order)
  on public.event_spots to authenticated;
grant delete on public.event_spots to authenticated;
