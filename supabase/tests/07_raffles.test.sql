-- R6 · bloque 1: sorteos, elegibilidad, extracción, anulación y publicación.
begin;
create extension if not exists pgtap with schema extensions;

select plan(36);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000009a1', 'dos@raffles.local'),
  ('00000000-0000-0000-0000-0000000009a2', 'una@raffles.local'),
  ('00000000-0000-0000-0000-0000000009a3', 'bloqueado@raffles.local'),
  ('00000000-0000-0000-0000-0000000009a4', 'sinmedallas@raffles.local'),
  ('00000000-0000-0000-0000-0000000009a5', 'sinnombre@raffles.local'),
  ('00000000-0000-0000-0000-0000000009b1', 'owner@raffles.local'),
  ('00000000-0000-0000-0000-0000000009b2', 'ajeno@raffles.local'),
  ('00000000-0000-0000-0000-0000000009d1', 'dev@raffles.local');

update public.profiles set full_name = 'Ana María García' where id = '00000000-0000-0000-0000-0000000009a1';
update public.profiles set full_name = 'Beto'             where id = '00000000-0000-0000-0000-0000000009a2';

insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-0000000009d1');

insert into public.organizations (id, slug, name) values
  ('00000000-0000-0000-0000-000000000901', 'raffles-a', 'Raffles A'),
  ('00000000-0000-0000-0000-000000000902', 'raffles-b', 'Raffles B');

insert into public.organization_members (organization_id, user_id, role) values
  ('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009b1', 'staff'),
  ('00000000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-0000000009b2', 'owner');

insert into public.events (id, organization_id, slug, title, status, published_at) values
  ('00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', 'publicado', 'Publicado', 'published', now()),
  ('00000000-0000-0000-0000-000000000912', '00000000-0000-0000-0000-000000000901', 'borrador',  'Borrador',  'draft',     null);

insert into public.spots (id, organization_id, name) values
  ('00000000-0000-0000-0000-000000000921', '00000000-0000-0000-0000-000000000901', 'Café'),
  ('00000000-0000-0000-0000-000000000922', '00000000-0000-0000-0000-000000000901', 'Rueda');

