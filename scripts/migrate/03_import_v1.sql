-- R10: importa los datos de la v1 (esquema `v1`) al esquema nuevo. Se corre a mano
-- después del corte, y se puede correr de nuevo: los ids salen de la v1, así que
-- lo que ya entró no se duplica. Todo o nada.
--
-- El mapeo y lo que se descarta están en docs/ARQUITECTURA.md. Los archivos de los
-- logos se copian aparte, con 04_copy_spot_logos.mjs.

begin;

do $$
begin
  if not exists (select 1 from public.organizations where slug = 'lodecharlytcg') then
    raise exception 'No existe la org lodecharlytcg: no se importa nada';
  end if;
end;
$$;

create temp table target on commit drop as
  select id as organization_id from public.organizations where slug = 'lodecharlytcg';

-- Los eventos de verdad. El de prueba (temp_20260807) está borrado en la v1.
create temp table kept_events on commit drop as
  select
    e.*,
    trim(both '-' from regexp_replace(
      lower(e.title || ' ' || coalesce(e.edition, '')), '[^a-z0-9]+', '-', 'g'
    )) as slug
  from v1.events e
  where e.deleted_at is null;

-- Los spots que entran. En el catálogo, un nombre es un spot y manda la edición más
-- reciente. El logo vive bajo la carpeta de la org, con la ruta que tenía en la v1.
create temp table kept_spots on commit drop as
  select
    s.*,
    t.organization_id,
    lower(trim(s.name)) as catalog_key,
    md5('v1:spot:' || lower(trim(s.name)))::uuid as catalog_id,
    case when s.avatar_path is null then null
         else t.organization_id::text || '/' || s.avatar_path end as logo_path,
    case s.type when 'ATTRACTION' then 'attraction' else 'stand' end::public.spot_type as new_type,
    row_number() over (partition by s.event_id order by s.created_at, s.id) as position,
    e.created_at as event_created_at
  from v1.event_spots s
  join kept_events e on e.id = s.event_id
  cross join target t
  where s.deleted_at is null;

-- ---------------------------------------------------------------------------
-- Equipo: un ADMIN de la v1 podía hacer todo.
-- ---------------------------------------------------------------------------

