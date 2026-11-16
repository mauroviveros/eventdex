-- R31 · bloque 1: premios por mérito. Se ganan al escanear, con posición y cupo, y
-- ni otra org ni otro visitante los ven ni los tocan.
begin;
create extension if not exists pgtap with schema extensions;

select plan(21);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000009a1', 'uno@awards.local'),
  ('00000000-0000-0000-0000-0000000009a2', 'dos@awards.local'),
  ('00000000-0000-0000-0000-0000000009a3', 'tres@awards.local'),
  ('00000000-0000-0000-0000-0000000009b1', 'owner@awards.local'),
  ('00000000-0000-0000-0000-0000000009b2', 'ajeno@awards.local');

insert into public.organizations (id, slug, name) values
  ('00000000-0000-0000-0000-000000000901', 'awards-a', 'Awards A'),
  ('00000000-0000-0000-0000-000000000902', 'awards-b', 'Awards B');

insert into public.organization_members (organization_id, user_id, role) values
  ('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009b1', 'owner'),
  ('00000000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-0000000009b2', 'owner');

insert into public.events (id, organization_id, slug, title, status, published_at) values
  ('00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', 'en-curso', 'En curso', 'published', now()),
  ('00000000-0000-0000-0000-000000000912', '00000000-0000-0000-0000-000000000901', 'borrador', 'Borrador', 'draft', null);

insert into public.event_schedules (event_id, organization_id, starts_at, ends_at) values
  ('00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', now() - interval '2 hours', now() + interval '6 hours');

insert into public.spots (id, organization_id, name) values
  ('00000000-0000-0000-0000-000000000921', '00000000-0000-0000-0000-000000000901', 'Café'),
  ('00000000-0000-0000-0000-000000000922', '00000000-0000-0000-0000-000000000901', 'Rueda'),
  ('00000000-0000-0000-0000-000000000923', '00000000-0000-0000-0000-000000000901', 'Mazo'),
  ('00000000-0000-0000-0000-000000000924', '00000000-0000-0000-0000-000000000901', 'Dado');

