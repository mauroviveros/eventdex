-- Vuelve a juntar Burning Tower Fest con Lo de Charly TCG: deshace 05_split_burning_tower.sql.
-- Se corre una sola vez y a mano, en el SQL Editor, DESPUÉS de 07_copy_logos_back.mjs.
-- Todo o nada: si un chequeo no da, no queda ningún cambio.
--
-- No hay conteos fijos (puede haber datos nuevos desde la separación): al final se
-- revisa toda tabla con organization_id y aborta si algo quedó colgado de BT.

begin;

create temp table ctx on commit drop as
  select bt.id as old_org, charly.id as new_org
  from public.organizations bt, public.organizations charly
  where bt.slug = 'burning-tower-fest' and charly.slug = 'lodecharlytcg';

-- Las copias que hizo 05 de los spots compartidos: mismo nombre, tipo y logo (en la
-- carpeta de cada org) que su original. Sus eventos vuelven al original.
create temp table spot_pairs on commit drop as
  select copy.id as copy_id, orig.id as orig_id
  from public.spots copy
  cross join ctx
  join public.spots orig
    on orig.organization_id = ctx.new_org
   and orig.name = copy.name
   and orig.type = copy.type
   and orig.logo_path is not distinct from
       replace(copy.logo_path, ctx.old_org::text, ctx.new_org::text)
  where copy.organization_id = ctx.old_org;

do $$
begin
  if (select count(*) from ctx) <> 1 then
    raise exception 'Falta burning-tower-fest o lodecharlytcg: no se junta nada';
  end if;
  if (select count(*) from spot_pairs) <> 5
    or (select count(distinct copy_id) from spot_pairs) <> 5
    or (select count(distinct orig_id) from spot_pairs) <> 5 then
    raise exception 'Las copias de spots no son las 5 esperadas, 1 a 1 con su original';
  end if;
  if exists (
    select 1 from public.events bt, public.events charly, ctx
    where bt.organization_id = ctx.old_org and charly.organization_id = ctx.new_org
      and bt.slug = charly.slug
  ) then
    raise exception 'Un evento de BT tiene la misma dirección que uno de Charly';
  end if;
end;
$$;

-- Equipo: quien ya está en Charly conserva su rol.
insert into public.organization_members (organization_id, user_id, role)
  select ctx.new_org, m.user_id, m.role
  from public.organization_members m, ctx
  where m.organization_id = ctx.old_org
on conflict (organization_id, user_id) do nothing;

-- Invitaciones abiertas: se mudan las que no repiten una de Charly; el resto cae con BT.
update public.organization_invitations i set organization_id = ctx.new_org
  from ctx
  where i.organization_id = ctx.old_org
    and (i.accepted_at is not null or not exists (
      select 1 from public.organization_invitations c
      where c.organization_id = ctx.new_org and c.email = i.email and c.accepted_at is null
    ));

-- Dominios: todos a Charly y evento.lodecharlytcg.com de principal. Los principales
-- bajan primero: el índice admite uno solo por org y no se puede diferir.
update public.organization_domains d set is_primary = false
  from ctx
  where d.organization_id in (ctx.old_org, ctx.new_org) and d.is_primary
    and exists (select 1 from public.organization_domains
                where hostname = 'evento.lodecharlytcg.com'
                  and organization_id in (ctx.old_org, ctx.new_org));

update public.organization_domains d set organization_id = ctx.new_org, is_primary = false
  from ctx where d.organization_id = ctx.old_org;

update public.organization_domains d set is_primary = true
  from ctx where d.hostname = 'evento.lodecharlytcg.com' and d.organization_id = ctx.new_org;

