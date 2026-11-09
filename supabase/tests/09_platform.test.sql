-- R8 · bloque 1: solo el developer ve y escribe facturación, y cada paso deja rastro.
begin;
create extension if not exists pgtap with schema extensions;

select plan(29);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000ad1', 'dev@platform.local'),
  ('00000000-0000-0000-0000-000000000aa1', 'owner-a@platform.local'),
  ('00000000-0000-0000-0000-000000000aa2', 'staff-a@platform.local'),
  ('00000000-0000-0000-0000-000000000ab1', 'owner-b@platform.local');

insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-000000000ad1');

insert into public.organizations (id, slug, name) values
  ('0000000a-0000-0000-0000-00000000000a', 'plat-a', 'Plataforma A'),
  ('0000000b-0000-0000-0000-00000000000a', 'plat-b', 'Plataforma B');

insert into public.organization_members (organization_id, user_id, role) values
  ('0000000a-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000aa1', 'owner'),
  ('0000000a-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000aa2', 'staff'),
  ('0000000b-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000ab1', 'owner');

insert into public.audit_logs (organization_id, action, entity_type) values
  ('0000000a-0000-0000-0000-00000000000a', 'test.a', 'test'),
  ('0000000b-0000-0000-0000-00000000000a', 'test.b', 'test');

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

-- ---------------------------------------------------------------------------
-- Developer: alta y ciclo de vida
-- ---------------------------------------------------------------------------

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-000000000ad1');

select lives_ok(
  $$ insert into public.invoices (organization_id, concept, amount_cents, currency) values
       ('0000000a-0000-0000-0000-00000000000a', 'Prueba pgTAP expo', 150000, 'ARS'),
       ('0000000a-0000-0000-0000-00000000000a', 'Prueba pgTAP abono', 9900, 'USD') $$,
  'the developer registers invoices'
);

select is(
  (select status::text from public.invoices where concept = 'Prueba pgTAP expo'),
  'pending',
  'a new invoice starts pending'
);

select throws_ok(
  $$ insert into public.invoices (organization_id, concept, amount_cents, currency, status)
     values ('0000000a-0000-0000-0000-00000000000a', 'Ya paga', 100, 'ARS', 'paid') $$,
  '42501', null,
  'an invoice cannot be born paid'
);

select throws_ok(
  $$ insert into public.invoices (organization_id, concept, amount_cents, currency)
     values ('0000000a-0000-0000-0000-00000000000a', 'Gratis', 0, 'ARS') $$,
  '23514', null,
  'the amount must be positive'
);

select throws_ok(
  $$ insert into public.invoices (organization_id, concept, amount_cents, currency)
     values ('0000000a-0000-0000-0000-00000000000a', '   ', 100, 'ARS') $$,
  '23514', null,
  'the concept cannot be blank'
);

select throws_ok(
  $$ insert into public.invoices (organization_id, concept, amount_cents, currency)
     values ('0000000a-0000-0000-0000-00000000000a', 'Euros', 100, 'EUR') $$,
  '22P02', null,
  'only ARS and USD exist'
);

update public.invoices set status = 'paid' where concept = 'Prueba pgTAP expo';

select isnt(
  (select paid_at from public.invoices where concept = 'Prueba pgTAP expo'),
  null,
  'marking it paid stamps the date'
);

-- Doble clic: no cambia nada ni deja otro paso.
update public.invoices set status = 'paid' where concept = 'Prueba pgTAP expo';

select throws_ok(
  $$ update public.invoices set status = 'pending' where concept = 'Prueba pgTAP expo' $$,
  '23514', null,
  'a paid invoice does not go back to pending'
);

select throws_ok(
  $$ update public.invoices set amount_cents = 1 where concept = 'Prueba pgTAP expo' $$,
  '42501', null,
  'an invoice amount cannot be edited'
);

select throws_ok(
  $$ delete from public.invoices where concept = 'Prueba pgTAP expo' $$,
  '42501', null,
  'an invoice cannot be deleted'
);

update public.invoices set status = 'void' where concept = 'Prueba pgTAP expo';

select isnt(
  (select paid_at from public.invoices where concept = 'Prueba pgTAP expo'),
  null,
  'voiding a paid invoice keeps when it was paid'
);

select throws_ok(
  $$ update public.invoices set status = 'paid' where concept = 'Prueba pgTAP expo' $$,
  '23514', null,
  'a voided invoice stays voided'
);

