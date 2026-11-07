-- R2 · bloque 1: sedes, eventos, jornadas, fase y publish_event().
begin;
create extension if not exists pgtap with schema extensions;

select plan(19);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000a001', 'owner-a@test.local'),
  ('00000000-0000-0000-0000-00000000b001', 'owner-b@test.local'),
  ('00000000-0000-0000-0000-00000000d001', 'dev@test.local');

insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-00000000d001');

insert into public.organizations (id, slug, name) values
  ('0000000a-0000-0000-0000-0000000000e1', 'ev-a', 'Eventos A'),
  ('0000000b-0000-0000-0000-0000000000e1', 'ev-b', 'Eventos B');

insert into public.organization_members (organization_id, user_id, role) values
  ('0000000a-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000a001', 'owner'),
  ('0000000b-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000b001', 'owner');

insert into public.venues (id, organization_id, name) values
  ('0000000a-0000-0000-0000-0000000000f1', '0000000a-0000-0000-0000-0000000000e1', 'Sede publicada'),
  ('0000000a-0000-0000-0000-0000000000f2', '0000000a-0000-0000-0000-0000000000e1', 'Sede de borrador'),
  ('0000000b-0000-0000-0000-0000000000f1', '0000000b-0000-0000-0000-0000000000e1', 'Sede B');

-- Org A: cuatro publicados (pasado, en curso, futuro, sin jornadas) y un borrador.
insert into public.events (id, organization_id, venue_id, slug, title, status, published_at) values
  ('0000000a-0000-0000-0000-000000000001', '0000000a-0000-0000-0000-0000000000e1', '0000000a-0000-0000-0000-0000000000f1', 'pasado',   'Pasado',   'published', now()),
  ('0000000a-0000-0000-0000-000000000002', '0000000a-0000-0000-0000-0000000000e1', null,                                   'en-curso', 'En curso', 'published', now()),
  ('0000000a-0000-0000-0000-000000000003', '0000000a-0000-0000-0000-0000000000e1', null,                                   'futuro',   'Futuro',   'published', now()),
  ('0000000a-0000-0000-0000-000000000004', '0000000a-0000-0000-0000-0000000000e1', null,                                   'sin-fecha','Sin fecha','published', now()),
  ('0000000a-0000-0000-0000-000000000005', '0000000a-0000-0000-0000-0000000000e1', '0000000a-0000-0000-0000-0000000000f2', 'borrador', 'Borrador', 'draft',     null),
  ('0000000b-0000-0000-0000-000000000001', '0000000b-0000-0000-0000-0000000000e1', null,                                   'borrador-b','Borrador B','draft',   null);

insert into public.event_schedules (event_id, organization_id, starts_at, ends_at) values
  -- Pasado: dos jornadas, ambas terminadas.
  ('0000000a-0000-0000-0000-000000000001', '0000000a-0000-0000-0000-0000000000e1', now() - interval '3 days', now() - interval '3 days' + interval '8 hours'),
  ('0000000a-0000-0000-0000-000000000001', '0000000a-0000-0000-0000-0000000000e1', now() - interval '2 days', now() - interval '2 days' + interval '8 hours'),
  -- En curso: entre dos jornadas también cuenta como en curso.
  ('0000000a-0000-0000-0000-000000000002', '0000000a-0000-0000-0000-0000000000e1', now() - interval '1 day',  now() - interval '1 day' + interval '8 hours'),
  ('0000000a-0000-0000-0000-000000000002', '0000000a-0000-0000-0000-0000000000e1', now() + interval '1 day',  now() + interval '1 day' + interval '8 hours'),
  ('0000000a-0000-0000-0000-000000000003', '0000000a-0000-0000-0000-0000000000e1', now() + interval '5 days', now() + interval '5 days' + interval '8 hours'),
  ('0000000a-0000-0000-0000-000000000005', '0000000a-0000-0000-0000-0000000000e1', now() + interval '9 days', now() + interval '9 days' + interval '8 hours');

-- ---------------------------------------------------------------------------
-- Integridad
-- ---------------------------------------------------------------------------

select throws_ok(
  $$ insert into public.event_schedules (event_id, organization_id, starts_at, ends_at)
     values ('0000000a-0000-0000-0000-000000000005', '0000000a-0000-0000-0000-0000000000e1', now(), now() - interval '1 hour') $$,
  '23514', null,
  'a schedule that ends before it starts is rejected'
);

select throws_ok(
  $$ insert into public.event_schedules (event_id, organization_id, starts_at, ends_at)
     values ('0000000a-0000-0000-0000-000000000005', '0000000b-0000-0000-0000-0000000000e1', now(), now() + interval '1 hour') $$,
  '23503', null,
  'a schedule cannot claim another org than its event'
);

