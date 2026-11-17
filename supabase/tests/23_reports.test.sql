-- R33 · bloque 1: lecturas de los informes. Cada cifra con datos conocidos, los
-- empates de la primera parada desempatan por id, y ni otra org ni anon leen nada.
begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000e1a1', 'ana@reports.local', '{}'),
  ('00000000-0000-0000-0000-00000000e1a2', 'beto@reports.local', '{}'),
  ('00000000-0000-0000-0000-00000000e1a3', 'caro@reports.local', '{}'),
  ('00000000-0000-0000-0000-00000000e1a4', 'dani@reports.local', '{}'),
  ('00000000-0000-0000-0000-00000000e1b1', 'owner@reports.local', '{}'),
  ('00000000-0000-0000-0000-00000000e1b2', 'ajeno@reports.local', '{}');

insert into public.organizations (id, slug, name) values
  ('00000000-0000-0000-0000-00000000e101', 'reports-a', 'Reports A'),
  ('00000000-0000-0000-0000-00000000e102', 'reports-b', 'Reports B');

insert into public.organization_members (organization_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e1b1', 'owner'),
  ('00000000-0000-0000-0000-00000000e102', '00000000-0000-0000-0000-00000000e1b2', 'owner');

insert into public.events (id, organization_id, slug, title, status, published_at) values
  ('00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', 'informe', 'Informe', 'published', now());

insert into public.spots (id, organization_id, name) values
  ('00000000-0000-0000-0000-00000000e121', '00000000-0000-0000-0000-00000000e101', 'Café'),
  ('00000000-0000-0000-0000-00000000e122', '00000000-0000-0000-0000-00000000e101', 'Rueda'),
  ('00000000-0000-0000-0000-00000000e123', '00000000-0000-0000-0000-00000000e101', 'Mazo'),
  ('00000000-0000-0000-0000-00000000e124', '00000000-0000-0000-0000-00000000e101', 'Apagado');

-- Tres stands activos y uno apagado.
insert into public.event_spots (id, event_id, organization_id, spot_id, code, is_active) values
  ('00000000-0000-0000-0000-00000000e131', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e121', 'S1', true),
  ('00000000-0000-0000-0000-00000000e132', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e122', 'S2', true),
  ('00000000-0000-0000-0000-00000000e133', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e123', 'S3', true),
  ('00000000-0000-0000-0000-00000000e134', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e124', 'S4', false);

-- Caro está bloqueada: sus medallas cuentan como visitas, no para los premios.
insert into public.event_registrations (id, event_id, organization_id, user_id, blocked_at) values
  ('00000000-0000-0000-0000-00000000e151', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e1a1', null),
  ('00000000-0000-0000-0000-00000000e152', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e1a2', null),
  ('00000000-0000-0000-0000-00000000e153', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e1a3', now()),
  ('00000000-0000-0000-0000-00000000e154', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e1a4', null);

-- S1: 3 medallas, S2: 3, S3: 2, S4: 0.
insert into public.spot_claims (id, event_spot_id, registration_id, event_id, organization_id, user_id, claimed_at) values
  -- Ana arranca en S1.
  ('00000000-0000-0000-0000-00000000e161', '00000000-0000-0000-0000-00000000e131', '00000000-0000-0000-0000-00000000e151', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e1a1', '2026-11-14 13:00Z'),
  ('00000000-0000-0000-0000-00000000e162', '00000000-0000-0000-0000-00000000e132', '00000000-0000-0000-0000-00000000e151', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e1a1', '2026-11-14 13:10Z'),
  -- Beto arranca en S2 y completa.
  ('00000000-0000-0000-0000-00000000e163', '00000000-0000-0000-0000-00000000e132', '00000000-0000-0000-0000-00000000e152', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e1a2', '2026-11-14 14:00Z'),
  ('00000000-0000-0000-0000-00000000e164', '00000000-0000-0000-0000-00000000e131', '00000000-0000-0000-0000-00000000e152', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e1a2', '2026-11-14 14:05Z'),
  ('00000000-0000-0000-0000-00000000e165', '00000000-0000-0000-0000-00000000e133', '00000000-0000-0000-0000-00000000e152', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e1a2', '2026-11-14 14:10Z'),
  -- Caro arranca en S2.
  ('00000000-0000-0000-0000-00000000e166', '00000000-0000-0000-0000-00000000e132', '00000000-0000-0000-0000-00000000e153', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e1a3', '2026-11-14 15:00Z'),
  -- Dani saca S1 y S3 en el mismo instante: la de id menor (S1) es la primera parada.
  ('00000000-0000-0000-0000-00000000e167', '00000000-0000-0000-0000-00000000e131', '00000000-0000-0000-0000-00000000e154', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e1a4', '2026-11-14 15:30Z'),
  ('00000000-0000-0000-0000-00000000e169', '00000000-0000-0000-0000-00000000e133', '00000000-0000-0000-0000-00000000e154', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e1a4', '2026-11-14 15:30Z');

-- «Todas» pide los 3 activos y tiene un cupo; «Dos» no tiene cupo.
insert into public.event_awards (id, event_id, organization_id, title, kind, threshold, slots) values
  ('00000000-0000-0000-0000-00000000e171', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', 'Todas', 'percent', 100, 1),
  ('00000000-0000-0000-0000-00000000e172', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', 'Dos', 'count', 2, null);
insert into public.award_winners (award_id, event_id, organization_id, user_id, position) values
  ('00000000-0000-0000-0000-00000000e171', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e1a2', 1),
  ('00000000-0000-0000-0000-00000000e172', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e1a1', 1),
  ('00000000-0000-0000-0000-00000000e172', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e1a2', 2),
  ('00000000-0000-0000-0000-00000000e172', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e1a4', 3);

-- Un sorteo con una extracción anulada y una válida.
insert into public.raffles (id, event_id, organization_id, title) values
  ('00000000-0000-0000-0000-00000000e181', '00000000-0000-0000-0000-00000000e111', '00000000-0000-0000-0000-00000000e101', 'Remera');
insert into public.raffle_draws (raffle_id, organization_id, draw_number, winner_user_id, winner_name, eligible_count, voided_at, void_reason) values
  ('00000000-0000-0000-0000-00000000e181', '00000000-0000-0000-0000-00000000e101', 1, '00000000-0000-0000-0000-00000000e1a1', 'Ana', 3, now(), 'No estaba'),
  ('00000000-0000-0000-0000-00000000e181', '00000000-0000-0000-0000-00000000e101', 2, '00000000-0000-0000-0000-00000000e1a4', 'Dani', 2, null, null);

-- Equipo de la org.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e1b1","role":"authenticated"}', true);

select results_eq(
  $$ select * from public.spot_report('00000000-0000-0000-0000-00000000e131') $$,
  $$ values ('00000000-0000-0000-0000-00000000e111'::uuid, 3, 2, 1, 3, 2.7) $$,
  'a stand: visits, first stops (the tie goes to the lower id), shared first place, active stands and their average'
);

select results_eq(
  $$ select visits, first_stops, rank from public.spot_report('00000000-0000-0000-0000-00000000e133') $$,
  $$ values (2, 0, 3) $$,
  'a stand reached at the same instant as another is not a first stop, and ranks after the tie'
);

select results_eq(
  $$ select visits, first_stops, rank, stands from public.spot_report('00000000-0000-0000-0000-00000000e134') $$,
  $$ values (0, 0, null::int, 3) $$,
  'an inactive stand has no place and is not counted among the active ones'
);

select results_eq(
  $$ select * from public.spot_hourly('00000000-0000-0000-0000-00000000e131') $$,
  $$ values ('2026-11-14 13:00Z'::timestamptz, 1),
            ('2026-11-14 14:00Z'::timestamptz, 1),
            ('2026-11-14 15:00Z'::timestamptz, 1) $$,
  'a stand''s medals per hour of the event''s zone'
);

select results_eq(
  $$ select kind, title, needed, slots, winners, reached from public.event_prizes('00000000-0000-0000-0000-00000000e111') $$,
  $$ values ('premio', 'Dos', 2, null::int, 3, 3),
            ('premio', 'Todas', 3, 1, 1, 1),
            ('sorteo', 'Remera', 1, null::int, 1, 3) $$,
  'each prize with what it asked, its slots, its winners and who reached it, without blocked visitors or voided draws'
);

-- Equipo de otra org.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e1b2","role":"authenticated"}', true);

-- Los stands y los premios de un evento publicado son públicos (la portada); las
-- medallas y los ganadores, no: las cifras dan cero.
select results_eq(
  $$ select visits, first_stops from public.spot_report('00000000-0000-0000-0000-00000000e131') $$,
  $$ values (0, 0) $$,
  'another org counts no visits nor first stops here'
);

select is(
  (select sum(winners + reached)::int from public.event_prizes('00000000-0000-0000-0000-00000000e111')), 0,
  'another org counts no winners nor visitors who reached a prize here'
);

reset role;
set local role anon;

select throws_ok(
  $$ select * from public.spot_report('00000000-0000-0000-0000-00000000e131') $$,
  '42501', null,
  'anon cannot read a stand report'
);

select * from finish();
rollback;
