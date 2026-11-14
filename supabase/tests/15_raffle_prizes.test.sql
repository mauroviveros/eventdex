-- R19 · bloque 1: la descripción y la imagen del premio las escribe solo su org.
begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000da1', 'staff-a@prizes.local'),
  ('00000000-0000-0000-0000-000000000db1', 'staff-b@prizes.local'),
  ('00000000-0000-0000-0000-000000000dc1', 'visitante@prizes.local');

insert into public.organizations (id, slug, name) values
  ('0000000a-0000-0000-0000-00000000000d', 'prizes-a', 'Prizes A'),
  ('0000000b-0000-0000-0000-00000000000d', 'prizes-b', 'Prizes B');

insert into public.organization_members (organization_id, user_id, role) values
  ('0000000a-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000da1', 'staff'),
  ('0000000b-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000db1', 'staff');

insert into public.events (id, organization_id, slug, title, status, published_at) values
  ('00000000-0000-0000-0000-0000000000e1', '0000000a-0000-0000-0000-00000000000d', 'publicado', 'Publicado', 'published', now()),
  ('00000000-0000-0000-0000-0000000000e2', '0000000a-0000-0000-0000-00000000000d', 'borrador',  'Borrador',  'draft',     null);

insert into public.raffles (id, event_id, organization_id, title, min_claims) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', '0000000a-0000-0000-0000-00000000000d', 'Bicicleta', 2),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000e2', '0000000a-0000-0000-0000-00000000000d', 'Borrador',  1);

select results_eq(
  $$ select public, file_size_limit::int, 'image/svg+xml' = any (allowed_mime_types)
     from storage.buckets where id = 'raffle-images' $$,
  $$ values (true, 1572864, false) $$,
  'the prize image bucket is public, capped and refuses SVG'
);

select throws_ok(
  $$ update public.raffles set image_path = '0000000b-0000-0000-0000-00000000000d/x.png'
     where id = '00000000-0000-0000-0000-0000000000f1' $$,
  '23514', null,
  'a raffle cannot point its image at another org'
);

select throws_ok(
  $$ update public.raffles set description = '   ' where id = '00000000-0000-0000-0000-0000000000f1' $$,
  '23514', null,
  'a blank description is refused'
);

-- Quien mira sin sesión
set local role anon;

select results_eq(
  $$ select title from public.raffles where organization_id = '0000000a-0000-0000-0000-00000000000d' $$,
  $$ values ('Bicicleta') $$,
  'anon sees the prizes of a published event, and not those of a draft'
);

select throws_ok(
  $$ update public.raffles set description = 'Mía' $$,
  '42501', null,
  'anon cannot write a prize'
);

reset role;

-- El equipo de la org
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000da1","role":"authenticated"}', true);

select lives_ok(
  $$ update public.raffles
     set description = 'Rodado 29, con casco', image_path = '0000000a-0000-0000-0000-00000000000d/bici.png'
     where id = '00000000-0000-0000-0000-0000000000f1' $$,
  'staff writes the description and the image of its prize'
);

select throws_ok(
  $$ update public.raffles set min_claims = 1 where id = '00000000-0000-0000-0000-0000000000f1' $$,
  '42501', null,
  'staff cannot change the minimum of a raffle that may have draws'
);

select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('raffle-images', '0000000a-0000-0000-0000-00000000000d/bici.png') $$,
  'staff uploads a prize image to the folder of its org'
);

-- Otra org y un visitante
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000db1","role":"authenticated"}', true);

update public.raffles set description = 'Ajena' where id = '00000000-0000-0000-0000-0000000000f1';
select results_eq(
  $$ select description from public.raffles where id = '00000000-0000-0000-0000-0000000000f1' $$,
  $$ values ('Rodado 29, con casco') $$,
  'staff of another org changes nothing here'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('raffle-images', '0000000a-0000-0000-0000-00000000000d/ajena.png') $$,
  '42501', null,
  'staff of another org cannot upload to this folder'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000dc1","role":"authenticated"}', true);

update public.raffles set description = 'Del visitante' where id = '00000000-0000-0000-0000-0000000000f1';
select results_eq(
  $$ select description from public.raffles where id = '00000000-0000-0000-0000-0000000000f1' $$,
  $$ values ('Rodado 29, con casco') $$,
  'a visitor changes nothing, and sees the published prize'
);

reset role;

select * from finish();
rollback;
