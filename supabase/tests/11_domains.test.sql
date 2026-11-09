-- Los dominios los configura solo el developer, y moverlos no deja orgs sin principal.
begin;
create extension if not exists pgtap with schema extensions;

select plan(15);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000bd1', 'dev@domains.local'),
  ('00000000-0000-0000-0000-000000000ba1', 'owner-a@domains.local');

insert into public.platform_admins (user_id) values
  ('00000000-0000-0000-0000-000000000bd1');

insert into public.organizations (id, slug, name) values
  ('0000000a-0000-0000-0000-00000000000b', 'domains-a', 'Org A'),
  ('0000000b-0000-0000-0000-00000000000b', 'domains-b', 'Org B'),
  ('0000000c-0000-0000-0000-00000000000b', 'domains-c', 'Org C');

insert into public.organization_members (organization_id, user_id, role) values
  ('0000000a-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000ba1', 'owner');

insert into public.organization_domains (organization_id, hostname, is_primary) values
  ('0000000a-0000-0000-0000-00000000000b', 'a-main.test', true),
  ('0000000b-0000-0000-0000-00000000000b', 'b-main.test', true),
  ('0000000b-0000-0000-0000-00000000000b', 'b-other.test', false),
  ('0000000c-0000-0000-0000-00000000000b', 'c-only.test', true);

-- ---------------------------------------------------------------------------
-- El owner solo lee
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000ba1","role":"authenticated"}', true);

select throws_ok(
  $$ insert into public.organization_domains (organization_id, hostname)
     values ('0000000a-0000-0000-0000-00000000000b', 'owner.test') $$,
  '42501', null,
  'the owner cannot add a domain'
);
select throws_ok(
  $$ select public.assign_domain('0000000a-0000-0000-0000-00000000000b', 'owner.test') $$,
  '42501', null,
  'the owner cannot assign a domain'
);
delete from public.organization_domains where hostname = 'a-main.test';
update public.organization_domains set hostname = 'robado.test' where hostname = 'a-main.test';

reset role;

select results_eq(
  $$ select count(*)::int from public.organization_domains where hostname = 'a-main.test' $$,
  $$ values (1) $$,
  'the owner cannot remove or rename a domain'
);

set local role anon;
select throws_ok(
  $$ select public.assign_domain('0000000a-0000-0000-0000-00000000000b', 'anon.test') $$,
  '42501', null,
  'anon cannot assign a domain'
);
reset role;

-- ---------------------------------------------------------------------------
-- El developer suma y mueve
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000bd1","role":"authenticated"}', true);

select is(
  public.assign_domain('0000000a-0000-0000-0000-00000000000b', ' A-Second.test '),
  null,
  'a free domain is added'
);
select is(
  (select is_primary from public.organization_domains where hostname = 'a-second.test'),
  false,
  'and it does not become primary unless asked'
);

select is(
  public.assign_domain('0000000a-0000-0000-0000-00000000000b', 'a-third.test', true),
  null,
  'a domain can be added as primary'
);
select results_eq(
  $$ select hostname::text from public.organization_domains
     where organization_id = '0000000a-0000-0000-0000-00000000000b' and is_primary $$,
  $$ values ('a-third.test') $$,
  'and the org keeps exactly one primary'
);

select is(
  public.assign_domain('0000000a-0000-0000-0000-00000000000b', 'b-main.test'),
  'Org B',
  'a taken domain names its org'
);
select results_eq(
  $$ select organization_id from public.organization_domains where hostname = 'b-main.test' $$,
  $$ values ('0000000b-0000-0000-0000-00000000000b'::uuid) $$,
  'and stays where it was until confirmed'
);

select is(
  public.assign_domain('0000000a-0000-0000-0000-00000000000b', 'b-main.test', false, true),
  null,
  'once confirmed, it moves'
);
select results_eq(
  $$ select d.hostname::text, d.is_primary, o.slug::text
     from public.organization_domains d
     join public.organizations o on o.id = d.organization_id
     where d.hostname in ('b-main.test', 'b-other.test')
     order by 1 $$,
  $$ values ('b-main.test', false, 'domains-a'), ('b-other.test', true, 'domains-b') $$,
  'and the org it left promotes another domain'
);

select throws_ok(
  $$ select public.assign_domain('0000000a-0000-0000-0000-00000000000b', 'c-only.test', false, true) $$,
  '23514', null,
  'the only domain of an org cannot be taken'
);
select throws_ok(
  $$ select public.assign_domain('0000000a-0000-0000-0000-00000000000b', 'a-second.test') $$,
  '23505', null,
  'a domain the org already has is refused'
);

reset role;

select results_eq(
  $$ select action, count(*)::int from public.audit_logs
     where organization_id = '0000000b-0000-0000-0000-00000000000b'
       and actor_id = '00000000-0000-0000-0000-000000000bd1'
     group by action order by action $$,
  $$ values ('domain.deleted', 1), ('domain.updated', 1) $$,
  'the org that lost the domain has the trail, with its actor'
);

select * from finish();
rollback;
