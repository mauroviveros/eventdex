-- R7 · bloque 1: solo el owner invita y edita la marca; el equipo deja rastro.
begin;
create extension if not exists pgtap with schema extensions;

select plan(29);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000008d1', 'dev@team.local'),
  ('00000000-0000-0000-0000-0000000008a1', 'owner-a@team.local'),
  ('00000000-0000-0000-0000-0000000008a2', 'staff-a@team.local'),
  ('00000000-0000-0000-0000-0000000008a3', 'quitar-a@team.local'),
  ('00000000-0000-0000-0000-0000000008b1', 'owner-b@team.local');

insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-0000000008d1');

insert into public.organizations (id, slug, name) values
  ('0000000a-0000-0000-0000-000000000008', 'team-a', 'Team A'),
  ('0000000b-0000-0000-0000-000000000008', 'team-b', 'Team B');

insert into public.organization_members (organization_id, user_id, role) values
  ('0000000a-0000-0000-0000-000000000008', '00000000-0000-0000-0000-0000000008a1', 'owner'),
  ('0000000a-0000-0000-0000-000000000008', '00000000-0000-0000-0000-0000000008a2', 'staff'),
  ('0000000a-0000-0000-0000-000000000008', '00000000-0000-0000-0000-0000000008a3', 'staff'),
  ('0000000b-0000-0000-0000-000000000008', '00000000-0000-0000-0000-0000000008b1', 'owner');

insert into public.organization_invitations (organization_id, email, role, expires_at) values
  ('0000000a-0000-0000-0000-000000000008', 'vencida@team.local', 'staff', now() - interval '1 day');

insert into public.organization_domains (id, organization_id, hostname, is_primary) values
  ('00000000-0000-0000-0000-000000000801', '0000000a-0000-0000-0000-000000000008', 'a.team-a.test', true),
  ('00000000-0000-0000-0000-000000000802', '0000000a-0000-0000-0000-000000000008', 'b.team-a.test', false);

-- ---------------------------------------------------------------------------
-- Owner de A
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000008a1","role":"authenticated"}', true);

select lives_ok(
  $$ select public.invite_member('0000000a-0000-0000-0000-000000000008', '  Nueva@Team.local ', 'staff') $$,
  'the owner invites'
);
select results_eq(
  $$ select email::text, invited_by from public.organization_invitations where email = 'nueva@team.local' $$,
  $$ values ('nueva@team.local', '00000000-0000-0000-0000-0000000008a1'::uuid) $$,
  'the invitation stores the normalized mail and who invited'
);
select throws_ok(
  $$ select public.invite_member('0000000a-0000-0000-0000-000000000008', 'nueva@team.local', 'staff') $$,
  '23505', null,
  'an open invitation cannot be duplicated'
);
select throws_ok(
  $$ select public.invite_member('0000000a-0000-0000-0000-000000000008', 'STAFF-a@team.local', 'staff') $$,
  '23505', null,
  'a current member cannot be invited'
);
select lives_ok(
  $$ select public.invite_member('0000000a-0000-0000-0000-000000000008', 'vencida@team.local', 'owner') $$,
  'an expired invitation can be sent again'
);
select results_eq(
  $$ select role::text from public.organization_invitations where email = 'vencida@team.local' $$,
  $$ values ('owner') $$,
  'and the new one replaces it'
);

select lives_ok(
  $$ update public.organizations
     set brand_color = '#808080', logo_path = '0000000a-0000-0000-0000-000000000008/logo.png'
     where id = '0000000a-0000-0000-0000-000000000008' $$,
  'the owner edits the brand; any valid hex is accepted'
);
select throws_ok(
  $$ update public.organizations set brand_color = 'verde' where id = '0000000a-0000-0000-0000-000000000008' $$,
  '23514', null,
  'a malformed brand color is rejected'
);
select throws_ok(
  $$ update public.organizations set logo_path = '0000000b-0000-0000-0000-000000000008/logo.png'
     where id = '0000000a-0000-0000-0000-000000000008' $$,
  '23514', null,
  'the logo cannot point to a file of another org'
);

select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('org-logos', '0000000a-0000-0000-0000-000000000008/logo.png') $$,
  'the owner uploads to the folder of their org'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('org-logos', '0000000b-0000-0000-0000-000000000008/logo.png') $$,
  '42501', null,
  'the owner cannot upload to another org'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('org-logos', 'no-es-uuid/logo.png') $$,
  '42501', null,
  'a folder that is not an org is denied, not an error'
);

