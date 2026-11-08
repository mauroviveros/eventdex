-- R4 · bloque 1: resolución por host, evento activo y lecturas públicas.
begin;
create extension if not exists pgtap with schema extensions;

select plan(15);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000007a1', 'visitante@public.local');

insert into public.organizations (id, slug, name, status) values
  ('00000000-0000-0000-0000-000000000701', 'pub-vivo',      'Con evento en curso', 'active'),
  ('00000000-0000-0000-0000-000000000702', 'pub-vacio',     'Sin eventos',         'active'),
  ('00000000-0000-0000-0000-000000000703', 'pub-proximos',  'Solo próximos',       'active'),
  ('00000000-0000-0000-0000-000000000704', 'pub-pasados',   'Solo terminados',     'active'),
  ('00000000-0000-0000-0000-000000000705', 'pub-suspendida','Suspendida',          'suspended');

insert into public.organization_domains (organization_id, hostname, is_primary) values
  ('00000000-0000-0000-0000-000000000701', 'vivo.test',        true),
  ('00000000-0000-0000-0000-000000000701', 'www.vivo.test',    false),
  ('00000000-0000-0000-0000-000000000702', 'vacio.test',       true),
  ('00000000-0000-0000-0000-000000000703', 'proximos.test',    true),
  ('00000000-0000-0000-0000-000000000704', 'pasados.test',     true),
  ('00000000-0000-0000-0000-000000000705', 'suspendida.test',  true);

-- Org con evento en curso: en curso, próximo, y un borrador en curso que no cuenta.
insert into public.events (id, organization_id, slug, title, status, visibility, published_at) values
  ('00000000-0000-0000-0000-000000000711', '00000000-0000-0000-0000-000000000701', 'en-curso',  'En curso',  'published', 'public',   now()),
  ('00000000-0000-0000-0000-000000000712', '00000000-0000-0000-0000-000000000701', 'proximo',   'Próximo',   'published', 'public',   now()),
  ('00000000-0000-0000-0000-000000000713', '00000000-0000-0000-0000-000000000701', 'borrador',  'Borrador',  'draft',     'public',   null),
  -- Solo próximos: el que empieza antes gana; uno unlisted más cercano no cuenta.
  ('00000000-0000-0000-0000-000000000721', '00000000-0000-0000-0000-000000000703', 'lejano',    'Lejano',    'published', 'public',   now()),
  ('00000000-0000-0000-0000-000000000722', '00000000-0000-0000-0000-000000000703', 'cercano',   'Cercano',   'published', 'public',   now()),
  ('00000000-0000-0000-0000-000000000723', '00000000-0000-0000-0000-000000000703', 'oculto',    'Oculto',    'published', 'unlisted', now()),
  -- Solo terminados: el más reciente.
  ('00000000-0000-0000-0000-000000000731', '00000000-0000-0000-0000-000000000704', 'viejo',     'Viejo',     'published', 'public',   now()),
  ('00000000-0000-0000-0000-000000000732', '00000000-0000-0000-0000-000000000704', 'reciente',  'Reciente',  'published', 'public',   now());

insert into public.event_schedules (event_id, organization_id, starts_at, ends_at) values
  ('00000000-0000-0000-0000-000000000711', '00000000-0000-0000-0000-000000000701', now() - interval '2 hours', now() + interval '6 hours'),
  ('00000000-0000-0000-0000-000000000712', '00000000-0000-0000-0000-000000000701', now() + interval '3 days',  now() + interval '3 days 8 hours'),
  ('00000000-0000-0000-0000-000000000713', '00000000-0000-0000-0000-000000000701', now() - interval '3 hours', now() + interval '3 hours'),
  ('00000000-0000-0000-0000-000000000721', '00000000-0000-0000-0000-000000000703', now() + interval '20 days', now() + interval '20 days 8 hours'),
  ('00000000-0000-0000-0000-000000000722', '00000000-0000-0000-0000-000000000703', now() + interval '5 days',  now() + interval '5 days 8 hours'),
  ('00000000-0000-0000-0000-000000000723', '00000000-0000-0000-0000-000000000703', now() + interval '1 day',   now() + interval '1 day 8 hours'),
  ('00000000-0000-0000-0000-000000000731', '00000000-0000-0000-0000-000000000704', now() - interval '60 days', now() - interval '59 days'),
  ('00000000-0000-0000-0000-000000000732', '00000000-0000-0000-0000-000000000704', now() - interval '10 days', now() - interval '9 days');

