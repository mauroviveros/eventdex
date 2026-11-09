-- Separa los dos eventos de Burning Tower Fest de la org de Lo de Charly TCG. Se corre
-- una sola vez y a mano, en el SQL Editor. Todo o nada: si un conteo no da, no queda
-- ningún cambio. Después va 06_copy_burning_tower_logos.mjs.

begin;

create temp table ctx on commit drop as
  select id as old_org, gen_random_uuid() as new_org
  from public.organizations where slug = 'lodecharlytcg';

create temp table bt_events on commit drop as
  select e.id from public.events e, ctx
  where e.organization_id = ctx.old_org
    and e.slug in ('burning-tower-fest-mayo-2026', 'burning-tower-fest-2026');

-- Spots del catálogo que usan los dos grupos: BT recibe una copia.
create temp table spot_use on commit drop as
  select
    es.spot_id,
    bool_or(es.event_id in (select id from bt_events)) as in_bt,
    bool_or(es.event_id not in (select id from bt_events)) as in_charly
  from public.event_spots es, ctx
  where es.organization_id = ctx.old_org
  group by es.spot_id;

create temp table spot_copies on commit drop as
  select spot_id as old_id, gen_random_uuid() as new_id
  from spot_use where in_bt and in_charly;

do $$
begin
  if (select count(*) from ctx) <> 1 then
    raise exception 'No existe la org lodecharlytcg: no se separa nada';
  end if;
  if exists (select 1 from public.organizations where slug = 'burning-tower-fest') then
    raise exception 'La org burning-tower-fest ya existe: esto ya se corrió';
  end if;
  if (select count(*) from bt_events) <> 2
    or (select count(*) from public.events e, ctx where e.organization_id = ctx.old_org) <> 4 then
    raise exception 'La org no tiene los 4 eventos esperados';
  end if;
  if (select count(*) from spot_copies) <> 5 then
    raise exception 'Los spots compartidos no son los 5 esperados';
  end if;
  if exists (select 1 from public.raffles where event_id in (select id from bt_events)) then
    raise exception 'Los eventos tienen sorteos: este script no los mueve';
  end if;
  if (select count(*) from public.events
      where venue_id = 'c8c59214-f861-1b13-e9d1-f3345d8b7532') <> 1 then
    raise exception 'La sede duplicada tiene más de un evento';
  end if;
end;
$$;

insert into public.organizations (id, slug, name)
  select new_org, 'burning-tower-fest', 'Burning Tower Fest' from ctx;

select app.audit(new_org, 'organization.created', 'organization', new_org,
  jsonb_build_object('slug', 'burning-tower-fest', 'split_from', 'lodecharlytcg'))
from ctx;

-- El principal baja primero: el índice admite uno solo por org y no se puede diferir.
update public.organization_domains d set is_primary = false
  from ctx where d.organization_id = ctx.old_org and d.is_primary;

insert into public.organization_domains (organization_id, hostname, is_primary)
  select old_org, 'eventdex-lodecharlytcg.vercel.app', true from ctx
  union all
  select new_org, 'eventdex-burningtowerfest.vercel.app', true from ctx;

insert into public.organization_members (organization_id, user_id, role)
  select ctx.new_org, m.user_id, m.role
  from public.organization_members m, ctx
  where m.organization_id = ctx.old_org;

insert into public.spots (id, organization_id, name, description, type, logo_path, archived_at)
  select c.new_id, ctx.new_org, s.name, s.description, s.type,
         replace(s.logo_path, ctx.old_org::text, ctx.new_org::text), s.archived_at
  from public.spots s
  join spot_copies c on c.old_id = s.id
  cross join ctx;