-- Lo que tiene que dejar rastro.
update public.organization_members set role = 'owner'
where user_id = '00000000-0000-0000-0000-0000000008a3';
update public.organization_members set role = 'staff'
where user_id = '00000000-0000-0000-0000-0000000008a3';
delete from public.organization_members where user_id = '00000000-0000-0000-0000-0000000008a3';
delete from public.organization_invitations where email = 'nueva@team.local';

reset role;

select results_eq(
  $$ select action, count(*)::int from public.audit_logs
     where organization_id = '0000000a-0000-0000-0000-000000000008'
       and actor_id = '00000000-0000-0000-0000-0000000008a1'
     group by action order by action $$,
  $$ values
     ('invitation.created', 2),
     ('invitation.deleted', 2),
     ('member.deleted', 1),
     ('member.updated', 2) $$,
  'team changes leave a trail with their actor'
);
select results_eq(
  $$ select diff -> 'before' ->> 'role', diff -> 'after' ->> 'role' from public.audit_logs
     where action = 'member.updated'
       and organization_id = '0000000a-0000-0000-0000-000000000008'
     order by id limit 1 $$,
  $$ values ('staff', 'owner') $$,
  'a role change records before and after'
);

-- ---------------------------------------------------------------------------
-- Staff de A
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000008a2","role":"authenticated"}', true);

select throws_ok(
  $$ select public.invite_member('0000000a-0000-0000-0000-000000000008', 'x@team.local', 'staff') $$,
  '42501', null,
  'staff cannot invite'
);
update public.organizations set brand_color = '#000000' where id = '0000000a-0000-0000-0000-000000000008';
select is(
  (select brand_color from public.organizations where id = '0000000a-0000-0000-0000-000000000008'),
  '#808080',
  'staff cannot edit the brand'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('org-logos', '0000000a-0000-0000-0000-000000000008/staff.png') $$,
  '42501', null,
  'staff cannot upload the logo'
);

-- ---------------------------------------------------------------------------
-- Owner de B y developer
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000008b1","role":"authenticated"}', true);

select throws_ok(
  $$ select public.invite_member('0000000a-0000-0000-0000-000000000008', 'x@team.local', 'staff') $$,
  '42501', null,
  'the owner of another org cannot invite'
);
update public.organizations set brand_color = '#000000' where id = '0000000a-0000-0000-0000-000000000008';
select is(
  (select brand_color from public.organizations where id = '0000000a-0000-0000-0000-000000000008'),
  '#808080',
  'the owner of another org cannot edit the brand'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000008d1","role":"authenticated"}', true);

select lives_ok(
  $$ select public.invite_member('0000000a-0000-0000-0000-000000000008', 'soporte@team.local', 'staff') $$,
  'the developer can invite (support)'
);
update public.organizations set brand_color = '#000000' where id = '0000000a-0000-0000-0000-000000000008';
select is(
  (select brand_color from public.organizations where id = '0000000a-0000-0000-0000-000000000008'),
  '#808080',
  'support mode cannot edit the brand'
);

reset role;
set local role anon;

select throws_ok(
  $$ select public.invite_member('0000000a-0000-0000-0000-000000000008', 'x@team.local', 'staff') $$,
  '42501', null,
  'anon cannot invite'
);

reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000008a2","role":"authenticated"}', true);

select throws_ok(
  $$ select public.set_primary_domain('00000000-0000-0000-0000-000000000802') $$,
  '42501', null,
  'staff cannot change the primary domain'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000008a1","role":"authenticated"}', true);

select throws_ok(
  $$ select public.set_primary_domain('00000000-0000-0000-0000-000000000802') $$,
  '42501', null,
  'the owner cannot change the primary domain'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000008d1","role":"authenticated"}', true);

select lives_ok(
  $$ select public.set_primary_domain('00000000-0000-0000-0000-000000000802') $$,
  'the developer changes the primary domain'
);
select results_eq(
  $$ select hostname::text from public.organization_domains
     where organization_id = '0000000a-0000-0000-0000-000000000008' and is_primary $$,
  $$ values ('b.team-a.test') $$,
  'and the org keeps exactly one'
);

reset role;

-- ---------------------------------------------------------------------------
-- Bucket y cascadas
-- ---------------------------------------------------------------------------

select results_eq(
  $$ select public, file_size_limit::int, 'image/svg+xml' = any (allowed_mime_types)
     from storage.buckets where id = 'org-logos' $$,
  $$ values (true, 1048576, false) $$,
  'the logo bucket is public, capped and refuses SVG'
);
select lives_ok(
  $$ delete from auth.users where id = '00000000-0000-0000-0000-0000000008a2' $$,
  'deleting an account still works with the member audit'
);
select lives_ok(
  $$ delete from public.organizations where id = '0000000b-0000-0000-0000-000000000008' $$,
  'deleting an org still works with the team audit'
);

select * from finish();
rollback;