-- Una sola sentencia: las FK compuestas (id, organization_id) no se pueden diferir,
-- pero se chequean al terminarla, cuando padres e hijos ya cambiaron de org. Las rutas
-- cambian de carpeta en la misma fila, por los check de logo_path y cover_path.
with moved_venues as (
  update public.venues v set organization_id = ctx.new_org
  from ctx where v.organization_id = ctx.old_org
  returning 1
), moved_events as (
  update public.events e
  set organization_id = ctx.new_org,
      cover_path = replace(e.cover_path, ctx.old_org::text, ctx.new_org::text)
  from ctx where e.organization_id = ctx.old_org
  returning 1
), moved_schedules as (
  update public.event_schedules t set organization_id = ctx.new_org
  from ctx where t.organization_id = ctx.old_org
  returning 1
), moved_registrations as (
  update public.event_registrations t set organization_id = ctx.new_org
  from ctx where t.organization_id = ctx.old_org
  returning 1
), moved_claims as (
  update public.spot_claims t set organization_id = ctx.new_org
  from ctx where t.organization_id = ctx.old_org
  returning 1
), moved_raffles as (
  update public.raffles t set organization_id = ctx.new_org
  from ctx where t.organization_id = ctx.old_org
  returning 1
), moved_draws as (
  update public.raffle_draws t set organization_id = ctx.new_org
  from ctx where t.organization_id = ctx.old_org
  returning 1
), moved_spots as (
  update public.spots s
  set organization_id = ctx.new_org,
      logo_path = replace(s.logo_path, ctx.old_org::text, ctx.new_org::text)
  from ctx
  where s.organization_id = ctx.old_org
    and s.id not in (select copy_id from spot_pairs)
  returning 1
), moved_event_spots as (
  update public.event_spots es
  set organization_id = ctx.new_org,
      spot_id = coalesce((select orig_id from spot_pairs p where p.copy_id = es.spot_id), es.spot_id),
      snapshot = case
        when es.snapshot ->> 'logo_path' is not null then jsonb_set(
          es.snapshot, '{logo_path}',
          to_jsonb(replace(es.snapshot ->> 'logo_path', ctx.old_org::text, ctx.new_org::text))
        )
        else es.snapshot
      end
  from ctx where es.organization_id = ctx.old_org
  returning 1
)
select
  (select count(*) from moved_venues) as sedes,
  (select count(*) from moved_events) as eventos,
  (select count(*) from moved_schedules) as jornadas,
  (select count(*) from moved_registrations) as inscripciones,
  (select count(*) from moved_claims) as medallas,
  (select count(*) from moved_raffles) as sorteos,
  (select count(*) from moved_draws) as extracciones,
  (select count(*) from moved_spots) as catalogo,
  (select count(*) from moved_event_spots) as spots;

delete from public.spots where id in (select copy_id from spot_pairs);

-- La facturación no se borra con su org (restrict), y la historia queda junta.
update public.invoices t set organization_id = ctx.new_org
  from ctx where t.organization_id = ctx.old_org;

select app.audit(new_org, 'organization.merged', 'organization', new_org,
  jsonb_build_object('merged_from', 'burning-tower-fest', 'merged_id', old_org))
from ctx;

-- Al final: los updates de arriba también dejan rastro en la org vieja.
update public.audit_logs t set organization_id = ctx.new_org
  from ctx where t.organization_id = ctx.old_org;

do $$
declare
  v_old uuid := (select old_org from ctx);
  v_new uuid := (select new_org from ctx);
  v_table text;
  v_left bigint;
begin
  -- Lo único que puede quedar en BT es lo que cae con ella: su equipo y las
  -- invitaciones abiertas repetidas.
  for v_table in
    select c.table_name from information_schema.columns c
    join information_schema.tables t using (table_schema, table_name)
    where c.table_schema = 'public' and c.column_name = 'organization_id'
      and t.table_type = 'BASE TABLE'
      and c.table_name not in ('organization_members', 'organization_invitations')
  loop
    execute format('select count(*) from public.%I where organization_id = $1', v_table)
      into v_left using v_old;
    if v_left > 0 then
      raise exception 'Quedaron % filas de BT en %', v_left, v_table;
    end if;
  end loop;

  if exists (
    select 1 from public.event_spots
    where organization_id = v_new
      and snapshot ->> 'logo_path' not like v_new::text || '/%'
  ) then
    raise exception 'Quedaron logos de spots fuera de la carpeta de Charly';
  end if;

  if (select count(*) from public.organization_domains
      where organization_id = v_new and is_primary) <> 1 then
    raise exception 'Charly no quedó con un dominio principal';
  end if;
end;
$$;

delete from public.organizations where slug = 'burning-tower-fest';

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