-- ---------------------------------------------------------------------------
-- anon
-- ---------------------------------------------------------------------------

set local role anon;

select results_eq(
  $$ select slug::text from public.events where organization_id in ('0000000a-0000-0000-0000-0000000000e1', '0000000b-0000-0000-0000-0000000000e1') order by slug $$,
  $$ values ('en-curso'), ('futuro'), ('pasado'), ('sin-fecha') $$,
  'anon only sees published events'
);

select is(
  (select count(*)::int from public.event_schedules where event_id = '0000000a-0000-0000-0000-000000000005'),
  0,
  'anon does not see the schedules of a draft'
);

select results_eq(
  $$ select name from public.venues where organization_id = '0000000a-0000-0000-0000-0000000000e1' $$,
  $$ values ('Sede publicada') $$,
  'anon only sees venues used by a published event'
);

select results_eq(
  $$ select e.slug::text, p.phase from public.event_phases p join public.events e on e.id = p.event_id
     where p.organization_id = '0000000a-0000-0000-0000-0000000000e1' order by e.slug $$,
  $$ values ('en-curso', 'live'::public.event_phase), ('futuro', 'upcoming'), ('pasado', 'finished'), ('sin-fecha', null) $$,
  'the phase is live, upcoming, finished, or null without schedules'
);

select throws_ok(
  $$ insert into public.events (organization_id, slug, title) values ('0000000a-0000-0000-0000-0000000000e1', 'anon', 'Anon') $$,
  '42501', null,
  'anon cannot create events'
);

reset role;

-- ---------------------------------------------------------------------------
-- Equipo
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a001","role":"authenticated"}', true);

select results_eq(
  $$ select slug::text from public.events where status = 'draft' and organization_id in ('0000000a-0000-0000-0000-0000000000e1', '0000000b-0000-0000-0000-0000000000e1') $$,
  $$ values ('borrador') $$,
  'a member sees the drafts of their org and not of others'
);

select lives_ok(
  $$ insert into public.events (organization_id, venue_id, slug, title)
     values ('0000000a-0000-0000-0000-0000000000e1', '0000000a-0000-0000-0000-0000000000f1', 'nuevo', 'Nuevo') $$,
  'a member creates an event in their org'
);

select is(
  (select created_by from public.events where slug = 'nuevo' and organization_id = '0000000a-0000-0000-0000-0000000000e1'),
  '00000000-0000-0000-0000-00000000a001'::uuid,
  'created_by is the signed-in member'
);

select throws_ok(
  $$ insert into public.events (organization_id, slug, title) values ('0000000b-0000-0000-0000-0000000000e1', 'intruso', 'Intruso') $$,
  '42501', null,
  'a member cannot create events in another org'
);

select throws_ok(
  $$ insert into public.events (organization_id, venue_id, slug, title)
     values ('0000000a-0000-0000-0000-0000000000e1', '0000000b-0000-0000-0000-0000000000f1', 'sede-ajena', 'Sede ajena') $$,
  '23503', null,
  'an event cannot use a venue of another org'
);

select throws_ok(
  $$ update public.events set status = 'published' where id = '0000000a-0000-0000-0000-000000000005' $$,
  '42501', null,
  'status only changes through publish_event()'
);

select throws_ok(
  $$ select public.publish_event((select id from public.events where slug = 'nuevo' and organization_id = '0000000a-0000-0000-0000-0000000000e1')) $$,
  '23514', null,
  'an event without schedules cannot be published'
);

select lives_ok(
  $$ select public.publish_event('0000000a-0000-0000-0000-000000000005') $$,
  'a member publishes a draft with schedules'
);

select ok(
  (select status = 'published' and published_at is not null from public.events where id = '0000000a-0000-0000-0000-000000000005')
  and exists (select 1 from public.audit_logs where action = 'event.published' and entity_id = '0000000a-0000-0000-0000-000000000005'),
  'publishing sets status and published_at and leaves an audit row'
);

select throws_ok(
  $$ select public.publish_event('0000000b-0000-0000-0000-000000000001') $$,
  '42501', null,
  'a member cannot publish an event of another org'
);

-- ---------------------------------------------------------------------------
-- Developer: lee todo (modo soporte), no escribe.
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d001","role":"authenticated"}', true);

select ok(
  exists (select 1 from public.events where id = '0000000b-0000-0000-0000-000000000001'),
  'the developer reads drafts of any org (support mode)'
);

update public.events set title = 'Soporte' where id = '0000000b-0000-0000-0000-000000000001';
reset role;
select is(
  (select title from public.events where id = '0000000b-0000-0000-0000-000000000001'),
  'Borrador B',
  'the developer cannot edit events of another org'
);

select * from finish();
rollback;