-- Una sola sentencia: las FK compuestas (id, organization_id) no se pueden diferir,
-- pero se chequean al terminarla, cuando padres e hijos ya cambiaron de org.
with moved_venue as (
  update public.venues v
  set organization_id = ctx.new_org, name = 'Centro Metropolitano de Diseño'
  from ctx where v.id = 'b76819d6-9897-1dea-c878-a1d83dd4cbab'
  returning 1
), moved_events as (
  update public.events e
  set organization_id = ctx.new_org,
      venue_id = 'b76819d6-9897-1dea-c878-a1d83dd4cbab',
      slug = case when e.slug = 'burning-tower-fest-2026'
                  then 'burning-tower-fest-agosto-2026' else e.slug end,
      edition_label = case when e.slug = 'burning-tower-fest-2026'
                           then 'Agosto 2026' else e.edition_label end
  from ctx where e.id in (select id from bt_events)
  returning 1
), moved_schedules as (
  update public.event_schedules t set organization_id = ctx.new_org
  from ctx where t.event_id in (select id from bt_events)
  returning 1
), moved_registrations as (
  update public.event_registrations t set organization_id = ctx.new_org
  from ctx where t.event_id in (select id from bt_events)
  returning 1
), moved_claims as (
  update public.spot_claims t set organization_id = ctx.new_org
  from ctx where t.event_id in (select id from bt_events)
  returning 1
), moved_spots as (
  update public.spots s
  set organization_id = ctx.new_org,
      logo_path = replace(s.logo_path, ctx.old_org::text, ctx.new_org::text)
  from ctx
  where s.id in (select spot_id from spot_use where in_bt and not in_charly)
  returning 1
), moved_event_spots as (
  update public.event_spots es
  set organization_id = ctx.new_org,
      spot_id = coalesce((select new_id from spot_copies c where c.old_id = es.spot_id), es.spot_id),
      snapshot = case
        when es.snapshot ->> 'logo_path' is not null then jsonb_set(
          es.snapshot, '{logo_path}',
          to_jsonb(replace(es.snapshot ->> 'logo_path', ctx.old_org::text, ctx.new_org::text))
        )
        else es.snapshot
      end
  from ctx where es.event_id in (select id from bt_events)
  returning 1
)
select
  (select count(*) from moved_venue) as sedes,
  (select count(*) from moved_events) as eventos,
  (select count(*) from moved_schedules) as jornadas,
  (select count(*) from moved_registrations) as inscripciones,
  (select count(*) from moved_claims) as medallas,
  (select count(*) from moved_spots) as catalogo,
  (select count(*) from moved_event_spots) as spots;

-- Misma dirección que la que queda (Algarrobo 1041): era la misma sede con otro nombre.
delete from public.venues where id = 'c8c59214-f861-1b13-e9d1-f3345d8b7532';

do $$
declare
  v_old uuid := (select old_org from ctx);
  v_new uuid := (select new_org from ctx);
  v_got int[];
  c_new constant int[] := array[1, 2, 2, 56, 58, 451, 1118, 3];
  c_old constant int[] := array[1, 2, 2, 7, 12, 252, 531, 3];
begin
  select array[
    (select count(*) from public.venues where organization_id = v_new),
    (select count(*) from public.events where organization_id = v_new),
    (select count(*) from public.event_schedules where organization_id = v_new),
    (select count(*) from public.spots where organization_id = v_new),
    (select count(*) from public.event_spots where organization_id = v_new),
    (select count(*) from public.event_registrations where organization_id = v_new),
    (select count(*) from public.spot_claims where organization_id = v_new),
    (select count(*) from public.organization_members where organization_id = v_new)
  ]::int[] into v_got;
  if v_got <> c_new then
    raise exception 'Burning Tower Fest: esperaba %, quedó %', c_new, v_got;
  end if;

  select array[
    (select count(*) from public.venues where organization_id = v_old),
    (select count(*) from public.events where organization_id = v_old),
    (select count(*) from public.event_schedules where organization_id = v_old),
    (select count(*) from public.spots where organization_id = v_old),
    (select count(*) from public.event_spots where organization_id = v_old),
    (select count(*) from public.event_registrations where organization_id = v_old),
    (select count(*) from public.spot_claims where organization_id = v_old),
    (select count(*) from public.organization_members where organization_id = v_old)
  ]::int[] into v_got;
  if v_got <> c_old then
    raise exception 'Lo de Charly: esperaba %, quedó %', c_old, v_got;
  end if;

  -- Cada snapshot de BT tiene que apuntar a la carpeta de su org.
  if exists (
    select 1 from public.event_spots
    where organization_id = v_new
      and snapshot ->> 'logo_path' not like v_new::text || '/%'
  ) then
    raise exception 'Quedaron logos de BT fuera de su carpeta';
  end if;
end;
$$;

commit;

-- Reporte: lo último que muestra el SQL Editor.
select
  o.slug,
  (select count(*) from public.events e where e.organization_id = o.id) as eventos,
  (select count(*) from public.venues v where v.organization_id = o.id) as sedes,
  (select count(*) from public.spots s where s.organization_id = o.id) as catalogo,
  (select count(*) from public.event_spots s where s.organization_id = o.id) as spots,
  (select count(*) from public.event_registrations r where r.organization_id = o.id) as inscripciones,
  (select count(*) from public.spot_claims c where c.organization_id = o.id) as medallas,
  (select count(*) from public.organization_members m where m.organization_id = o.id) as equipo,
  (select string_agg(d.hostname::text || case when d.is_primary then ' (principal)' else '' end, ', ')
   from public.organization_domains d where d.organization_id = o.id) as dominios
from public.organizations o
where o.slug in ('lodecharlytcg', 'burning-tower-fest')
order by o.slug;
