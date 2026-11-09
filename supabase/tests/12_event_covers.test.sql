-- R12 · bloque 2: cada org escribe los banners de sus eventos y nada más.
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000ca1', 'staff-a@covers.local'),
  ('00000000-0000-0000-0000-000000000cd1', 'dev@covers.local');

insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-000000000cd1');

insert into public.organizations (id, slug, name) values
  ('0000000a-0000-0000-0000-00000000000c', 'covers-a', 'Covers A'),
  ('0000000b-0000-0000-0000-00000000000c', 'covers-b', 'Covers B');

insert into public.organization_members (organization_id, user_id, role) values
  ('0000000a-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000ca1', 'staff');

insert into storage.objects (bucket_id, name) values
  ('event-covers', '0000000b-0000-0000-0000-00000000000c/ajeno.png');

select results_eq(
  $$ select public, file_size_limit::int, 'image/svg+xml' = any (allowed_mime_types)
     from storage.buckets where id = 'event-covers' $$,
  $$ values (true, 1572864, false) $$,
  'the event cover bucket is public, capped and refuses SVG'
);

select throws_ok(
  $$ insert into public.events (organization_id, slug, title, timezone, cover_path)
     values ('0000000a-0000-0000-0000-00000000000c', 'ajeno', 'Ajeno',
             'America/Argentina/Buenos_Aires', '0000000b-0000-0000-0000-00000000000c/x.png') $$,
  '23514', null,
  'an event cannot point its cover at another org'
);

select results_eq(
  $$ select array_agg(cmd::text order by cmd::text) from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and policyname like 'event_covers%' $$,
  $$ values (array['DELETE', 'INSERT', 'SELECT']) $$,
  'a cover can be replaced by a new file and the old one deleted, never overwritten'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000ca1","role":"authenticated"}', true);

select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('event-covers', '0000000a-0000-0000-0000-00000000000c/a.png') $$,
  'staff uploads to the folder of their org'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('event-covers', '0000000b-0000-0000-0000-00000000000c/a.png') $$,
  '42501', null,
  'a member cannot upload to another org'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('event-covers', 'no-es-uuid/a.png') $$,
  '42501', null,
  'a folder that is not an org is denied, not an error'
);
select is_empty(
  $$ select 1 from storage.objects
     where bucket_id = 'event-covers' and name like '0000000b-%' $$,
  'a member does not get to the files of another org, so cannot delete them'
);

reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000cd1","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('event-covers', '0000000a-0000-0000-0000-00000000000c/d.png') $$,
  '42501', null,
  'the developer in support mode cannot upload'
);
reset role;

set local role anon;
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('event-covers', '0000000a-0000-0000-0000-00000000000c/z.png') $$,
  '42501', null,
  'anon cannot upload'
);
reset role;

select * from finish();
rollback;
