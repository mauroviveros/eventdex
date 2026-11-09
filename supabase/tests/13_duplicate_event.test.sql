-- R13: duplicar un evento copia lo reutilizable, y solo dentro de la propia org.
begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000da1', 'staff-a@dup.local'),
  ('00000000-0000-0000-0000-000000000db1', 'staff-b@dup.local'),
  ('00000000-0000-0000-0000-000000000dd1', 'dev@dup.local');

insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-000000000dd1');

insert into public.organizations (id, slug, name) values
  ('0000000a-0000-0000-0000-00000000000d', 'dup-a', 'Dup A'),
  ('0000000b-0000-0000-0000-00000000000d', 'dup-b', 'Dup B');

insert into public.organization_members (organization_id, user_id, role) values
  ('0000000a-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000da1', 'staff'),
  ('0000000b-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000db1', 'staff');

insert into public.events (id, organization_id, slug, title, description, cover_path, visibility, status, published_at) values
  ('0000000e-0000-0000-0000-00000000000d', '0000000a-0000-0000-0000-00000000000d', 'origen', 'Origen',
   'Descripción', '0000000a-0000-0000-0000-00000000000d/banner.png', 'unlisted', 'published', now());

insert into public.event_schedules (event_id, organization_id, starts_at, ends_at) values
  ('0000000e-0000-0000-0000-00000000000d', '0000000a-0000-0000-0000-00000000000d', now(), now() + interval '1 hour');

insert into public.spots (id, organization_id, name) values
  ('00000005-0000-0000-0000-00000000000d', '0000000a-0000-0000-0000-00000000000d', 'Sigue'),
  ('00000006-0000-0000-0000-00000000000d', '0000000a-0000-0000-0000-00000000000d', 'Archivado');

insert into public.event_spots (event_id, organization_id, spot_id, code, name_override, booth, points, sort_order) values
  ('0000000e-0000-0000-0000-00000000000d', '0000000a-0000-0000-0000-00000000000d', '00000005-0000-0000-0000-00000000000d', 'A01', 'Nombre propio', 'P1', 5, 3),
  ('0000000e-0000-0000-0000-00000000000d', '0000000a-0000-0000-0000-00000000000d', '00000006-0000-0000-0000-00000000000d', 'A02', null, null, 1, 4);

update public.spots set archived_at = now() where id = '00000006-0000-0000-0000-00000000000d';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000db1","role":"authenticated"}', true);

select throws_ok(
  $$ select * from public.duplicate_event('0000000e-0000-0000-0000-00000000000d', 'robado', 'Robado', 'UTC') $$,
  '42501', null,
  'a member of another org cannot duplicate a published event'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000dd1","role":"authenticated"}', true);

select throws_ok(
  $$ select * from public.duplicate_event('0000000e-0000-0000-0000-00000000000d', 'soporte', 'Soporte', 'UTC') $$,
  '42501', null,
  'the developer in support mode cannot duplicate'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000da1","role":"authenticated"}', true);

select results_eq(
  $$ select public.duplicate_event('0000000e-0000-0000-0000-00000000000d', 'copia', 'Copia', 'UTC', 'Noviembre', 'Resumen') $$,
  $$ values ('copia'::text) $$,
  'a member duplicates and gets the new slug'
);

select results_eq(
  $$ select title, edition_label, summary, description, visibility::text, status::text, cover_path
     from public.events where slug = 'copia' $$,
  $$ values ('Copia'::text, 'Noviembre'::text, 'Resumen'::text, 'Descripción'::text, 'unlisted'::text, 'draft'::text, null::text) $$,
  'the copy takes the new data, keeps the rest, is a draft and has no banner'
);

select results_eq(
  $$ select es.code, es.name_override, es.booth, es.points, es.sort_order, es.snapshot
     from public.event_spots es join public.events e on e.id = es.event_id
     where e.slug = 'copia' $$,
  $$ values ('A01'::text, 'Nombre propio'::text, 'P1'::text, 5, 3, null::jsonb) $$,
  'spots keep their setup, archived ones stay out, and nothing is frozen yet'
);

select is_empty(
  $$ select 1 from public.event_schedules s join public.events e on e.id = s.event_id
     where e.slug = 'copia' $$,
  'schedules are not copied'
);

select results_eq(
  $$ select count(*)::int from public.event_spots
     where event_id = '0000000e-0000-0000-0000-00000000000d' $$,
  $$ values (2) $$,
  'the original keeps all its spots'
);

select isnt(
  (select es.id from public.event_spots es join public.events e on e.id = es.event_id
   where e.slug = 'copia' limit 1),
  (select id from public.event_spots
   where event_id = '0000000e-0000-0000-0000-00000000000d' and code = 'A01'),
  'each edition gets its own QR target'
);

select throws_ok(
  $$ select * from public.duplicate_event('0000000e-0000-0000-0000-00000000000d', 'origen', 'Repetido', 'UTC') $$,
  '23505', null,
  'a slug already in use is rejected'
);

select results_eq(
  $$ select count(*)::int from public.events where title = 'Repetido' $$,
  $$ values (0) $$,
  'a failed copy leaves nothing behind'
);

reset role;

set local role anon;
select throws_ok(
  $$ select * from public.duplicate_event('0000000e-0000-0000-0000-00000000000d', 'anonimo', 'Anónimo', 'UTC') $$,
  '42501', null,
  'anon cannot duplicate'
);
reset role;

select * from finish();
rollback;
