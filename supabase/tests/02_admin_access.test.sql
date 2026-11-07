-- R2 · bloque 0: aceptar las invitaciones propias al entrar y modo soporte.
begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'dev@test.local'),
  ('00000000-0000-0000-0000-0000000000e1', 'Invitada@Test.Local'),
  ('00000000-0000-0000-0000-0000000000f2', 'sin-mail@test.local');
update auth.users set email = null where id = '00000000-0000-0000-0000-0000000000f2';

insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-0000000000d1');

insert into public.organizations (id, slug, name) values
  ('0000000a-0000-0000-0000-000000000000', 'org-a', 'Org A'),
  ('0000000b-0000-0000-0000-000000000000', 'org-b', 'Org B'),
  ('0000000c-0000-0000-0000-000000000000', 'org-c', 'Org C');

insert into public.organization_invitations (organization_id, email, role, expires_at) values
  ('0000000a-0000-0000-0000-000000000000', 'invitada@test.local', 'owner', now() + interval '1 day'),
  ('0000000b-0000-0000-0000-000000000000', 'invitada@test.local', 'staff', now() - interval '1 day'),
  ('0000000c-0000-0000-0000-000000000000', 'otra@test.local',     'owner', now() + interval '1 day');

set local role authenticated;

-- Cuenta sin mail: no acepta nada.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f2","role":"authenticated"}', true);
select is_empty($$ select public.accept_my_invitations() $$, 'an account without email accepts nothing');

-- La invitada: solo la propia y vigente, sin importar mayúsculas.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
select results_eq(
  $$ select public.accept_my_invitations() $$,
  $$ values ('0000000a-0000-0000-0000-000000000000'::uuid) $$,
  'accepts only open, unexpired invitations for the account email'
);
select is(
  app.org_role('0000000a-0000-0000-0000-000000000000'),
  'owner'::public.organization_role,
  'the membership gets the invited role'
);
select is(
  app.org_role('0000000b-0000-0000-0000-000000000000'),
  null,
  'an expired invitation is ignored'
);
select is_empty($$ select public.accept_my_invitations() $$, 'running it again accepts nothing new');

select throws_ok(
  $$ select public.log_support_access('0000000c-0000-0000-0000-000000000000') $$,
  '42501', null,
  'only the developer can enter support mode'
);

-- Developer: entra en modo soporte y queda registrado.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
select lives_ok(
  $$ select public.log_support_access('0000000c-0000-0000-0000-000000000000') $$,
  'the developer enters support mode'
);
select ok(
  exists (select 1 from public.audit_logs
          where action = 'support.viewed'
            and organization_id = '0000000c-0000-0000-0000-000000000000'
            and actor_id = '00000000-0000-0000-0000-0000000000d1'),
  'support mode leaves an audit row with the developer as actor'
);

select * from finish();
rollback;