insert into public.organization_members (organization_id, user_id, role, created_at)
select t.organization_id, m.user_id, 'owner', m.created_at
from v1.organization_members m
cross join target t
on conflict (organization_id, user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Sedes: una por nombre, con los datos de la edición más reciente.
-- ---------------------------------------------------------------------------

insert into public.venues (id, organization_id, name, address_line, city, state, country, timezone, created_at)
select distinct on (lower(trim(l.name)))
  md5('v1:venue:' || lower(trim(l.name)))::uuid,
  t.organization_id,
  trim(l.name),
  l.address,
  l.city,
  l.state,
  case l.country when 'Argentina' then 'AR' end,
  e.timezone,
  l.created_at
from v1.event_locations l
join kept_events e on e.id = l.event_id
cross join target t
order by lower(trim(l.name)), e.created_at desc
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Eventos y jornadas
-- ---------------------------------------------------------------------------

insert into public.events (id, organization_id, venue_id, slug, title, edition_label, description,
                           timezone, status, visibility, published_at, created_at, updated_at)
select
  e.id,
  t.organization_id,
  md5('v1:venue:' || lower(trim(l.name)))::uuid,
  e.slug,
  e.title,
  e.edition,
  e.description,
  e.timezone,
  'published',
  'public',
  e.created_at,
  e.created_at,
  e.updated_at
from kept_events e
left join v1.event_locations l on l.event_id = e.id
cross join target t
on conflict (id) do nothing;

insert into public.event_schedules (id, event_id, organization_id, starts_at, ends_at, created_at, updated_at)
select
  md5('v1:schedule:' || s.id)::uuid,
  s.event_id,
  t.organization_id,
  s.start_datetime,
  s.end_datetime,
  s.created_at,
  s.updated_at
from v1.event_schedules s
join kept_events e on e.id = s.event_id
cross join target t
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Spots: catálogo y spots de cada evento, que conservan su id de la v1.
-- ---------------------------------------------------------------------------

insert into public.spots (id, organization_id, name, description, type, logo_path, created_at)
select distinct on (s.catalog_key)
  s.catalog_id,
  s.organization_id,
  trim(s.name),
  s.description,
  s.new_type,
  s.logo_path,
  s.created_at
from kept_spots s
order by s.catalog_key, s.event_created_at desc, s.created_at desc
on conflict (id) do nothing;

insert into public.event_spots (id, event_id, organization_id, spot_id, code, is_active, sort_order, created_at, updated_at)
select
  s.id,
  s.event_id,
  s.organization_id,
  s.catalog_id,
  'A' || case when s.position < 10 then '0' else '' end || s.position,
  s.status = 'ACTIVE',
  s.position - 1,
  s.created_at,
  s.updated_at
from kept_spots s
on conflict (id) do nothing;

-- El trigger congela el catálogo; cada edición conserva lo que mostró en la v1.
update public.event_spots es
set snapshot = jsonb_build_object(
  'name',        trim(s.name),
  'description', s.description,
  'logo_path',   s.logo_path,
  'type',        s.new_type,
  'frozen_at',   s.created_at
)
from kept_spots s
where es.id = s.id
  and es.snapshot ->> 'frozen_at' is distinct from to_jsonb(s.created_at) #>> '{}';

-- ---------------------------------------------------------------------------
-- Visitantes y medallas
-- ---------------------------------------------------------------------------

insert into public.event_registrations (id, event_id, organization_id, user_id, created_at)
select
  md5('v1:registration:' || s.event_id || ':' || h.user_id)::uuid,
  s.event_id,
  s.organization_id,
  h.user_id,
  min(h.collected_at)
from v1.user_spot_history h
join kept_spots s on s.id = h.spot_id
group by s.event_id, s.organization_id, h.user_id
on conflict (event_id, user_id) do nothing;

insert into public.spot_claims (id, event_spot_id, registration_id, event_id, organization_id, user_id, claimed_at)
select
  md5('v1:claim:' || h.id)::uuid,
  h.spot_id,
  r.id,
  s.event_id,
  s.organization_id,
  h.user_id,
  h.collected_at
from v1.user_spot_history h
join kept_spots s on s.id = h.spot_id
join public.event_registrations r on r.event_id = s.event_id and r.user_id = h.user_id
on conflict (event_spot_id, user_id) do nothing;

-- Si los conteos no cierran, no entra nada.
do $$
declare
  v_missing bigint;
begin
  select count(*) into v_missing
  from v1.user_spot_history h
  join kept_spots s on s.id = h.spot_id
  where not exists (
    select 1 from public.spot_claims c
    where c.event_spot_id = h.spot_id and c.user_id = h.user_id
  );
  if v_missing > 0 then
    raise exception 'Faltan % medallas: no se importa nada', v_missing;
  end if;

  select count(*) into v_missing
  from kept_spots s
  where not exists (select 1 from public.event_spots es where es.id = s.id and es.snapshot is not null);
  if v_missing > 0 then
    raise exception 'Faltan % spots: no se importa nada', v_missing;
  end if;
end;
$$;

commit;

-- Reporte: lo último que muestra el SQL Editor.
with org as (select id from public.organizations where slug = 'lodecharlytcg'),
kept as (select id from v1.events where deleted_at is null)
select * from (values
  (1, 'equipo',        (select count(*) from v1.organization_members),
                       (select count(*) from v1.organization_members),
                       (select count(*) from public.organization_members m, org where m.organization_id = org.id)),
  (2, 'sedes',         (select count(*) from v1.event_locations),
                       (select count(distinct lower(trim(l.name))) from v1.event_locations l where l.event_id in (select id from kept)),
                       (select count(*) from public.venues v, org where v.organization_id = org.id)),
  (3, 'eventos',       (select count(*) from v1.events),
                       (select count(*) from kept),
                       (select count(*) from public.events e, org where e.organization_id = org.id)),
  (4, 'jornadas',      (select count(*) from v1.event_schedules),
                       (select count(*) from v1.event_schedules s where s.event_id in (select id from kept)),
                       (select count(*) from public.event_schedules s, org where s.organization_id = org.id)),
  (5, 'catálogo',      (select count(*) from v1.event_spots),
                       (select count(distinct lower(trim(s.name))) from v1.event_spots s where s.deleted_at is null and s.event_id in (select id from kept)),
                       (select count(*) from public.spots s, org where s.organization_id = org.id)),
  (6, 'spots',         (select count(*) from v1.event_spots),
                       (select count(*) from v1.event_spots s where s.deleted_at is null and s.event_id in (select id from kept)),
                       (select count(*) from public.event_spots s, org where s.organization_id = org.id)),
  (7, 'inscripciones', null,
                       (select count(distinct (s.event_id, h.user_id)) from v1.user_spot_history h join v1.event_spots s on s.id = h.spot_id where s.deleted_at is null and s.event_id in (select id from kept)),
                       (select count(*) from public.event_registrations r, org where r.organization_id = org.id)),
  (8, 'medallas',      (select count(*) from v1.user_spot_history),
                       (select count(*) from v1.user_spot_history h join v1.event_spots s on s.id = h.spot_id where s.deleted_at is null and s.event_id in (select id from kept)),
                       (select count(*) from public.spot_claims c, org where c.organization_id = org.id))
) as report (orden, tabla, en_v1, entran, en_destino)
order by orden;
