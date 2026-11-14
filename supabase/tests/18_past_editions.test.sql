-- R21 · bloque 2: past_editions() da solo totales de ediciones públicas terminadas.
begin;
create extension if not exists pgtap with schema extensions;

select plan(6);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000009a1', 'uno@past.local'),
  ('00000000-0000-0000-0000-0000000009a2', 'dos@past.local');

insert into public.organizations (id, slug, name) values
  ('00000000-0000-0000-0000-000000000901', 'past-a', 'Past A'),
  ('00000000-0000-0000-0000-000000000902', 'past-b', 'Past B');

-- 911 terminado y publicado, 912 en curso, 913 terminado pero borrador,
-- 914 terminado y publicado de otra org, 915 terminado y dado de baja.
insert into public.events (id, organization_id, slug, title, edition_label, status, published_at, deleted_at) values
  ('00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', 'pasado',   'Expo', '2025', 'published', now(), null),
  ('00000000-0000-0000-0000-000000000912', '00000000-0000-0000-0000-000000000901', 'actual',   'Expo', '2026', 'published', now(), null),
  ('00000000-0000-0000-0000-000000000913', '00000000-0000-0000-0000-000000000901', 'borrador', 'Expo', '2024', 'draft',     null,  null),
  ('00000000-0000-0000-0000-000000000914', '00000000-0000-0000-0000-000000000902', 'ajeno',    'Otra', '2025', 'published', now(), null),
  ('00000000-0000-0000-0000-000000000915', '00000000-0000-0000-0000-000000000901', 'baja',     'Expo', '2023', 'published', now(), now());

insert into public.event_schedules (event_id, organization_id, starts_at, ends_at)
select e.id, e.organization_id,
       now() - interval '60 days',
       case when e.id = '00000000-0000-0000-0000-000000000912'
            then now() + interval '6 hours' else now() - interval '59 days' end
from public.events e
where e.id::text like '00000000-0000-0000-0000-00000000091%';

insert into public.spots (id, organization_id, name) values
  ('00000000-0000-0000-0000-000000000921', '00000000-0000-0000-0000-000000000901', 'Café'),
  ('00000000-0000-0000-0000-000000000922', '00000000-0000-0000-0000-000000000901', 'Rueda');

insert into public.event_spots (id, event_id, organization_id, spot_id, code) values
  ('00000000-0000-0000-0000-000000000931', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000921', 'A01'),
  ('00000000-0000-0000-0000-000000000932', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000922', 'A02');

insert into public.event_registrations (id, event_id, organization_id, user_id) values
  ('00000000-0000-0000-0000-000000000941', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009a1'),
  ('00000000-0000-0000-0000-000000000942', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009a2');

insert into public.spot_claims (event_spot_id, registration_id, event_id, organization_id, user_id) values
  ('00000000-0000-0000-0000-000000000931', '00000000-0000-0000-0000-000000000941', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009a1'),
  ('00000000-0000-0000-0000-000000000932', '00000000-0000-0000-0000-000000000941', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009a1'),
  ('00000000-0000-0000-0000-000000000931', '00000000-0000-0000-0000-000000000942', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009a2');

set local role anon;

select results_eq(
  $$ select slug, edition_label, visitors, medals
     from public.past_editions('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000912') $$,
  $$ values ('pasado'::text, '2025'::text, 2::bigint, 3::bigint) $$,
  'anon gets the totals of the finished public editions, and no draft, drop or other org'
);

select is_empty(
  $$ select 1 from public.past_editions('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000911') $$,
  'the event being shown is never listed as its own past edition'
);

select results_eq(
  $$ select slug from public.past_editions('00000000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-000000000912') $$,
  $$ values ('ajeno'::text) $$,
  'another org gets only its own editions'
);

select throws_ok(
  $$ select count(*) from public.event_registrations $$,
  '42501', null,
  'anon still cannot read the registrations themselves'
);

select throws_ok(
  $$ select count(*) from public.spot_claims $$,
  '42501', null,
  'anon still cannot read the claims themselves'
);

reset role;
select is(
  (select count(*) from public.past_editions('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000912')),
  1::bigint,
  'the function does not depend on the caller'
);

select * from finish();
rollback;
