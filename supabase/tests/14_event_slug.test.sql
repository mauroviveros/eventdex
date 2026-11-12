-- R15 · bloque 7: la dirección de un evento queda fija al publicarlo.
begin;
create extension if not exists pgtap with schema extensions;

select plan(4);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000e51', 'staff@slug.local');

insert into public.organizations (id, slug, name) values
  ('0000000e-0000-0000-0000-0000000005e1', 'slug-org', 'Slug Org');

insert into public.organization_members (organization_id, user_id, role) values
  ('0000000e-0000-0000-0000-0000000005e1', '00000000-0000-0000-0000-000000000e51', 'staff');

insert into public.events (id, organization_id, slug, title, status, published_at) values
  ('0000000e-0000-0000-0000-000000000051', '0000000e-0000-0000-0000-0000000005e1', 'borrador', 'Borrador', 'draft', null),
  ('0000000e-0000-0000-0000-000000000052', '0000000e-0000-0000-0000-0000000005e1', 'publicado', 'Publicado', 'published', now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000e51","role":"authenticated"}', true);

select lives_ok(
  $$ update public.events set slug = 'borrador-2' where id = '0000000e-0000-0000-0000-000000000051' $$,
  'a member moves a draft''s address'
);

select throws_ok(
  $$ update public.events set slug = 'publicado-2' where id = '0000000e-0000-0000-0000-000000000052' $$,
  '23514', null,
  'a published event''s address does not move, even past the app'
);

select lives_ok(
  $$ update public.events set title = 'Publicado de nuevo', slug = 'publicado'
     where id = '0000000e-0000-0000-0000-000000000052' $$,
  'a published event saves its data with the same address'
);

select is(
  (select slug::text from public.events where id = '0000000e-0000-0000-0000-000000000052'),
  'publicado',
  'the published address is unchanged'
);

select * from finish();
rollback;
