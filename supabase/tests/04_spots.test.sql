-- R3 · bloque 1: catálogo de spots, spots del evento y snapshot al publicar.
begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000005a1', 'owner-a@spots.local'),
  ('00000000-0000-0000-0000-0000000005b1', 'owner-b@spots.local'),
  ('00000000-0000-0000-0000-0000000005d1', 'dev@spots.local');

insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-0000000005d1');

insert into public.organizations (id, slug, name) values
  ('0000000a-0000-0000-0000-0000000005e1', 'spots-a', 'Spots A'),
  ('0000000b-0000-0000-0000-0000000005e1', 'spots-b', 'Spots B');

insert into public.organization_members (organization_id, user_id, role) values
  ('0000000a-0000-0000-0000-0000000005e1', '00000000-0000-0000-0000-0000000005a1', 'owner'),
  ('0000000b-0000-0000-0000-0000000005e1', '00000000-0000-0000-0000-0000000005b1', 'owner');

insert into public.spots (id, organization_id, name, type, archived_at) values
  ('0000000a-0000-0000-0000-000000000501', '0000000a-0000-0000-0000-0000000005e1', 'Café de la Esquina', 'stand',      null),
  ('0000000a-0000-0000-0000-000000000502', '0000000a-0000-0000-0000-0000000005e1', 'Rueda gigante',      'attraction', null),
  ('0000000a-0000-0000-0000-000000000503', '0000000a-0000-0000-0000-0000000005e1', 'Stand viejo',        'stand',      now()),
  ('0000000b-0000-0000-0000-000000000501', '0000000b-0000-0000-0000-0000000005e1', 'Spot de B',          'stand',      null);

insert into public.events (id, organization_id, slug, title, status, published_at) values
  ('0000000a-0000-0000-0000-000000000511', '0000000a-0000-0000-0000-0000000005e1', 'borrador',  'Borrador',  'draft',     null),
  ('0000000a-0000-0000-0000-000000000512', '0000000a-0000-0000-0000-0000000005e1', 'publicado', 'Publicado', 'published', now());

insert into public.event_schedules (event_id, organization_id, starts_at, ends_at) values
  ('0000000a-0000-0000-0000-000000000511', '0000000a-0000-0000-0000-0000000005e1', now() + interval '1 day', now() + interval '1 day 8 hours');

insert into public.event_spots (id, event_id, organization_id, spot_id, code) values
  ('0000000a-0000-0000-0000-000000000521', '0000000a-0000-0000-0000-000000000511', '0000000a-0000-0000-0000-0000000005e1', '0000000a-0000-0000-0000-000000000501', 'A12');

-- ---------------------------------------------------------------------------
-- Integridad
-- ---------------------------------------------------------------------------

select throws_ok(
  $$ delete from public.spots where id = '0000000a-0000-0000-0000-000000000501' $$,
  '23503', null,
  'a spot used in an event cannot be deleted, even bypassing the API'
);

select is(
  (select snapshot from public.event_spots where id = '0000000a-0000-0000-0000-000000000521'),
  null,
  'a spot in a draft has no snapshot yet'
);

-- ---------------------------------------------------------------------------
-- Equipo
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005a1","role":"authenticated"}', true);

select lives_ok(
  $$ insert into public.spots (organization_id, name) values ('0000000a-0000-0000-0000-0000000005e1', 'Panadería') $$,
  'a member adds a spot to the catalog'
);

select throws_ok(
  $$ insert into public.spots (organization_id, name) values ('0000000b-0000-0000-0000-0000000005e1', 'Intruso') $$,
  '42501', null,
  'a member cannot add spots to another org'
);

select throws_ok(
  $$ delete from public.spots where id = '0000000a-0000-0000-0000-000000000502' $$,
  '42501', null,
  'spots are archived, not deleted'
);

