-- R1 · Organizaciones: aislamiento entre orgs, alta solo por el developer,
-- último owner, invitaciones y lectura pública.
begin;
create extension if not exists pgtap with schema extensions;

select plan(30);

-- ---------------------------------------------------------------------------
-- Datos: corre como postgres, antes de asumir ningún rol.
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', 'dev@test.local',      '{"full_name":"Dev"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'owner-a@test.local',  '{"full_name":"Owner A"}'),
  ('00000000-0000-0000-0000-0000000000a2', 'staff-a@test.local',  '{"full_name":"Staff A"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'owner-b@test.local',  '{"full_name":"Owner B"}'),
  ('00000000-0000-0000-0000-0000000000e1', 'invitee@test.local',  '{"full_name":"Invitada"}'),
  ('00000000-0000-0000-0000-0000000000f1', 'outsider@test.local', '{"full_name":"Ajena"}');

-- Una cuenta sin mail (sign-in anónimo o por teléfono).
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000f2', 'sin-mail@test.local');
update auth.users set email = null where id = '00000000-0000-0000-0000-0000000000f2';

insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-0000000000d1');

insert into public.organizations (id, slug, name, status) values
  ('0000000a-0000-0000-0000-000000000000', 'org-a', 'Org A', 'active'),
  ('0000000b-0000-0000-0000-000000000000', 'org-b', 'Org B', 'active'),
  ('0000000c-0000-0000-0000-000000000000', 'org-c', 'Org C', 'suspended');

insert into public.organization_domains (organization_id, hostname, is_primary) values
  ('0000000a-0000-0000-0000-000000000000', 'a.localhost:3000', true),
  ('0000000b-0000-0000-0000-000000000000', 'b.localhost:3000', true);

insert into public.organization_members (organization_id, user_id, role) values
  ('0000000a-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a1', 'owner'),
  ('0000000a-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a2', 'staff'),
  ('0000000b-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000b1', 'owner');

insert into public.organization_invitations (id, organization_id, email, role) values
  ('00000000-0000-0000-0000-00000000c0b1', '0000000b-0000-0000-0000-000000000000', 'invitee@test.local', 'staff');

insert into public.audit_logs (organization_id, action, entity_type) values
  ('0000000b-0000-0000-0000-000000000000', 'test.seeded', 'organization');

select ok(
  exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000a1' and full_name = 'Owner A'),
  'the signup trigger creates the profile'
);

-- ---------------------------------------------------------------------------
-- Owner de A: no ve nada privado de B
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select is_empty(
  $$ select 1 from public.organization_members where organization_id = '0000000b-0000-0000-0000-000000000000' $$,
  'owner A sees no members of B'
);
select is_empty(
  $$ select 1 from public.organization_invitations where organization_id = '0000000b-0000-0000-0000-000000000000' $$,
  'owner A sees no invitations of B'
);
select is_empty(
  $$ select 1 from public.audit_logs where organization_id = '0000000b-0000-0000-0000-000000000000' $$,
  'owner A sees no audit rows of B'
);
select is_empty(
  $$ select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000b1' $$,
  'owner A does not see the profile of B''s owner'
);
select is(
  (select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000000a2'),
  1,
  'owner A sees the profile of their own staff'
);
select is_empty(
  $$ select 1 from public.organizations where id = '0000000c-0000-0000-0000-000000000000' $$,
  'a suspended org is hidden from other orgs'
);

-- Alta de organizaciones: solo el developer.
select throws_ok(
  $$ select public.create_organization('org-x', 'Org X', 'x.localhost:3000', 'x@test.local') $$,
  '42501', null,
  'an owner cannot create organizations through the function'
);
select throws_ok(
  $$ insert into public.organizations (slug, name) values ('org-y', 'Org Y') $$,
  '42501', null,
  'nobody inserts organizations directly'
);

-- Edición de la propia org: solo las columnas permitidas.
select lives_ok(
  $$ update public.organizations set name = 'Org A renombrada', brand_color = '#d6336c'
     where id = '0000000a-0000-0000-0000-000000000000' $$,
  'the owner edits name and brand color'
);
select throws_ok(
  $$ update public.organizations set slug = 'otra' where id = '0000000a-0000-0000-0000-000000000000' $$,
  '42501', null,
  'the owner cannot change the slug'
);
update public.organizations set name = 'Hackeada' where id = '0000000b-0000-0000-0000-000000000000';

-- Último owner.
select throws_ok(
  $$ delete from public.organization_members
     where organization_id = '0000000a-0000-0000-0000-000000000000'
       and user_id = '00000000-0000-0000-0000-0000000000a1' $$,
  '23514', null,
  'the last owner cannot be removed'
);
select throws_ok(
  $$ update public.organization_members set role = 'staff'
     where organization_id = '0000000a-0000-0000-0000-000000000000'
       and user_id = '00000000-0000-0000-0000-0000000000a1' $$,
  '23514', null,
  'the last owner cannot be demoted'
);

-- ---------------------------------------------------------------------------
-- Staff de A: no administra miembros
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
delete from public.organization_members where organization_id = '0000000a-0000-0000-0000-000000000000';

-- ---------------------------------------------------------------------------
-- Invitaciones
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}', true);
select throws_ok(
  $$ select public.accept_invitation('00000000-0000-0000-0000-00000000c0b1') $$,
  'P0002', null,
  'an invitation cannot be accepted from another account'
);
select throws_ok(
  $$ insert into public.organization_members (organization_id, user_id, role)
     values ('0000000b-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000f1', 'owner') $$,
  '42501', null,
  'nobody adds themselves to an organization'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f2","role":"authenticated"}', true);
select throws_ok(
  $$ select public.accept_invitation('00000000-0000-0000-0000-00000000c0b1') $$,
  'P0002', null,
  'an account without email cannot accept an invitation'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
select is(
  public.accept_invitation('00000000-0000-0000-0000-00000000c0b1'),
  '0000000b-0000-0000-0000-000000000000'::uuid,
  'the invitee accepts their invitation'
);
select is(
  app.org_role('0000000b-0000-0000-0000-000000000000'),
  'staff'::public.organization_role,
  'accepting creates the membership with the invited role'
);
select throws_ok(
  $$ select public.accept_invitation('00000000-0000-0000-0000-00000000c0b1') $$,
  'P0002', null,
  'an invitation cannot be used twice'
);

-- ---------------------------------------------------------------------------
-- Developer
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
select isnt(
  public.create_organization('org-nueva', 'Org Nueva', 'nueva.localhost:3000', 'Owner@Nueva.test'),
  null,
  'the developer creates an organization'
);
select results_eq(
  $$ select d.hostname::text, i.email::text, i.role::text
     from public.organizations o
     join public.organization_domains d on d.organization_id = o.id and d.is_primary
     join public.organization_invitations i on i.organization_id = o.id
     where o.slug = 'org-nueva' $$,
  $$ values ('nueva.localhost:3000', 'owner@nueva.test', 'owner') $$,
  'creating an org also creates its primary domain and the owner invitation'
);
select ok(
  exists (select 1 from public.audit_logs
          where action = 'organization.created'
            and organization_id = (select id from public.organizations where slug = 'org-nueva')),
  'creating an org leaves an audit row'
);
select is(
  (select diff ->> 'owner_email' from public.audit_logs
   where action = 'organization.created'
     and organization_id = (select id from public.organizations where slug = 'org-nueva')),
  'owner@nueva.test',
  'the audit row stores the normalized values'
);

-- ---------------------------------------------------------------------------
-- Anónimo (la app pública)
-- ---------------------------------------------------------------------------

reset role;
set local role anon;
select results_eq(
  $$ select slug::text from public.organizations where slug like 'org-%' order by slug $$,
  $$ values ('org-a'), ('org-b'), ('org-nueva') $$,
  'anon sees active organizations only'
);
select throws_ok(
  $$ select 1 from public.organization_members $$,
  '42501', null,
  'anon has no access to members at all'
);
select throws_ok(
  $$ select 1 from public.profiles $$,
  '42501', null,
  'anon has no access to profiles at all'
);

-- ---------------------------------------------------------------------------
-- Lo que no tenía que pasar, verificado como postgres
-- ---------------------------------------------------------------------------

reset role;
select is(
  (select name from public.organizations where id = '0000000b-0000-0000-0000-000000000000'),
  'Org B',
  'owner A could not rename org B'
);
select is(
  (select count(*)::int from public.organization_members where organization_id = '0000000a-0000-0000-0000-000000000000'),
  2,
  'staff A could not remove members'
);

-- Borrar la cuenta de quien es el único owner: se permite y queda registrado.
select lives_ok(
  $$ delete from auth.users where id = '00000000-0000-0000-0000-0000000000b1' $$,
  'the account of a sole owner can be deleted'
);
select ok(
  exists (select 1 from public.audit_logs
          where action = 'member.account_deleted'
            and organization_id = '0000000b-0000-0000-0000-000000000000'),
  'deleting a sole owner leaves an audit row for the developer'
);

select * from finish();
rollback;
