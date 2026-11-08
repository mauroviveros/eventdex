-- R5 · bloque 1: registros de visitantes, medallas y claim_spot().
--
-- Una medalla solo nace en claim_spot(): ni el visitante ni el equipo tienen
-- insert sobre spot_claims. La función registra al visitante si hace falta, es
-- idempotente y devuelve uno de los cinco resultados de la celebración.

create type public.claim_outcome as enum ('new', 'repeat', 'inactive', 'out_of_phase', 'blocked');

-- ---------------------------------------------------------------------------
-- event_registrations: visitante ↔ evento. Ancla de RLS y de bloqueos.
-- ---------------------------------------------------------------------------

create table public.event_registrations (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  -- Bloqueado por el equipo: no reclama más. Null = habilitado.
  blocked_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,

  foreign key (event_id, organization_id)
    references public.events (id, organization_id) on delete cascade,
  unique (event_id, user_id),
  -- Destino de la FK compuesta de spot_claims.
  unique (id, event_id, user_id)
);

create index event_registrations_user_idx on public.event_registrations (user_id);
create index event_registrations_org_idx on public.event_registrations (organization_id);

create trigger event_registrations_set_updated_at
  before update on public.event_registrations
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- spot_claims: medallas. Una por (spot del evento, visitante).
-- ---------------------------------------------------------------------------

-- Destino de la FK compuesta: el spot es del mismo evento que el registro.
alter table public.event_spots add constraint event_spots_id_event_unique unique (id, event_id);

create table public.spot_claims (
  id              uuid primary key default gen_random_uuid(),
  event_spot_id   uuid not null,
  registration_id uuid not null,
  event_id        uuid not null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null,
  claimed_at      timestamptz not null default now(),

  -- restrict: un spot con medallas no se borra del evento (se desactiva).
  foreign key (event_spot_id, event_id)
    references public.event_spots (id, event_id) on delete restrict,
  foreign key (registration_id, event_id, user_id)
    references public.event_registrations (id, event_id, user_id) on delete cascade,
  unique (event_spot_id, user_id)
);

create index spot_claims_event_user_idx on public.spot_claims (event_id, user_id);
create index spot_claims_registration_idx on public.spot_claims (registration_id, event_id, user_id);
create index spot_claims_org_idx on public.spot_claims (organization_id);

-- ---------------------------------------------------------------------------
-- claim_spot: la única forma de reclamar. Orden de los resultados:
--   1. bloqueado (aunque ya tuviera la medalla),
--   2. ya la tenía (aunque el evento haya terminado o el spot se apagara),
--   3. spot inactivo,
--   4. fuera de fase (antes de la primera jornada o después de la última),
--   5. medalla nueva: registra si hace falta y reclama.
-- Un QR de un evento sin publicar, dado de baja o inexistente es un error.
-- ---------------------------------------------------------------------------

create function public.claim_spot(p_event_spot_id uuid)
returns table (
  outcome    public.claim_outcome,
  claimed_at timestamptz,
  starts_at  timestamptz,
  ends_at    timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user    uuid := (select auth.uid());
  v_spot    public.event_spots;
  v_phase   public.event_phases;
  v_reg     public.event_registrations;
  v_claimed timestamptz;
begin
  if v_user is null then
    raise exception 'Iniciá sesión para reclamar la medalla'
      using errcode = 'insufficient_privilege';
  end if;

  select es.* into v_spot
  from public.event_spots es
  join public.events e on e.id = es.event_id
  where es.id = p_event_spot_id
    and e.status = 'published'
    and e.deleted_at is null;

  if not found then
    raise exception 'Este QR no corresponde a ningún evento publicado'
      using errcode = 'no_data_found';
  end if;

  select * into v_phase from public.event_phases where event_id = v_spot.event_id;

  select * into v_reg
  from public.event_registrations
  where event_id = v_spot.event_id and user_id = v_user;

  if v_reg.blocked_at is not null then
    return query select 'blocked'::public.claim_outcome, null::timestamptz, v_phase.starts_at, v_phase.ends_at;
    return;
  end if;

  select c.claimed_at into v_claimed
  from public.spot_claims c
  where c.event_spot_id = p_event_spot_id and c.user_id = v_user;

  if found then
    return query select 'repeat'::public.claim_outcome, v_claimed, v_phase.starts_at, v_phase.ends_at;
    return;
  end if;

  if not v_spot.is_active then
    return query select 'inactive'::public.claim_outcome, null::timestamptz, v_phase.starts_at, v_phase.ends_at;
    return;
  end if;

  if v_phase.phase is distinct from 'live' then
    return query select 'out_of_phase'::public.claim_outcome, null::timestamptz, v_phase.starts_at, v_phase.ends_at;
    return;
  end if;

  if v_reg.id is null then
    insert into public.event_registrations (event_id, organization_id, user_id)
    values (v_spot.event_id, v_spot.organization_id, v_user)
    on conflict (event_id, user_id) do nothing;

    select * into v_reg
    from public.event_registrations
    where event_id = v_spot.event_id and user_id = v_user;
  end if;

  -- Dos escaneos simultáneos: el segundo choca con el unique y ve "ya la tenías".
  insert into public.spot_claims (event_spot_id, registration_id, event_id, organization_id, user_id)
  values (p_event_spot_id, v_reg.id, v_spot.event_id, v_spot.organization_id, v_user)
  on conflict (event_spot_id, user_id) do nothing
  returning spot_claims.claimed_at into v_claimed;

  if v_claimed is null then
    select c.claimed_at into v_claimed
    from public.spot_claims c
    where c.event_spot_id = p_event_spot_id and c.user_id = v_user;
    return query select 'repeat'::public.claim_outcome, v_claimed, v_phase.starts_at, v_phase.ends_at;
    return;
  end if;

  return query select 'new'::public.claim_outcome, v_claimed, v_phase.starts_at, v_phase.ends_at;
end;
$$;

revoke all on function public.claim_spot(uuid) from public, anon;
grant execute on function public.claim_spot(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
--
-- Visitante: lee sus registros y sus medallas. Equipo: lee los de su org y
-- bloquea o desbloquea. Developer: lee todo (modo soporte) y no escribe.
-- Nadie inserta ni borra desde la API: las filas nacen en claim_spot().
-- ---------------------------------------------------------------------------

alter table public.event_registrations enable row level security;
alter table public.spot_claims         enable row level security;

create policy event_registrations_select on public.event_registrations
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select app.is_org_member(organization_id))
    or (select app.is_developer())
  );

create policy event_registrations_update on public.event_registrations
  for update to authenticated
  using ((select app.is_org_member(organization_id)))
  with check ((select app.is_org_member(organization_id)));

create policy spot_claims_select on public.spot_claims
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select app.is_org_member(organization_id))
    or (select app.is_developer())
  );

grant select on public.event_registrations to authenticated;
grant update (blocked_at) on public.event_registrations to authenticated;
grant select on public.spot_claims to authenticated;