insert into public.event_spots (id, event_id, organization_id, spot_id, code) values
  ('00000000-0000-0000-0000-000000000931', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000921', 'A01'),
  ('00000000-0000-0000-0000-000000000932', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000922', 'A02');

-- a1: dos medallas. a2: una. a3: una, pero bloqueado. a4: registrado sin medallas.
insert into public.event_registrations (id, event_id, organization_id, user_id, blocked_at) values
  ('00000000-0000-0000-0000-0000000009e1', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009a1', null),
  ('00000000-0000-0000-0000-0000000009e2', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009a2', null),
  ('00000000-0000-0000-0000-0000000009e3', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009a3', now()),
  ('00000000-0000-0000-0000-0000000009e4', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009a4', null);

insert into public.spot_claims (event_spot_id, registration_id, event_id, organization_id, user_id) values
  ('00000000-0000-0000-0000-000000000931', '00000000-0000-0000-0000-0000000009e1', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009a1'),
  ('00000000-0000-0000-0000-000000000932', '00000000-0000-0000-0000-0000000009e1', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009a1'),
  ('00000000-0000-0000-0000-000000000931', '00000000-0000-0000-0000-0000000009e2', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009a2'),
  ('00000000-0000-0000-0000-000000000931', '00000000-0000-0000-0000-0000000009e3', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009a3');

-- f1: cualquiera con una medalla. f2: pide dos. f3: en un borrador. f4: pide más de las que hay.
insert into public.raffles (id, event_id, organization_id, title, min_claims) values
  ('00000000-0000-0000-0000-0000000009f1', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', 'Bicicleta', 1),
  ('00000000-0000-0000-0000-0000000009f2', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', 'Tablet',    2),
  ('00000000-0000-0000-0000-0000000009f3', '00000000-0000-0000-0000-000000000912', '00000000-0000-0000-0000-000000000901', 'Borrador',  1),
  ('00000000-0000-0000-0000-0000000009f4', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', 'Imposible', 3);

-- ---------------------------------------------------------------------------
-- Sin sesión
-- ---------------------------------------------------------------------------

set local role anon;

select throws_ok(
  $$ select public.draw_raffle('00000000-0000-0000-0000-0000000009f1') $$,
  '42501', null, 'anon cannot draw'
);

select is_empty(
  $$ select id from public.raffles $$,
  'anon sees no raffle until its winners are published'
);

reset role;

-- ---------------------------------------------------------------------------
-- Quién no puede
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000009a1","role":"authenticated"}', true);

select throws_ok(
  $$ select public.draw_raffle('00000000-0000-0000-0000-0000000009f1') $$,
  '42501', null, 'a visitor cannot draw'
);

select throws_ok(
  $$ insert into public.raffles (event_id, organization_id, title)
     values ('00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', 'Mío') $$,
  '42501', null, 'a visitor cannot create a raffle'
);

select is_empty(
  $$ select id from public.raffles $$,
  'a visitor sees no unpublished raffle'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000009b2","role":"authenticated"}', true);

select throws_ok(
  $$ select public.draw_raffle('00000000-0000-0000-0000-0000000009f1') $$,
  '42501', null, 'another org cannot draw'
);

select throws_ok(
  $$ insert into public.raffles (event_id, organization_id, title)
     values ('00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', 'Ajeno') $$,
  '42501', null, 'another org cannot create a raffle here'
);

select throws_ok(
  $$ select public.publish_raffle_winners('00000000-0000-0000-0000-0000000009f1') $$,
  '42501', null, 'another org cannot publish winners'
);

select is_empty(
  $$ select user_id from public.raffle_eligible('00000000-0000-0000-0000-0000000009f1') $$,
  'another org sees nobody eligible'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000009d1","role":"authenticated"}', true);

select throws_ok(
  $$ select public.draw_raffle('00000000-0000-0000-0000-0000000009f1') $$,
  '42501', null, 'the developer reads in support mode but cannot draw'
);

-- ---------------------------------------------------------------------------
-- Equipo: crear y elegibilidad
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000009b1","role":"authenticated"}', true);

select lives_ok(
  $$ insert into public.raffles (event_id, organization_id, title)
     values ('00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', 'Remera') $$,
  'staff creates a raffle'
);

select is(
  (select min_claims from public.raffles where title = 'Remera'),
  1,
  'one medal is enough by default'
);

select throws_ok(
  $$ insert into public.raffles (event_id, organization_id, title, min_claims)
     values ('00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', 'Cero', 0) $$,
  '23514', null, 'a raffle cannot ask for zero medals'
);

select results_eq(
  $$ select user_id from public.raffle_eligible('00000000-0000-0000-0000-0000000009f1') order by user_id $$,
  $$ values ('00000000-0000-0000-0000-0000000009a1'::uuid), ('00000000-0000-0000-0000-0000000009a2'::uuid) $$,
  'eligible: medals and not blocked (the blocked and the empty-handed are out)'
);

select results_eq(
  $$ select user_id from public.raffle_eligible('00000000-0000-0000-0000-0000000009f2') $$,
  $$ values ('00000000-0000-0000-0000-0000000009a1'::uuid) $$,
  'min_claims narrows who is eligible'
);

-- ---------------------------------------------------------------------------
-- Extraer
-- ---------------------------------------------------------------------------

select throws_ok(
  $$ select public.draw_raffle('00000000-0000-0000-0000-0000000009f3') $$,
  '23514', null, 'a draft event cannot be drawn'
);

select throws_ok(
  $$ select public.draw_raffle('00000000-0000-0000-0000-0000000009f4') $$,
  '23514', null, 'a raffle without eligible visitors cannot be drawn'
);

select is(
  (select winner_name from public.draw_raffle('00000000-0000-0000-0000-0000000009f2')),
  'Ana G.',
  'the public name is first name and last initial'
);

select is(
  (select eligible_count from public.raffle_draws where raffle_id = '00000000-0000-0000-0000-0000000009f2'),
  1,
  'each draw records how many took part'
);

select throws_ok(
  $$ select public.draw_raffle('00000000-0000-0000-0000-0000000009f2') $$,
  '23514', null, 'the same winner never comes out twice'
);

-- El grupo de dos se agota en dos tiradas, sin repetir y sin el bloqueado.
select lives_ok(
  $$ select public.draw_raffle('00000000-0000-0000-0000-0000000009f1') $$,
  'first draw'
);
select lives_ok(
  $$ select public.draw_raffle('00000000-0000-0000-0000-0000000009f1') $$,
  'second draw'
);
select throws_ok(
  $$ select public.draw_raffle('00000000-0000-0000-0000-0000000009f1') $$,
  '23514', null, 'the pool runs out instead of drawing someone ineligible'
);

select is_empty(
  $$ select winner_user_id from public.raffle_draws
     where raffle_id = '00000000-0000-0000-0000-0000000009f1'
       and winner_user_id not in ('00000000-0000-0000-0000-0000000009a1', '00000000-0000-0000-0000-0000000009a2') $$,
  'only eligible visitors won'
);

-- ---------------------------------------------------------------------------
-- Anular
-- ---------------------------------------------------------------------------

select throws_ok(
  $$ delete from public.raffle_draws where raffle_id = '00000000-0000-0000-0000-0000000009f2' $$,
  '42501', null, 'a draw cannot be deleted'
);

select throws_ok(
  $$ update public.raffle_draws set winner_name = 'Otro' where raffle_id = '00000000-0000-0000-0000-0000000009f2' $$,
  '42501', null, 'a draw cannot be edited'
);

select throws_ok(
  $$ select public.void_raffle_draw(
       (select id from public.raffle_draws where raffle_id = '00000000-0000-0000-0000-0000000009f2'), '   ') $$,
  '23514', null, 'voiding needs a reason'
);

select throws_ok(
  $$ select public.void_raffle_draw(
       (select id from public.raffle_draws where raffle_id = '00000000-0000-0000-0000-0000000009f2'), null) $$,
  '23514', null, 'a null reason does not slip through the check'
);

select is(
  (select void_reason from public.void_raffle_draw(
    (select id from public.raffle_draws where raffle_id = '00000000-0000-0000-0000-0000000009f2'), 'No estaba')),
  'No estaba',
  'staff voids a draw with a reason'
);

select is(
  (select void_reason from public.void_raffle_draw(
    (select id from public.raffle_draws where raffle_id = '00000000-0000-0000-0000-0000000009f2'), 'Otro motivo')),
  'No estaba',
  'voiding twice keeps the first reason'
);

select is(
  (select count(*)::int from public.raffle_draws where raffle_id = '00000000-0000-0000-0000-0000000009f2'),
  1,
  'voiding does not delete'
);

select is_empty(
  $$ select user_id from public.raffle_eligible('00000000-0000-0000-0000-0000000009f2') $$,
  'a voided winner does not go back into the pool'
);

select throws_ok(
  $$ select public.publish_raffle_winners('00000000-0000-0000-0000-0000000009f2') $$,
  '23514', null, 'a raffle whose only draw was voided has no winners to publish'
);

-- ---------------------------------------------------------------------------
-- Publicar
-- ---------------------------------------------------------------------------

select public.void_raffle_draw(
  (select id from public.raffle_draws where raffle_id = '00000000-0000-0000-0000-0000000009f1' and draw_number = 2),
  'No se presentó'
);
select public.publish_raffle_winners('00000000-0000-0000-0000-0000000009f1');

reset role;
set local role anon;

select results_eq(
  $$ select draw_number from public.raffle_draws order by draw_number $$,
  $$ values (1) $$,
  'anon sees published winners, without voided draws or unpublished raffles'
);

select throws_ok(
  $$ select winner_user_id from public.raffle_draws $$,
  '42501', null, 'anon cannot read who the winner is beyond the public name'
);

reset role;

select results_eq(
  $$ select action, count(*)::int from public.audit_logs
     where organization_id = '00000000-0000-0000-0000-000000000901'
       and action like 'raffle.%'
     group by action order by action $$,
  $$ values ('raffle.draw_voided', 2), ('raffle.drawn', 3), ('raffle.winners_published', 1) $$,
  'every step leaves one audit row (voiding twice only counts once)'
);

select * from finish();
rollback;
