-- R6 · bloque 1: sorteos, extracciones, elegibilidad y draw_raffle().
--
-- Una extracción solo nace en draw_raffle() y solo cambia en void_raffle_draw():
-- nadie tiene insert, update ni delete sobre raffle_draws. Anular no borra, y
-- cada paso queda en audit_logs.

-- ---------------------------------------------------------------------------
-- raffles: un premio a sortear dentro de un evento.
-- ---------------------------------------------------------------------------

create table public.raffles (
  id                   uuid primary key default gen_random_uuid(),
  event_id             uuid not null,
  organization_id      uuid not null references public.organizations (id) on delete cascade,
  title                text not null check (char_length(trim(title)) between 1 and 120),
  -- Medallas que hacen falta para participar. Por sorteo: cada premio pide lo suyo.
  min_claims           integer not null default 1 check (min_claims >= 1),
  -- Null = los ganadores todavía no son públicos.
  winners_published_at timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz,

  foreign key (event_id, organization_id)
    references public.events (id, organization_id) on delete cascade,
  -- Destino de la FK compuesta de raffle_draws.
  unique (id, organization_id)
);

create index raffles_event_idx on public.raffles (event_id, organization_id);
create index raffles_org_idx on public.raffles (organization_id);

create trigger raffles_set_updated_at
  before update on public.raffles
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- raffle_draws: una tirada con su ganador. Varias por sorteo.
-- ---------------------------------------------------------------------------

create table public.raffle_draws (
  id              uuid primary key default gen_random_uuid(),
  raffle_id       uuid not null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  draw_number     integer not null check (draw_number >= 1),
  -- set null: una cuenta se puede borrar sin perder la extracción.
  winner_user_id  uuid references public.profiles (id) on delete set null,
  -- Lo público, congelado al extraer: nombre e inicial, nunca el mail.
  winner_name     text not null,
  -- Cuántos participaban en esta tirada: lo que permite auditar el resultado.
  eligible_count  integer not null check (eligible_count >= 1),
  drawn_by        uuid references public.profiles (id) on delete set null,
  drawn_at        timestamptz not null default now(),
  voided_at       timestamptz,
  voided_by       uuid references public.profiles (id) on delete set null,
  void_reason     text,

  -- no action: un sorteo con extracciones no se borra solo, pero sí con su org.
  foreign key (raffle_id, organization_id)
    references public.raffles (id, organization_id),
  unique (raffle_id, draw_number),
  -- Sin parcial por voided_at: quien salió y se anuló no vuelve a la tirada.
  unique (raffle_id, winner_user_id),
  constraint raffle_draws_void_has_reason check (
    (voided_at is null and void_reason is null)
    -- is not null explícito: un check con resultado null pasa.
    or (voided_at is not null and void_reason is not null and char_length(trim(void_reason)) between 1 and 300)
  )
);

create index raffle_draws_raffle_org_idx on public.raffle_draws (raffle_id, organization_id);
create index raffle_draws_org_idx on public.raffle_draws (organization_id);
create index raffle_draws_winner_idx on public.raffle_draws (winner_user_id);
create index raffle_draws_drawn_by_idx on public.raffle_draws (drawn_by);
create index raffle_draws_voided_by_idx on public.raffle_draws (voided_by);

-- ---------------------------------------------------------------------------
-- Elegibilidad: registrado, sin bloquear, con las medallas que pide el sorteo y
-- sin haber salido antes en este sorteo.
--
-- security invoker: el equipo ve a todos sus visitantes y un visitante, a lo
-- sumo, a sí mismo. draw_raffle() la llama como dueña, sin RLS de por medio.
-- ---------------------------------------------------------------------------

