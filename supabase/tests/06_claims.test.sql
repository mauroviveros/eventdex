-- R5 · bloque 1: registros, medallas y claim_spot().
begin;
create extension if not exists pgtap with schema extensions;

select plan(24);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000008a1', 'visitante@claims.local'),
  ('00000000-0000-0000-0000-0000000008a2', 'otra@claims.local'),
  ('00000000-0000-0000-0000-0000000008a3', 'bloqueado@claims.local'),
  ('00000000-0000-0000-0000-0000000008b1', 'owner@claims.local'),
  ('00000000-0000-0000-0000-0000000008b2', 'ajeno@claims.local'),
  ('00000000-0000-0000-0000-0000000008d1', 'dev@claims.local');

insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-0000000008d1');

insert into public.organizations (id, slug, name) values
  ('00000000-0000-0000-0000-000000000801', 'claims-a', 'Claims A'),
  ('00000000-0000-0000-0000-000000000802', 'claims-b', 'Claims B');

insert into public.organization_members (organization_id, user_id, role) values
  ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-0000000008b1', 'owner'),
  ('00000000-0000-0000-0000-000000000802', '00000000-0000-0000-0000-0000000008b2', 'owner');

-- Uno en curso, uno próximo (ambos publicados) y un borrador en curso.
insert into public.events (id, organization_id, slug, title, status, published_at) values
  ('00000000-0000-0000-0000-000000000811', '00000000-0000-0000-0000-000000000801', 'en-curso', 'En curso', 'published', now()),
  ('00000000-0000-0000-0000-000000000812', '00000000-0000-0000-0000-000000000801', 'proximo',  'Próximo',  'published', now()),
  ('00000000-0000-0000-0000-000000000813', '00000000-0000-0000-0000-000000000801', 'borrador', 'Borrador', 'draft',     null);

insert into public.event_schedules (event_id, organization_id, starts_at, ends_at) values
  ('00000000-0000-0000-0000-000000000811', '00000000-0000-0000-0000-000000000801', now() - interval '2 hours', now() + interval '6 hours'),
  ('00000000-0000-0000-0000-000000000812', '00000000-0000-0000-0000-000000000801', now() + interval '3 days',  now() + interval '3 days 8 hours'),
  ('00000000-0000-0000-0000-000000000813', '00000000-0000-0000-0000-000000000801', now() - interval '2 hours', now() + interval '6 hours');

insert into public.spots (id, organization_id, name) values
  ('00000000-0000-0000-0000-000000000821', '00000000-0000-0000-0000-000000000801', 'Café'),
  ('00000000-0000-0000-0000-000000000822', '00000000-0000-0000-0000-000000000801', 'Rueda');

-- Los del evento publicado se agregan después de publicar: el trigger les pone snapshot.
insert into public.event_spots (id, event_id, organization_id, spot_id, code, is_active) values
  ('00000000-0000-0000-0000-000000000831', '00000000-0000-0000-0000-000000000811', '00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000821', 'A01', true),
  ('00000000-0000-0000-0000-000000000832', '00000000-0000-0000-0000-000000000811', '00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000822', 'A02', false),
  ('00000000-0000-0000-0000-000000000833', '00000000-0000-0000-0000-000000000812', '00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000821', 'B01', true),
  ('00000000-0000-0000-0000-000000000834', '00000000-0000-0000-0000-000000000813', '00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000821', 'C01', true);

-- Un visitante ya bloqueado en el evento en curso.
insert into public.event_registrations (event_id, organization_id, user_id, blocked_at) values
  ('00000000-0000-0000-0000-000000000811', '00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-0000000008a3', now());

-- ---------------------------------------------------------------------------
-- Sin sesión
-- ---------------------------------------------------------------------------

set local role anon;

select throws_ok(
  $$ select * from public.claim_spot('00000000-0000-0000-0000-000000000831') $$,
  '42501', null,
  'anon cannot claim: the QR sends them to sign in first'
);

reset role;

-- ---------------------------------------------------------------------------
-- Visitante
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000008a1","role":"authenticated"}', true);

select throws_ok(
  $$ insert into public.spot_claims (event_spot_id, registration_id, event_id, organization_id, user_id)
     values ('00000000-0000-0000-0000-000000000831', gen_random_uuid(), '00000000-0000-0000-0000-000000000811',
             '00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-0000000008a1') $$,
  '42501', null,
  'a medal cannot be inserted without claim_spot()'
);

select throws_ok(
  $$ insert into public.event_registrations (event_id, organization_id, user_id)
     values ('00000000-0000-0000-0000-000000000811', '00000000-0000-0000-0000-000000000801',
             '00000000-0000-0000-0000-0000000008a1') $$,
  '42501', null,
  'nor a registration'
);

select is(
  (select outcome::text from public.claim_spot('00000000-0000-0000-0000-000000000831')),
  'new',
  'the first scan of an active spot in a live event is a new medal'
);

