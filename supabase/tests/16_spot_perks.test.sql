-- R20 · bloque 1: el beneficio del stand lo escribe solo la org del evento.
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000ea1', 'staff-a@perks.local'),
  ('00000000-0000-0000-0000-000000000eb1', 'staff-b@perks.local');

insert into public.organizations (id, slug, name) values
  ('0000000a-0000-0000-0000-00000000000e', 'perks-a', 'Perks A'),
  ('0000000b-0000-0000-0000-00000000000e', 'perks-b', 'Perks B');

insert into public.organization_members (organization_id, user_id, role) values
  ('0000000a-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-000000000ea1', 'staff'),
  ('0000000b-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-000000000eb1', 'staff');

insert into public.spots (id, organization_id, name) values
  ('00000000-0000-0000-0000-0000000000a1', '0000000a-0000-0000-0000-00000000000e', 'Café de la Esquina'),
  ('00000000-0000-0000-0000-0000000000a2', '0000000a-0000-0000-0000-00000000000e', 'Rueda gigante');

insert into public.events (id, organization_id, slug, title, status, published_at) values
  ('00000000-0000-0000-0000-0000000000b1', '0000000a-0000-0000-0000-00000000000e', 'publicado', 'Publicado', 'published', now()),
  ('00000000-0000-0000-0000-0000000000b2', '0000000a-0000-0000-0000-00000000000e', 'borrador',  'Borrador',  'draft',     null);

insert into public.event_spots (id, event_id, organization_id, spot_id, code, perk) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', '0000000a-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-0000000000a1', 'A1', '10 % de descuento'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000b2', '0000000a-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-0000000000a2', 'A2', null);

select results_eq(
  $$ select perk, perk_hidden from public.event_spots
     where id = '00000000-0000-0000-0000-0000000000c2' $$,
  $$ values (null::text, false) $$,
  'a spot is born without a perk, and a visible one'
);

-- Quien mira sin sesión
set local role anon;

select results_eq(
  $$ select code, perk from public.event_spots
     where organization_id = '0000000a-0000-0000-0000-00000000000e' order by code $$,
  $$ values ('A1'::text, '10 % de descuento'::text) $$,
  'anon reads the perk of a published event, and nothing of a draft'
);

select throws_ok(
  $$ update public.event_spots set perk = 'Gratis' $$,
  '42501', null,
  'anon cannot write a perk'
);

-- Staff de otra org
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000eb1","role":"authenticated"}', true);

select is_empty(
  $$ update public.event_spots set perk = 'Mío' returning id $$,
  'staff of another org updates no perk'
);

-- Staff de la org
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000ea1","role":"authenticated"}', true);

select lives_ok(
  $$ update public.event_spots set perk = '2x1 en cafés'
     where id = '00000000-0000-0000-0000-0000000000c2' $$,
  'staff sets the perk of its own spot, even of a draft event'
);

select lives_ok(
  $$ update public.event_spots set perk = null
     where id = '00000000-0000-0000-0000-0000000000c2' $$,
  'staff clears a perk'
);

select lives_ok(
  $$ update public.event_spots set perk_hidden = true
     where id = '00000000-0000-0000-0000-0000000000c2' $$,
  'staff turns a perk into a surprise'
);

select throws_ok(
  $$ update public.event_spots set perk_hidden = null
     where id = '00000000-0000-0000-0000-0000000000c2' $$,
  '23502', null,
  'a perk is a surprise or it is not: never unknown'
);

select throws_ok(
  $$ update public.event_spots set perk = '   '
     where id = '00000000-0000-0000-0000-0000000000c2' $$,
  '23514', null,
  'a blank perk is refused'
);

select throws_ok(
  $$ update public.event_spots set perk = repeat('x', 121)
     where id = '00000000-0000-0000-0000-0000000000c2' $$,
  '23514', null,
  'a perk longer than 120 characters is refused'
);

select * from finish();
rollback;
