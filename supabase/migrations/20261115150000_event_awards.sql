-- R31 · bloque 1: premios por mérito.
--
-- Además del sorteo (azar), un premio se gana por lo que hizo el visitante: llegar
-- a N medallas o a un porcentaje de las del evento, con un cupo opcional («los
-- primeros 5 en completar todas»). Se asigna al escanear, dentro de claim_spot, en
-- la misma transacción que la medalla; el visitante lo retira en la organización.
--
-- Un premio con ganadores no se borra y su regla no se edita: los ganadores ya se
-- calcularon con ella. Para cambiarla se baja el premio y se crea otro mientras
-- nadie lo ganó.
-- shortcut: un premio creado con el evento en curso cuenta desde la próxima medalla de cada visitante, no es retroactivo; recalcular al crearlo si hace falta

create type public.award_kind as enum ('count', 'percent');

create table public.event_awards (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title           text not null check (char_length(trim(title)) between 1 and 120),
  description     text check (description is null or char_length(trim(description)) between 1 and 500),
  -- count: N medallas. percent: N% de las medallas activas del evento, redondeado hacia arriba.
  kind            public.award_kind not null,
  threshold       integer not null,
  -- Null = lo ganan todos los que lleguen.
  slots           integer check (slots is null or slots >= 1),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,

  foreign key (event_id, organization_id)
    references public.events (id, organization_id) on delete cascade,
  unique (id, event_id),
  check (
    (kind = 'count' and threshold >= 1)
    or (kind = 'percent' and threshold between 1 and 100)
  )
);

create index event_awards_event_idx on public.event_awards (event_id, organization_id);

create trigger event_awards_set_updated_at
  before update on public.event_awards
  for each row execute function app.set_updated_at();

create table public.award_winners (
  id              uuid primary key default gen_random_uuid(),
  award_id        uuid not null,
  event_id        uuid not null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  -- 1 para el primero en llegar. Sin repetidos por premio.
  position        integer not null check (position >= 1),
  won_at          timestamptz not null default now(),

  -- restrict: un premio con ganadores no se borra.
  foreign key (award_id, event_id)
    references public.event_awards (id, event_id) on delete restrict,
  unique (award_id, user_id),
  unique (award_id, position)
);

create index award_winners_user_idx on public.award_winners (event_id, user_id);
create index award_winners_org_idx on public.award_winners (organization_id);

-- ---------------------------------------------------------------------------
-- app.grant_awards: los premios que el visitante acaba de cruzar. Bloquea la fila
-- de cada premio mientras cuenta los ganadores, así «los primeros N» es exacto con
-- escaneos simultáneos (en orden de id, para que dos escaneos no se esperen en cruz).
-- ---------------------------------------------------------------------------

create function app.grant_awards(p_event_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_award  public.event_awards;
  v_mine   integer;
  v_total  integer;
  v_needed integer;
  v_taken  integer;
begin
  select count(*) into v_mine
  from public.spot_claims c
  where c.event_id = p_event_id and c.user_id = p_user_id;

  select count(*) into v_total
  from public.event_spots s
  where s.event_id = p_event_id and s.is_active;

  for v_award in
    select * from public.event_awards a
    where a.event_id = p_event_id
    order by a.id
    for update
  loop
    v_needed := case v_award.kind
      when 'count' then v_award.threshold
      else greatest(1, ceil(v_total * v_award.threshold / 100.0)::integer)
    end;
    continue when v_mine < v_needed;

    select count(*) into v_taken from public.award_winners w where w.award_id = v_award.id;
    continue when v_award.slots is not null and v_taken >= v_award.slots;

    insert into public.award_winners (award_id, event_id, organization_id, user_id, position)
    values (v_award.id, p_event_id, v_award.organization_id, p_user_id, v_taken + 1)
    on conflict (award_id, user_id) do nothing;
  end loop;
end;
$$;

revoke all on function app.grant_awards(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- claim_spot, igual que antes más la llamada a grant_awards con la medalla nueva.
-- ---------------------------------------------------------------------------

create or replace function public.claim_spot(p_event_spot_id uuid)
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

  -- La medalla que cruza el umbral de un premio lo gana, en la misma transacción.
  perform app.grant_awards(v_spot.event_id, v_user);

  return query select 'new'::public.claim_outcome, v_claimed, v_phase.starts_at, v_phase.ends_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- Cupos: cuántos ganaron ya cada premio de un evento publicado. Solo cifras: la
-- portada muestra «quedan 3 de 5» sin leer a nadie.
-- ---------------------------------------------------------------------------

create function public.event_award_counts(p_event_id uuid)
returns table (award_id uuid, taken bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, count(w.id)
  from public.event_awards a
  join public.events e on e.id = a.event_id
  left join public.award_winners w on w.award_id = a.id
  where a.event_id = p_event_id and e.status = 'published' and e.deleted_at is null
  group by a.id
$$;

revoke all on function public.event_award_counts(uuid) from public;
grant execute on function public.event_award_counts(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
--
-- Premios: los ve cualquiera si el evento está publicado (es parte de lo que atrae);
-- el equipo los crea, cambia título y descripción y los baja. Ganadores: los lee el
-- propio visitante y el equipo de la org; nadie escribe desde la API.
-- ---------------------------------------------------------------------------

alter table public.event_awards   enable row level security;
alter table public.award_winners  enable row level security;

create policy event_awards_select_anon on public.event_awards
  for select to anon
  using (exists (
    select 1 from public.events e
    where e.id = event_awards.event_id and e.status = 'published' and e.deleted_at is null
  ));

create policy event_awards_select on public.event_awards
  for select to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_awards.event_id and e.status = 'published' and e.deleted_at is null
    )
    or (select app.is_org_member(organization_id))
    or (select app.is_developer())
  );

create policy event_awards_insert on public.event_awards
  for insert to authenticated
  with check ((select app.is_org_member(organization_id)));

create policy event_awards_update on public.event_awards
  for update to authenticated
  using ((select app.is_org_member(organization_id)))
  with check ((select app.is_org_member(organization_id)));

create policy event_awards_delete on public.event_awards
  for delete to authenticated
  using ((select app.is_org_member(organization_id)));

create policy award_winners_select on public.award_winners
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select app.is_org_member(organization_id))
    or (select app.is_developer())
  );

grant select on public.event_awards to anon, authenticated;
grant insert (event_id, organization_id, title, description, kind, threshold, slots)
  on public.event_awards to authenticated;
grant update (title, description) on public.event_awards to authenticated;
grant delete on public.event_awards to authenticated;
grant select on public.award_winners to authenticated;