select throws_ok(
  $$ insert into public.event_spots (event_id, organization_id, spot_id, code)
     values ('0000000a-0000-0000-0000-000000000511', '0000000a-0000-0000-0000-0000000005e1', '0000000a-0000-0000-0000-000000000502', 'A12') $$,
  '23505', null,
  'a code is not repeated within an event'
);

select throws_ok(
  $$ insert into public.event_spots (event_id, organization_id, spot_id, code)
     values ('0000000a-0000-0000-0000-000000000511', '0000000a-0000-0000-0000-0000000005e1', '0000000a-0000-0000-0000-000000000502', 'b03') $$,
  '23514', null,
  'codes are uppercase letters, digits and dashes'
);

select throws_ok(
  $$ insert into public.event_spots (event_id, organization_id, spot_id, code)
     values ('0000000a-0000-0000-0000-000000000511', '0000000a-0000-0000-0000-0000000005e1', '0000000b-0000-0000-0000-000000000501', 'B01') $$,
  '23503', null,
  'an event cannot use a spot of another org'
);

select throws_ok(
  $$ insert into public.event_spots (event_id, organization_id, spot_id, code)
     values ('0000000a-0000-0000-0000-000000000511', '0000000a-0000-0000-0000-0000000005e1', '0000000a-0000-0000-0000-000000000503', 'V01') $$,
  '23514', null,
  'an archived spot cannot be placed in an event'
);

select throws_ok(
  $$ update public.event_spots set snapshot = '{}' where id = '0000000a-0000-0000-0000-000000000521' $$,
  '42501', null,
  'the snapshot is only written by the database'
);

-- Spot agregado a un evento ya publicado: se congela al agregarlo.
insert into public.event_spots (event_id, organization_id, spot_id, code)
values ('0000000a-0000-0000-0000-000000000512', '0000000a-0000-0000-0000-0000000005e1', '0000000a-0000-0000-0000-000000000502', 'B03');

select is(
  (select snapshot ->> 'name' from public.event_spots where event_id = '0000000a-0000-0000-0000-000000000512'),
  'Rueda gigante',
  'a spot added to a published event is frozen right away'
);

-- Publicar congela; renombrar en el catálogo después no cambia la edición.
select public.publish_event('0000000a-0000-0000-0000-000000000511');
update public.spots set name = 'Café Nuevo' where id = '0000000a-0000-0000-0000-000000000501';

select is(
  (select snapshot ->> 'name' from public.event_spots where id = '0000000a-0000-0000-0000-000000000521'),
  'Café de la Esquina',
  'publishing freezes the name; renaming the catalog spot later does not change it'
);

select is(
  (select snapshot ->> 'type' from public.event_spots where id = '0000000a-0000-0000-0000-000000000521'),
  'stand',
  'the snapshot also keeps the type'
);

-- Otra org: no ve el catálogo de A.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005b1","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.spots where organization_id = '0000000a-0000-0000-0000-0000000005e1'),
  0,
  'another org does not see the catalog (published event spots are public, see 05)'
);

-- ---------------------------------------------------------------------------
-- Developer: lee, no escribe.
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005d1","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.event_spots where organization_id = '0000000a-0000-0000-0000-0000000005e1'),
  2,
  'the developer reads the event spots of any org (support mode)'
);

update public.event_spots set code = 'Z99' where id = '0000000a-0000-0000-0000-000000000521';
reset role;

select is(
  (select code from public.event_spots where id = '0000000a-0000-0000-0000-000000000521'),
  'A12',
  'the developer cannot edit event spots'
);

-- ---------------------------------------------------------------------------
-- anon: los spots de eventos publicados (R4); el resto, en 05_public.
-- ---------------------------------------------------------------------------

set local role anon;

select is(
  (select count(*)::int from public.event_spots where organization_id = '0000000a-0000-0000-0000-0000000005e1'),
  2,
  'anon reads the spots of published events'
);

reset role;

select * from finish();
rollback;