-- ---------------------------------------------------------------------------
-- Nadie más
-- ---------------------------------------------------------------------------

select pg_temp.login('00000000-0000-0000-0000-000000000aa1');

select is_empty($$ select * from public.invoices $$, 'an owner does not see the invoices of their org');

select throws_ok(
  $$ insert into public.invoices (organization_id, concept, amount_cents, currency)
     values ('0000000a-0000-0000-0000-00000000000a', 'Propia', 100, 'ARS') $$,
  '42501', null,
  'an owner cannot create an invoice'
);

update public.invoices set status = 'paid' where concept = 'Prueba pgTAP abono';

select pg_temp.login('00000000-0000-0000-0000-000000000aa2');
select is_empty($$ select * from public.invoices $$, 'staff does not see invoices');

reset role;

select is(
  (select status::text from public.invoices where concept = 'Prueba pgTAP abono'),
  'pending',
  'an owner cannot mark an invoice paid'
);

set local role anon;
select throws_ok($$ select 1 from public.invoices $$, '42501', null, 'anon has no access to invoices');
select throws_ok(
  $$ select public.set_organization_status('0000000a-0000-0000-0000-00000000000a', 'suspended') $$,
  '42501', null,
  'anon cannot suspend an org'
);
reset role;

-- ---------------------------------------------------------------------------
-- Suspender
-- ---------------------------------------------------------------------------

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-000000000aa1');

select throws_ok(
  $$ select public.set_organization_status('0000000a-0000-0000-0000-00000000000a', 'suspended') $$,
  '42501', null,
  'an owner cannot suspend their own org'
);

select throws_ok(
  $$ update public.organizations set status = 'suspended' where id = '0000000a-0000-0000-0000-00000000000a' $$,
  '42501', null,
  'and cannot change the status directly either'
);

select pg_temp.login('00000000-0000-0000-0000-000000000ad1');

select public.set_organization_status('0000000a-0000-0000-0000-00000000000a', 'suspended');
select public.set_organization_status('0000000a-0000-0000-0000-00000000000a', 'suspended');

select is(
  (select status::text from public.organizations where id = '0000000a-0000-0000-0000-00000000000a'),
  'suspended',
  'the developer suspends an org'
);

select public.set_organization_status('0000000a-0000-0000-0000-00000000000a', 'active');

select throws_ok(
  $$ select public.set_organization_status('00000000-0000-0000-0000-00000000dead', 'suspended') $$,
  'P0002', null,
  'an unknown org is an error'
);

-- ---------------------------------------------------------------------------
-- Rastro y lectura de auditoría
-- ---------------------------------------------------------------------------

select results_eq(
  $$ select action, count(*)::int from public.audit_logs
     where organization_id = '0000000a-0000-0000-0000-00000000000a'
       and (action like 'invoice.%' or action like 'organization.%')
     group by action order by action $$,
  $$ values ('invoice.created', 2), ('invoice.paid', 1), ('invoice.voided', 1),
            ('organization.reactivated', 1), ('organization.suspended', 1) $$,
  'every step leaves exactly one audit row (repeating one does not count)'
);

select is(
  (select p.email::text from public.audit_logs l join public.profiles p on p.id = l.actor_id
   where l.action = 'invoice.paid' and l.organization_id = '0000000a-0000-0000-0000-00000000000a'),
  'dev@platform.local',
  'the log says who did it, and the developer can read that account'
);

select results_eq(
  $$ select action from public.audit_logs where action like 'test.%' order by action $$,
  $$ values ('test.a'), ('test.b') $$,
  'the developer reads the log of every org'
);

select pg_temp.login('00000000-0000-0000-0000-000000000aa1');

select results_eq(
  $$ select action from public.audit_logs where action like 'test.%' $$,
  $$ values ('test.a') $$,
  'an owner reads only the log of their org'
);

select throws_ok(
  $$ insert into public.audit_logs (organization_id, action, entity_type)
     values ('0000000a-0000-0000-0000-00000000000a', 'test.fake', 'test') $$,
  '42501', null,
  'nobody writes the log directly'
);

select pg_temp.login('00000000-0000-0000-0000-000000000aa2');

select is_empty(
  $$ select * from public.audit_logs where action like 'test.%' $$,
  'staff does not read the log'
);

reset role;

select has_index('public', 'audit_logs', 'audit_logs_time_idx', 'the whole log can be listed by date');

select * from finish();
rollback;
