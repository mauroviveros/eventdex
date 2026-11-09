-- R10 · bloque 2: cada org escribe los logos de sus spots y nada más.
begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000aa1', 'staff-a@logos.local'),
  ('00000000-0000-0000-0000-000000000ad1', 'dev@logos.local');

insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-000000000ad1');

insert into public.organizations (id, slug, name) values
  ('0000000a-0000-0000-0000-00000000000a', 'logos-a', 'Logos A'),
  ('0000000b-0000-0000-0000-00000000000a', 'logos-b', 'Logos B');

insert into public.organization_members (organization_id, user_id, role) values
  ('0000000a-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000aa1', 'staff');

select results_eq(
  $$ select public, file_size_limit::int, 'image/svg+xml' = any (allowed_mime_types)
     from storage.buckets where id = 'spot-logos' $$,
  $$ values (true, 1048576, false) $$,
  'the spot logo bucket is public, capped and refuses SVG'
);

select throws_ok(
  $$ insert into public.spots (organization_id, name, logo_path)
     values ('0000000a-0000-0000-0000-00000000000a', 'Ajeno', '0000000b-0000-0000-0000-00000000000a/x.png') $$,
  '23514', null,
  'a spot cannot point its logo at another org'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000aa1","role":"authenticated"}', true);

select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('spot-logos', '0000000a-0000-0000-0000-00000000000a/a.png') $$,
  'staff uploads to the folder of their org'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('spot-logos', '0000000b-0000-0000-0000-00000000000a/a.png') $$,
  '42501', null,
  'a member cannot upload to another org'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('spot-logos', 'no-es-uuid/a.png') $$,
  '42501', null,
  'a folder that is not an org is denied, not an error'
);
select is_empty(
  $$ select 1 from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and policyname like 'spot_logos%' and cmd <> 'INSERT' $$,
  'nobody replaces or deletes a logo a published snapshot may point at'
);

reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000ad1","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('spot-logos', '0000000a-0000-0000-0000-00000000000a/d.png') $$,
  '42501', null,
  'the developer in support mode cannot upload'
);
reset role;

set local role anon;
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('spot-logos', '0000000a-0000-0000-0000-00000000000a/z.png') $$,
  '42501', null,
  'anon cannot upload'
);
reset role;

select * from finish();
rollback;
