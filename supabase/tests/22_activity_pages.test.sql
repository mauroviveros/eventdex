-- R32 · rediseño, bloque DB: la actividad paginada por cursor. Las páginas no se
-- pisan aunque varias filas compartan el instante, se filtra por tipo y otra org
-- no ve nada.
begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000e0a1', 'ana@pages.local', '{"full_name":"Ana García"}'),
  ('00000000-0000-0000-0000-00000000e0a2', 'beto@pages.local', '{"full_name":"Beto Paz"}'),
  ('00000000-0000-0000-0000-00000000e0b1', 'owner@pages.local', '{}'),
  ('00000000-0000-0000-0000-00000000e0b2', 'ajeno@pages.local', '{}');

insert into public.organizations (id, slug, name) values
  ('00000000-0000-0000-0000-00000000e001', 'pages-a', 'Pages A'),
  ('00000000-0000-0000-0000-00000000e002', 'pages-b', 'Pages B');

insert into public.organization_members (organization_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e0b1', 'owner'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000e0b2', 'owner');

insert into public.events (id, organization_id, slug, title, status, published_at) values
  ('00000000-0000-0000-0000-00000000e011', '00000000-0000-0000-0000-00000000e001', 'feria', 'Feria', 'published', now());

insert into public.spots (id, organization_id, name) values
  ('00000000-0000-0000-0000-00000000e021', '00000000-0000-0000-0000-00000000e001', 'Café'),
  ('00000000-0000-0000-0000-00000000e022', '00000000-0000-0000-0000-00000000e001', 'Rueda'),
  ('00000000-0000-0000-0000-00000000e023', '00000000-0000-0000-0000-00000000e001', 'Mazo');

insert into public.event_spots (id, event_id, organization_id, spot_id, code) values
  ('00000000-0000-0000-0000-00000000e031', '00000000-0000-0000-0000-00000000e011', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e021', 'A1'),
  ('00000000-0000-0000-0000-00000000e032', '00000000-0000-0000-0000-00000000e011', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e022', 'A2'),
  ('00000000-0000-0000-0000-00000000e033', '00000000-0000-0000-0000-00000000e011', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e023', 'A3');

insert into public.event_registrations (id, event_id, organization_id, user_id) values
  ('00000000-0000-0000-0000-00000000e051', '00000000-0000-0000-0000-00000000e011', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e0a1'),
  ('00000000-0000-0000-0000-00000000e052', '00000000-0000-0000-0000-00000000e011', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e0a2');

-- Cuatro medallas en el mismo instante (las desempata el id) y una un minuto después.
insert into public.spot_claims (id, event_spot_id, registration_id, event_id, organization_id, user_id, claimed_at) values
  ('00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e031', '00000000-0000-0000-0000-00000000e051', '00000000-0000-0000-0000-00000000e011', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e0a1', '2026-11-14 20:00Z'),
  ('00000000-0000-0000-0000-00000000e102', '00000000-0000-0000-0000-00000000e032', '00000000-0000-0000-0000-00000000e051', '00000000-0000-0000-0000-00000000e011', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e0a1', '2026-11-14 20:00Z'),
  ('00000000-0000-0000-0000-00000000e103', '00000000-0000-0000-0000-00000000e033', '00000000-0000-0000-0000-00000000e051', '00000000-0000-0000-0000-00000000e011', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e0a1', '2026-11-14 20:00Z'),
  ('00000000-0000-0000-0000-00000000e104', '00000000-0000-0000-0000-00000000e031', '00000000-0000-0000-0000-00000000e052', '00000000-0000-0000-0000-00000000e011', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e0a2', '2026-11-14 20:00Z'),
  ('00000000-0000-0000-0000-00000000e105', '00000000-0000-0000-0000-00000000e032', '00000000-0000-0000-0000-00000000e052', '00000000-0000-0000-0000-00000000e011', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e0a2', '2026-11-14 20:01Z');

insert into public.event_awards (id, event_id, organization_id, title, kind, threshold) values
  ('00000000-0000-0000-0000-00000000e061', '00000000-0000-0000-0000-00000000e011', '00000000-0000-0000-0000-00000000e001', 'La mitad', 'count', 2);
insert into public.award_winners (id, award_id, event_id, organization_id, user_id, position, won_at) values
  ('00000000-0000-0000-0000-00000000e201', '00000000-0000-0000-0000-00000000e061', '00000000-0000-0000-0000-00000000e011', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e0a1', 1, '2026-11-14 20:02Z');

insert into public.raffles (id, event_id, organization_id, title) values
  ('00000000-0000-0000-0000-00000000e071', '00000000-0000-0000-0000-00000000e011', '00000000-0000-0000-0000-00000000e001', 'Remera');
insert into public.raffle_draws (id, raffle_id, organization_id, draw_number, winner_user_id, winner_name, eligible_count, drawn_at, voided_at, void_reason) values
  ('00000000-0000-0000-0000-00000000e301', '00000000-0000-0000-0000-00000000e071', '00000000-0000-0000-0000-00000000e001', 1, '00000000-0000-0000-0000-00000000e0a2', 'Beto P.', 2, '2026-11-14 20:03Z', null, null),
  ('00000000-0000-0000-0000-00000000e302', '00000000-0000-0000-0000-00000000e071', '00000000-0000-0000-0000-00000000e001', 2, '00000000-0000-0000-0000-00000000e0a1', 'Ana G.', 2, '2026-11-14 20:04Z', '2026-11-14 20:05Z', 'No estaba');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e0b1","role":"authenticated"}', true);

-- De lo último hacia atrás: el sorteo anulado no está y los empates bajan por id.
select results_eq(
  $$ select right(id::text, 3) from public.org_activity('00000000-0000-0000-0000-00000000e001', null, 3) $$,
  $$ values ('301'), ('201'), ('105') $$,
  'the first page is the latest, without the voided draw'
);

select results_eq(
  $$ select right(id::text, 3) from public.org_activity('00000000-0000-0000-0000-00000000e001', null, 3, null,
       '2026-11-14 20:01Z', '00000000-0000-0000-0000-00000000e105') $$,
  $$ values ('104'), ('103'), ('102') $$,
  'the next page starts right after the last row seen, through rows of the same instant'
);

select results_eq(
  $$ select right(id::text, 3) from public.org_activity('00000000-0000-0000-0000-00000000e001', null, 3, null,
       '2026-11-14 20:00Z', '00000000-0000-0000-0000-00000000e102') $$,
  $$ values ('101') $$,
  'the last page holds what is left, so the pages cover every row once'
);

select is(
  (select count(*)::int from public.org_activity('00000000-0000-0000-0000-00000000e001', null, 30, null, '2026-11-14 20:01Z')), 4,
  'a cursor without an id takes what is strictly before that instant'
);

select results_eq(
  $$ select kind, detail from public.org_activity('00000000-0000-0000-0000-00000000e001', null, 30, 'premio') $$,
  $$ values ('premio', 'La mitad') $$,
  'the kind filter keeps only that kind'
);

select is(
  (select count(*)::int from public.org_activity('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e011', 30, 'medalla')), 5,
  'the kind and the event filters together'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e0b2","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.org_activity('00000000-0000-0000-0000-00000000e001')), 0,
  'another org reads no activity here'
);

reset role;
set local role anon;

select throws_ok(
  $$ select * from public.org_activity('00000000-0000-0000-0000-00000000e001') $$,
  '42501', null,
  'anon cannot read the activity'
);

select * from finish();
rollback;