insert into public.event_spots (id, event_id, organization_id, spot_id, code) values
  ('00000000-0000-0000-0000-000000000931', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000921', 'A01'),
  ('00000000-0000-0000-0000-000000000932', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000922', 'A02'),
  ('00000000-0000-0000-0000-000000000933', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000923', 'A03'),
  ('00000000-0000-0000-0000-000000000934', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000924', 'A04');

-- «Los primeros 2 en completar todas», «la mitad» (para todos) y «3 medallas».
insert into public.event_awards (id, event_id, organization_id, title, kind, threshold, slots) values
  ('00000000-0000-0000-0000-0000000009c1', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', 'Completa', 'percent', 100, 2),
  ('00000000-0000-0000-0000-0000000009c2', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', 'La mitad', 'percent', 50, null),
  ('00000000-0000-0000-0000-0000000009c3', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', 'Tres', 'count', 3, null);
insert into public.event_awards (id, event_id, organization_id, title, kind, threshold) values
  ('00000000-0000-0000-0000-0000000009c4', '00000000-0000-0000-0000-000000000912', '00000000-0000-0000-0000-000000000901', 'Del borrador', 'count', 1);

create schema awt;

-- Escanea los spots dados como el visitante dado.
create function awt.scan(p_user uuid, p_spots text[]) returns void
language plpgsql as $$
declare s text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  foreach s in array p_spots loop
    perform public.claim_spot(('00000000-0000-0000-0000-0000000009' || s)::uuid);
  end loop;
end $$;

create function awt.wins(p_user uuid) returns text
language sql as $$
  select coalesce(string_agg(a.title || ' #' || w.position, ', ' order by a.title), '')
  from public.award_winners w join public.event_awards a on a.id = w.award_id
  where w.user_id = p_user
$$;

grant usage on schema awt to authenticated, anon;
set local role authenticated;

-- Primer visitante: una medalla no alcanza, la segunda cruza «la mitad».
select awt.scan('00000000-0000-0000-0000-0000000009a1', array['31']);
reset role;
select is(awt.wins('00000000-0000-0000-0000-0000000009a1'), '', 'one medal wins nothing');

set local role authenticated;
select awt.scan('00000000-0000-0000-0000-0000000009a1', array['32']);
reset role;
select is(awt.wins('00000000-0000-0000-0000-0000000009a1'), 'La mitad #1', 'the medal that crosses half wins it, first in line');

set local role authenticated;
select awt.scan('00000000-0000-0000-0000-0000000009a1', array['33', '34']);
reset role;
select is(
  awt.wins('00000000-0000-0000-0000-0000000009a1'), 'Completa #1, La mitad #1, Tres #1',
  'the last medal completes the collection and wins the first place'
);

set local role authenticated;
select awt.scan('00000000-0000-0000-0000-0000000009a1', array['31', '34']);
reset role;
select is(
  (select count(*)::int from public.award_winners where user_id = '00000000-0000-0000-0000-0000000009a1'), 3,
  'scanning again does not win twice'
);

-- Segundo: completa, y es el segundo.
set local role authenticated;
select awt.scan('00000000-0000-0000-0000-0000000009a2', array['31', '32', '33', '34']);
reset role;
select is(
  awt.wins('00000000-0000-0000-0000-0000000009a2'), 'Completa #2, La mitad #2, Tres #2',
  'the second to complete takes the second place'
);

-- Tercero: completa pero el cupo ya se llenó; los otros dos sí los gana.
set local role authenticated;
select awt.scan('00000000-0000-0000-0000-0000000009a3', array['31', '32', '33', '34']);
reset role;
select is(
  awt.wins('00000000-0000-0000-0000-0000000009a3'), 'La mitad #3, Tres #3',
  'with the slots taken, the third completes and wins nothing for it'
);

select is(
  (select count(*)::int from public.award_winners where award_id = '00000000-0000-0000-0000-0000000009c1'), 2,
  'the slots are exact'
);

-- Visitante: solo ve lo suyo y no escribe.
set local role authenticated;
select is(
  (select count(*)::int from public.award_winners), 2,
  'a visitor reads only their own wins'
);

select throws_ok(
  $$ insert into public.award_winners (award_id, event_id, organization_id, user_id, position)
     values ('00000000-0000-0000-0000-0000000009c3', '00000000-0000-0000-0000-000000000911',
             '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009a3', 9) $$,
  '42501', null,
  'a visitor cannot give themselves a prize'
);

-- Sin sesión: ve los premios del evento publicado, los cupos y a nadie.
reset role;
set local role anon;

select is(
  (select count(*)::int from public.event_awards), 3,
  'anon reads the awards of the published event, not the draft''s'
);

select results_eq(
  $$ select award_id, taken from public.event_award_counts('00000000-0000-0000-0000-000000000911') order by award_id $$,
  $$ values ('00000000-0000-0000-0000-0000000009c1'::uuid, 2::bigint),
            ('00000000-0000-0000-0000-0000000009c2'::uuid, 3::bigint),
            ('00000000-0000-0000-0000-0000000009c3'::uuid, 3::bigint) $$,
  'the counts say how many won each, with no names'
);

select is(
  (select count(*)::int from public.event_award_counts('00000000-0000-0000-0000-000000000912')), 0,
  'a draft''s counts are not public'
);

select throws_ok(
  $$ select * from public.award_winners $$,
  '42501', null,
  'anon cannot read winners'
);

-- Equipo de la org.
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000009b1","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.award_winners), 8,
  'the team reads every winner of its org'
);

select throws_ok(
  $$ update public.event_awards set threshold = 1 where id = '00000000-0000-0000-0000-0000000009c1' $$,
  '42501', null,
  'the rule of an award is not edited'
);

select lives_ok(
  $$ update public.event_awards set title = 'Completa y gana', description = 'Pasá por la mesa' where id = '00000000-0000-0000-0000-0000000009c1' $$,
  'the title and the description are'
);

select throws_ok(
  $$ delete from public.event_awards where id = '00000000-0000-0000-0000-0000000009c1' $$,
  '23503', null,
  'an award with winners is not deleted'
);

select lives_ok(
  $$ delete from public.event_awards where id = '00000000-0000-0000-0000-0000000009c4' $$,
  'an award nobody won is'
);

select throws_ok(
  $$ insert into public.event_awards (event_id, organization_id, title, kind, threshold)
     values ('00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', 'Mucho', 'percent', 101) $$,
  '23514', null,
  'a percentage over 100 is refused'
);

-- Equipo de otra org.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000009b2","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.award_winners), 0,
  'the team of another org reads no winners'
);

select throws_ok(
  $$ insert into public.event_awards (event_id, organization_id, title, kind, threshold)
     values ('00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', 'Ajeno', 'count', 1) $$,
  '42501', null,
  'the team of another org cannot create awards here'
);

select * from finish();
rollback;