insert into public.spots (id, organization_id, name) values
  ('00000000-0000-0000-0000-000000000741', '00000000-0000-0000-0000-000000000701', 'Café');

insert into public.event_spots (event_id, organization_id, spot_id, code) values
  ('00000000-0000-0000-0000-000000000711', '00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000741', 'A01'),
  ('00000000-0000-0000-0000-000000000713', '00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000741', 'B01');

set local role anon;

-- ---------------------------------------------------------------------------
-- Host → organización
-- ---------------------------------------------------------------------------

select is_empty(
  $$ select * from public.resolve_organization('desconocido.test') $$,
  'an unknown host resolves to nothing'
);

select results_eq(
  $$ select slug::text from public.resolve_organization('  VIVO.test ') $$,
  $$ values ('pub-vivo') $$,
  'a known host resolves to its org, ignoring case and spaces'
);

select results_eq(
  $$ select slug::text from public.resolve_organization('www.vivo.test') $$,
  $$ values ('pub-vivo') $$,
  'every hostname of an org resolves, not only the primary'
);

select is_empty(
  $$ select * from public.resolve_organization('suspendida.test') $$,
  'a suspended org does not resolve'
);

-- ---------------------------------------------------------------------------
-- Evento activo
-- ---------------------------------------------------------------------------

select is(
  public.resolve_active_event('00000000-0000-0000-0000-000000000702'),
  null,
  'an org without events has no active event'
);

select is(
  public.resolve_active_event('00000000-0000-0000-0000-000000000701'),
  '00000000-0000-0000-0000-000000000711'::uuid,
  'the live event wins over the upcoming one (and drafts never count)'
);

select is(
  public.resolve_active_event('00000000-0000-0000-0000-000000000703'),
  '00000000-0000-0000-0000-000000000722'::uuid,
  'without a live event, the soonest upcoming public one'
);

select is(
  public.resolve_active_event('00000000-0000-0000-0000-000000000704'),
  '00000000-0000-0000-0000-000000000732'::uuid,
  'with only finished events, the most recent one'
);

select results_eq(
  $$ select slug::text from public.active_event('00000000-0000-0000-0000-000000000701') $$,
  $$ values ('en-curso') $$,
  'active_event returns the same event as a row, ready to embed'
);

select is_empty(
  $$ select * from public.active_event('00000000-0000-0000-0000-000000000702') $$,
  'active_event returns nothing for an org without events'
);

-- ---------------------------------------------------------------------------
-- Lecturas públicas
-- ---------------------------------------------------------------------------

select results_eq(
  $$ select code from public.event_spots where organization_id = '00000000-0000-0000-0000-000000000701' $$,
  $$ values ('A01') $$,
  'anon reads the spots of published events, not of drafts'
);

select is(
  (select snapshot ->> 'name' from public.event_spots where code = 'A01' and organization_id = '00000000-0000-0000-0000-000000000701'),
  'Café',
  'a public spot carries its frozen name, so the catalog is not needed'
);

select throws_ok(
  $$ select 1 from public.spots $$,
  '42501', null,
  'the spot catalog stays private'
);

reset role;

-- Un visitante con sesión (miembro de nada) lee lo mismo que anon.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000007a1","role":"authenticated"}', true);

select results_eq(
  $$ select code from public.event_spots where organization_id = '00000000-0000-0000-0000-000000000701' $$,
  $$ values ('A01') $$,
  'a signed-in visitor reads published event spots too'
);

select is(
  public.resolve_active_event('00000000-0000-0000-0000-000000000701'),
  '00000000-0000-0000-0000-000000000711'::uuid,
  'and resolves the same active event'
);

reset role;

select * from finish();
rollback;
