-- R32 · bloque 1: lecturas del overview. Cada cifra con datos conocidos, y ni otra
-- org ni un visitante ven lo que no es suyo.
begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000d0a1', 'ana@overview.local', '{"full_name":"Ana García"}'),
  ('00000000-0000-0000-0000-00000000d0a2', 'beto@overview.local', '{"full_name":"Beto Paz"}'),
  ('00000000-0000-0000-0000-00000000d0a3', 'sin-nombre@overview.local', '{}'),
  ('00000000-0000-0000-0000-00000000d0b1', 'owner@overview.local', '{}'),
  ('00000000-0000-0000-0000-00000000d0b2', 'ajeno@overview.local', '{}');

insert into public.organizations (id, slug, name) values
  ('00000000-0000-0000-0000-00000000d001', 'overview-a', 'Overview A'),
  ('00000000-0000-0000-0000-00000000d002', 'overview-b', 'Overview B');

insert into public.organization_members (organization_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d0b1', 'owner'),
  ('00000000-0000-0000-0000-00000000d002', '00000000-0000-0000-0000-00000000d0b2', 'owner');

insert into public.events (id, organization_id, slug, title, status, published_at) values
  ('00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', 'edicion-1', 'Edición 1', 'published', now()),
  ('00000000-0000-0000-0000-00000000d012', '00000000-0000-0000-0000-00000000d001', 'edicion-2', 'Edición 2', 'published', now());

insert into public.spots (id, organization_id, name) values
  ('00000000-0000-0000-0000-00000000d021', '00000000-0000-0000-0000-00000000d001', 'Café'),
  ('00000000-0000-0000-0000-00000000d022', '00000000-0000-0000-0000-00000000d001', 'Rueda'),
  ('00000000-0000-0000-0000-00000000d023', '00000000-0000-0000-0000-00000000d001', 'Mazo'),
  ('00000000-0000-0000-0000-00000000d025', '00000000-0000-0000-0000-00000000d001', 'Apagado'),
  ('00000000-0000-0000-0000-00000000d026', '00000000-0000-0000-0000-00000000d001', 'Vacío');

-- Edición 1: cuatro stands activos (la mitad son 2) y uno apagado.
insert into public.event_spots (id, event_id, organization_id, spot_id, code, name_override, is_active) values
  ('00000000-0000-0000-0000-00000000d031', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d021', 'A1', 'Café del centro', true),
  ('00000000-0000-0000-0000-00000000d032', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d022', 'A2', null, true),
  ('00000000-0000-0000-0000-00000000d033', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d023', 'A3', null, true),
  ('00000000-0000-0000-0000-00000000d035', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d025', 'A5', null, false),
  ('00000000-0000-0000-0000-00000000d036', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d026', 'A6', null, true),
-- Edición 2: un solo stand.
  ('00000000-0000-0000-0000-00000000d041', '00000000-0000-0000-0000-00000000d012', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d021', 'B1', null, true);

insert into public.event_registrations (id, event_id, organization_id, user_id) values
  ('00000000-0000-0000-0000-00000000d051', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d0a1'),
  ('00000000-0000-0000-0000-00000000d052', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d0a2'),
  ('00000000-0000-0000-0000-00000000d053', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d0a3'),
  ('00000000-0000-0000-0000-00000000d054', '00000000-0000-0000-0000-00000000d012', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d0a1');

-- Horas en UTC; el evento está en Buenos Aires (UTC-3): 13Z son las 10.
insert into public.spot_claims (event_spot_id, registration_id, event_id, organization_id, user_id, claimed_at) values
  -- Ana: tres activos (pasa la mitad, no completa).
  ('00000000-0000-0000-0000-00000000d031', '00000000-0000-0000-0000-00000000d051', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d0a1', '2026-11-14 13:05Z'),
  ('00000000-0000-0000-0000-00000000d032', '00000000-0000-0000-0000-00000000d051', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d0a1', '2026-11-14 13:20Z'),
  ('00000000-0000-0000-0000-00000000d033', '00000000-0000-0000-0000-00000000d051', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d0a1', '2026-11-14 14:10Z'),
  -- Beto: dos, justo la mitad.
  ('00000000-0000-0000-0000-00000000d031', '00000000-0000-0000-0000-00000000d052', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d0a2', '2026-11-14 14:15Z'),
  ('00000000-0000-0000-0000-00000000d032', '00000000-0000-0000-0000-00000000d052', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d0a2', '2026-11-14 14:30Z'),
  -- Sin nombre: uno activo y el apagado, que no suma a la mitad.
  ('00000000-0000-0000-0000-00000000d031', '00000000-0000-0000-0000-00000000d053', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d0a3', '2026-11-14 15:10Z'),
  ('00000000-0000-0000-0000-00000000d035', '00000000-0000-0000-0000-00000000d053', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d0a3', '2026-11-14 15:20Z'),
  -- Ana vuelve a la edición 2 y la completa.
  ('00000000-0000-0000-0000-00000000d041', '00000000-0000-0000-0000-00000000d054', '00000000-0000-0000-0000-00000000d012', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d0a1', '2026-11-15 13:00Z');

insert into public.event_awards (id, event_id, organization_id, title, kind, threshold) values
  ('00000000-0000-0000-0000-00000000d061', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', 'La mitad', 'percent', 50);
insert into public.award_winners (award_id, event_id, organization_id, user_id, position, won_at) values
  ('00000000-0000-0000-0000-00000000d061', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d0a2', 1, '2026-11-14 14:30Z');

insert into public.raffles (id, event_id, organization_id, title) values
  ('00000000-0000-0000-0000-00000000d071', '00000000-0000-0000-0000-00000000d011', '00000000-0000-0000-0000-00000000d001', 'Remera');
insert into public.raffle_draws (raffle_id, organization_id, draw_number, winner_user_id, winner_name, eligible_count, drawn_at, voided_at, void_reason) values
  ('00000000-0000-0000-0000-00000000d071', '00000000-0000-0000-0000-00000000d001', 1, '00000000-0000-0000-0000-00000000d0a1', 'Ana G.', 3, '2026-11-14 15:25Z', '2026-11-14 15:26Z', 'No estaba'),
  ('00000000-0000-0000-0000-00000000d071', '00000000-0000-0000-0000-00000000d001', 2, '00000000-0000-0000-0000-00000000d0a3', 'Visitante', 2, '2026-11-14 15:30Z', null, null);

-- Equipo de la org.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d0b1","role":"authenticated"}', true);

select results_eq(
  $$ select * from public.event_overview('00000000-0000-0000-0000-00000000d011') $$,
  $$ values (3, 2, 0, 7, 4, 1) $$,
  'the event figures: visitors, half, complete, medals, stands and idle stands'
);

select results_eq(
  $$ select * from public.event_overview('00000000-0000-0000-0000-00000000d012') $$,
  $$ values (1, 1, 1, 1, 1, 0) $$,
  'with one stand, its medal is half and all'
);

select results_eq(
  $$ select * from public.event_hourly('00000000-0000-0000-0000-00000000d011') $$,
  $$ values ('2026-11-14 13:00Z'::timestamptz, 2, 1),
            ('2026-11-14 14:00Z'::timestamptz, 3, 1),
            ('2026-11-14 15:00Z'::timestamptz, 2, 1) $$,
  'medals and newcomers per hour of the event''s zone'
);

select results_eq(
  $$ select code, name, is_active, medals from public.event_spot_ranking('00000000-0000-0000-0000-00000000d011') $$,
  $$ values ('A1', 'Café del centro', true, 3), ('A2', 'Rueda', true, 2),
            ('A3', 'Mazo', true, 1), ('A5', 'Apagado', false, 1), ('A6', 'Vacío', true, 0) $$,
  'every stand by medals, with its own name, the idle and the inactive ones'
);

select results_eq(
  $$ select * from public.org_overview('00000000-0000-0000-0000-00000000d001') $$,
  $$ values (3, 1) $$,
  'unique visitors of the org and how many came to two events'
);

select is(
  (select count(*)::int from public.org_activity('00000000-0000-0000-0000-00000000d001')), 10,
  'the org activity: every medal, the award and the draw that stands'
);

select results_eq(
  $$ select kind, visitor, detail, is_first
     from public.org_activity('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d011', 3) $$,
  $$ values ('sorteo', 'Visitante', 'Remera', false),
            ('medalla', 'Visitante', 'Apagado', false),
            ('medalla', 'Visitante', 'Café del centro', true) $$,
  'the latest first, the first medal marks the arrival, a voided draw is left out'
);

select is(
  (select count(*)::int from public.org_activity('00000000-0000-0000-0000-00000000d001', null, 0)), 1,
  'the limit is at least one row'
);

select is(
  (select count(*)::int from public.org_activity('00000000-0000-0000-0000-00000000d001') where visitor like '%@%'), 0,
  'the activity never shows a mail'
);

select is(
  (select count(*)::int from public.org_activity('00000000-0000-0000-0000-00000000d001') where kind = 'premio' and visitor = 'Beto Paz'), 1,
  'an award shows who won it'
);

-- Equipo de otra org.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d0b2","role":"authenticated"}', true);

select results_eq(
  $$ select visitors, medals from public.event_overview('00000000-0000-0000-0000-00000000d011') $$,
  $$ values (0, 0) $$,
  'another org counts no visitors nor medals here'
);

select is(
  (select count(*)::int from public.org_activity('00000000-0000-0000-0000-00000000d001')), 0,
  'another org reads no activity here'
);

-- Un visitante: solo lo suyo.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d0a2","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.org_activity('00000000-0000-0000-0000-00000000d001')), 3,
  'a visitor reads only their own medals and award'
);

reset role;
set local role anon;

select throws_ok(
  $$ select * from public.event_overview('00000000-0000-0000-0000-00000000d011') $$,
  '42501', null,
  'anon cannot read the overview'
);

select * from finish();
rollback;