create function public.raffle_eligible(p_raffle_id uuid)
returns table (user_id uuid, claims bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select reg.user_id, count(*) as claims
  from public.raffles ra
  join public.event_registrations reg on reg.event_id = ra.event_id
  join public.spot_claims c on c.registration_id = reg.id
  where ra.id = p_raffle_id
    and reg.blocked_at is null
    and not exists (
      select 1 from public.raffle_draws d
      where d.raffle_id = ra.id and d.winner_user_id = reg.user_id
    )
  group by reg.user_id, ra.min_claims
  having count(*) >= ra.min_claims;
$$;

revoke all on function public.raffle_eligible(uuid) from public, anon;
grant execute on function public.raffle_eligible(uuid) to authenticated;

-- "Ana García" → "Ana G."; sin nombre, "Visitante". Nunca recibe el mail.
create function app.public_name(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when words is null        then 'Visitante'
    when cardinality(words) = 1 then words[1]
    else words[1] || ' ' || upper(left(words[cardinality(words)], 1)) || '.'
  end
  from (select regexp_split_to_array(nullif(trim(p_name), ''), '\s+') as words) w;
$$;

revoke all on function app.public_name(text) from public;

-- ---------------------------------------------------------------------------
-- draw_raffle: la única forma de extraer.
--
-- El bloqueo del sorteo ordena las tiradas simultáneas: la segunda ya ve al
-- ganador de la primera. gen_random_uuid() y no random(): sale del generador
-- criptográfico del sistema, no de una semilla.
-- ---------------------------------------------------------------------------

create function public.draw_raffle(p_raffle_id uuid)
returns public.raffle_draws
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raffle   public.raffles;
  v_eligible integer;
  v_winner   uuid;
  v_draw     public.raffle_draws;
begin
  select * into v_raffle from public.raffles where id = p_raffle_id for update;

  if not found or not (select app.is_org_member(v_raffle.organization_id)) then
    raise exception 'El sorteo no existe o no es de tu organización'
      using errcode = 'insufficient_privilege';
  end if;

  if not exists (
    select 1 from public.events
    where id = v_raffle.event_id and status = 'published' and deleted_at is null
  ) then
    raise exception 'Solo se sortea en un evento publicado'
      using errcode = 'check_violation';
  end if;

  -- Una sola lectura: el ganador y el total salen del mismo grupo.
  select e.user_id, count(*) over () into v_winner, v_eligible
  from public.raffle_eligible(p_raffle_id) e
  order by gen_random_uuid()
  limit 1;

  if not found then
    raise exception 'No hay participantes para este sorteo'
      using errcode = 'check_violation';
  end if;

  insert into public.raffle_draws (
    raffle_id, organization_id, draw_number, winner_user_id, winner_name, eligible_count, drawn_by
  )
  select
    p_raffle_id,
    v_raffle.organization_id,
    (select count(*) + 1 from public.raffle_draws where raffle_id = p_raffle_id),
    v_winner,
    app.public_name(coalesce(nullif(trim(p.display_name), ''), p.full_name)),
    v_eligible,
    (select auth.uid())
  from public.profiles p
  where p.id = v_winner
  returning * into v_draw;

  perform app.audit(
    v_raffle.organization_id, 'raffle.drawn', 'raffle_draw', v_draw.id,
    jsonb_build_object(
      'raffle_id', p_raffle_id,
      'draw_number', v_draw.draw_number,
      'winner_user_id', v_winner,
      'eligible_count', v_eligible
    )
  );

  return v_draw;
end;
$$;

revoke all on function public.draw_raffle(uuid) from public, anon;
grant execute on function public.draw_raffle(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- void_raffle_draw: anula sin borrar. Anular dos veces conserva el primer motivo.
-- ---------------------------------------------------------------------------

create function public.void_raffle_draw(p_draw_id uuid, p_reason text)
returns public.raffle_draws
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_draw public.raffle_draws;
begin
  select * into v_draw from public.raffle_draws where id = p_draw_id for update;

  if not found or not (select app.is_org_member(v_draw.organization_id)) then
    raise exception 'La extracción no existe o no es de tu organización'
      using errcode = 'insufficient_privilege';
  end if;

  if v_draw.voided_at is not null then
    return v_draw;
  end if;

  update public.raffle_draws
  set voided_at = now(), voided_by = (select auth.uid()), void_reason = trim(p_reason)
  where id = p_draw_id
  returning * into v_draw;

  perform app.audit(
    v_draw.organization_id, 'raffle.draw_voided', 'raffle_draw', v_draw.id,
    jsonb_build_object('raffle_id', v_draw.raffle_id, 'reason', v_draw.void_reason)
  );

  return v_draw;
end;
$$;

revoke all on function public.void_raffle_draw(uuid, text) from public, anon;
grant execute on function public.void_raffle_draw(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- publish_raffle_winners: hace públicos los ganadores. Es idempotente.
-- ---------------------------------------------------------------------------

create function public.publish_raffle_winners(p_raffle_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raffle public.raffles;
begin
  select * into v_raffle from public.raffles where id = p_raffle_id for update;

  if not found or not (select app.is_org_member(v_raffle.organization_id)) then
    raise exception 'El sorteo no existe o no es de tu organización'
      using errcode = 'insufficient_privilege';
  end if;

  if v_raffle.winners_published_at is not null then
    return;
  end if;

  if not exists (
    select 1 from public.raffle_draws where raffle_id = p_raffle_id and voided_at is null
  ) then
    raise exception 'Todavía no hay ganadores para publicar'
      using errcode = 'check_violation';
  end if;

  update public.raffles set winners_published_at = now() where id = p_raffle_id;

  perform app.audit(v_raffle.organization_id, 'raffle.winners_published', 'raffle', p_raffle_id);
end;
$$;

revoke all on function public.publish_raffle_winners(uuid) from public, anon;
grant execute on function public.publish_raffle_winners(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
--
-- Equipo: lee y crea los sorteos de su org. Developer: lee todo (modo soporte)
-- y no escribe. Cualquiera: los sorteos con ganadores publicados, sin las
-- extracciones anuladas. anon no llega a las columnas que identifican a alguien.
-- ---------------------------------------------------------------------------

alter table public.raffles      enable row level security;
alter table public.raffle_draws enable row level security;

create policy raffles_select_anon on public.raffles
  for select to anon
  using (winners_published_at is not null);

create policy raffles_select on public.raffles
  for select to authenticated
  using (
    winners_published_at is not null
    or (select app.is_org_member(organization_id))
    or (select app.is_developer())
  );

create policy raffles_insert on public.raffles
  for insert to authenticated
  with check ((select app.is_org_member(organization_id)));

create policy raffle_draws_select_anon on public.raffle_draws
  for select to anon
  using (
    voided_at is null
    and exists (
      select 1 from public.raffles r
      where r.id = raffle_id and r.winners_published_at is not null
    )
  );

create policy raffle_draws_select on public.raffle_draws
  for select to authenticated
  using (
    (select app.is_org_member(organization_id))
    or (select app.is_developer())
    or (
      voided_at is null
      and exists (
        select 1 from public.raffles r
        where r.id = raffle_id and r.winners_published_at is not null
      )
    )
  );

grant select on public.raffles to anon, authenticated;
grant insert (event_id, organization_id, title, min_claims) on public.raffles to authenticated;
grant select (id, raffle_id, organization_id, draw_number, winner_name, drawn_at)
  on public.raffle_draws to anon;
grant select on public.raffle_draws to authenticated;