select is(
  (select count(*)::int from public.event_registrations
   where event_id = '00000000-0000-0000-0000-000000000811' and user_id = '00000000-0000-0000-0000-0000000008a1'),
  1,
  'and registers the visitor on the way'
);

select results_eq(
  $$ select outcome::text, claimed_at from public.claim_spot('00000000-0000-0000-0000-000000000831') $$,
  $$ select 'repeat', claimed_at from public.spot_claims
     where event_spot_id = '00000000-0000-0000-0000-000000000831'
       and user_id = '00000000-0000-0000-0000-0000000008a1' $$,
  'scanning twice says "already yours", with the first claim time'
);

select is(
  (select count(*)::int from public.spot_claims where user_id = '00000000-0000-0000-0000-0000000008a1'),
  1,
  'and does not duplicate the medal'
);

select is(
  (select outcome::text from public.claim_spot('00000000-0000-0000-0000-000000000832')),
  'inactive',
  'an inactive spot gives no medal'
);

select results_eq(
  $$ select outcome::text, starts_at > now() from public.claim_spot('00000000-0000-0000-0000-000000000833') $$,
  $$ values ('out_of_phase', true) $$,
  'an upcoming event is out of phase, and says when it starts'
);

select is_empty(
  $$ select 1 from public.event_registrations
     where event_id = '00000000-0000-0000-0000-000000000812' and user_id = '00000000-0000-0000-0000-0000000008a1' $$,
  'an out-of-phase scan does not register the visitor'
);

select throws_ok(
  $$ select * from public.claim_spot('00000000-0000-0000-0000-000000000834') $$,
  'P0002', null,
  'a draft event QR is an error, even while its schedule is live'
);

select throws_ok(
  $$ select * from public.claim_spot(gen_random_uuid()) $$,
  'P0002', null,
  'so is an unknown QR'
);

reset role;

-- La otra visitante también junta la del café.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000008a2","role":"authenticated"}', true);
select * from public.claim_spot('00000000-0000-0000-0000-000000000831');

select is(
  (select count(*)::int from public.spot_claims),
  1,
  'a visitor only reads her own medals'
);

reset role;

-- ---------------------------------------------------------------------------
-- Bloqueado
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000008a3","role":"authenticated"}', true);

select is(
  (select outcome::text from public.claim_spot('00000000-0000-0000-0000-000000000831')),
  'blocked',
  'a blocked visitor does not claim'
);

select is_empty(
  $$ select 1 from public.spot_claims $$,
  'and gets no medal'
);

update public.event_registrations set blocked_at = null
where user_id = '00000000-0000-0000-0000-0000000008a3';

reset role;

select isnt(
  (select blocked_at from public.event_registrations where user_id = '00000000-0000-0000-0000-0000000008a3'),
  null,
  'and cannot unblock himself'
);

-- ---------------------------------------------------------------------------
-- Equipo
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000008b1","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.spot_claims),
  2,
  'the org team reads every medal of its events'
);

select results_eq(
  $$ select email::text from public.profiles where email like '%@claims.local' order by email $$,
  $$ values ('bloqueado@claims.local'), ('otra@claims.local'), ('owner@claims.local'), ('visitante@claims.local') $$,
  'the team reads the profiles of who registered in its events, and no one else'
);

update public.event_registrations set blocked_at = now()
where user_id = '00000000-0000-0000-0000-0000000008a1';

reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000008a1","role":"authenticated"}', true);

select is(
  (select outcome::text from public.claim_spot('00000000-0000-0000-0000-000000000831')),
  'blocked',
  'once the team blocks a visitor, even a medal she had shows as blocked'
);

reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000008b2","role":"authenticated"}', true);

select is_empty(
  $$ select 1 from public.event_registrations $$,
  'another org team reads no registrations'
);

select results_eq(
  $$ select email::text from public.profiles where email like '%@claims.local' $$,
  $$ values ('ajeno@claims.local') $$,
  'nor the profiles of another org visitors'
);

reset role;

-- ---------------------------------------------------------------------------
-- Developer
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000008d1","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.spot_claims where organization_id = '00000000-0000-0000-0000-000000000801'),
  2,
  'the developer reads every medal (support mode)'
);

update public.event_registrations set blocked_at = null
where organization_id = '00000000-0000-0000-0000-000000000801';

reset role;

select is(
  (select count(*)::int from public.event_registrations
   where blocked_at is not null and organization_id = '00000000-0000-0000-0000-000000000801'),
  2,
  'but blocks or unblocks no one'
);

-- ---------------------------------------------------------------------------
-- Integridad
-- ---------------------------------------------------------------------------

select throws_ok(
  $$ delete from public.event_spots where id = '00000000-0000-0000-0000-000000000831' $$,
  '23503', null,
  'a spot with medals cannot be removed from the event (it is deactivated)'
);

select * from finish();
rollback;
