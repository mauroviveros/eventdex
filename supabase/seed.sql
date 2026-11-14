-- Local data only (pnpm db:reset). Gives the whole circuit something to show:
-- panel on localhost:3000/panel, public site on expo.localhost:3000.
-- Sign in by mail (magic link) and read it in Mailpit: http://127.0.0.1:54424
--   dev@eventdex.test      developer of the platform (sees every org)
--   owner@eventdex.test    owner of "Expo Local", "Cámara Demo" and "Feria del Sorteo"
--   member@eventdex.test   staff of "Expo Local"
--   visitor@eventdex.test  visitor with medals
--   visitante01..14@eventdex.test  visitors of "Feria del Sorteo" (see the end)

-- Users. The profiles come from the on_auth_user_created trigger.
insert into auth.users (
  instance_id, id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
  u.email, now(), '{"provider":"email","providers":["email"]}',
  jsonb_build_object('full_name', u.name), now(), now(), '', '', '', ''
from (values
  ('00000000-0000-4000-8000-000000000001'::uuid, 'dev@eventdex.test',     'Dev Eventdex'),
  ('00000000-0000-4000-8000-000000000002'::uuid, 'owner@eventdex.test',   'Olivia Dueña'),
  ('00000000-0000-4000-8000-000000000003'::uuid, 'member@eventdex.test',  'Martín Miembro'),
  ('00000000-0000-4000-8000-000000000004'::uuid, 'visitor@eventdex.test', 'Valeria Visitante')
) as u (id, email, name);

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
)
select gen_random_uuid(), id, id::text, 'email',
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  now(), now(), now()
from auth.users;

insert into public.platform_admins (user_id)
values ('00000000-0000-4000-8000-000000000001');

-- Organizations, hosts and team.
insert into public.organizations (id, slug, name, brand_color) values
  ('00000000-0000-4000-8001-000000000001', 'expo-local', 'Expo Local', '#0d9488'),
  ('00000000-0000-4000-8001-000000000002', 'camara-demo', 'Cámara Demo', '#7c3aed');

insert into public.organization_domains (organization_id, hostname, is_primary) values
  ('00000000-0000-4000-8001-000000000001', 'expo.localhost:3000', true),
  ('00000000-0000-4000-8001-000000000002', 'camara.localhost:3000', true);

insert into public.organization_members (organization_id, user_id, role) values
  ('00000000-0000-4000-8001-000000000001', '00000000-0000-4000-8000-000000000002', 'owner'),
  ('00000000-0000-4000-8001-000000000001', '00000000-0000-4000-8000-000000000003', 'staff'),
  ('00000000-0000-4000-8001-000000000002', '00000000-0000-4000-8000-000000000002', 'owner');

insert into public.venues (id, organization_id, name, address_line, city, state)
values ('00000000-0000-4000-8002-000000000001', '00000000-0000-4000-8001-000000000001',
  'Predio Ferial', 'Av. Siempreviva 742', 'Rosario', 'Santa Fe');

-- Catalog of spots.
insert into public.spots (id, organization_id, name, description, type) values
  ('00000000-0000-4000-8003-000000000001', '00000000-0000-4000-8001-000000000001', 'Café de la Esquina', 'Café de especialidad y medialunas.', 'stand'),
  ('00000000-0000-4000-8003-000000000002', '00000000-0000-4000-8001-000000000001', 'Rueda gigante', 'Vista a todo el predio.', 'attraction'),
  ('00000000-0000-4000-8003-000000000003', '00000000-0000-4000-8001-000000000001', 'Taller de cerámica', 'Modelá tu propia taza.', 'stand'),
  ('00000000-0000-4000-8003-000000000004', '00000000-0000-4000-8001-000000000001', 'Librería Ocaso', 'Libros usados y ediciones raras.', 'stand');

-- Events: one live, one finished, one draft. Inserted as drafts and published
-- below, because publishing needs a signed-in member (publish_event).
insert into public.events (id, organization_id, venue_id, slug, title, edition_label, summary) values
  ('00000000-0000-4000-8004-000000000001', '00000000-0000-4000-8001-000000000001', '00000000-0000-4000-8002-000000000001', 'expo-primavera', 'Expo Primavera', 'Edición actual', 'Tres días de stands, talleres y sorteos.'),
  ('00000000-0000-4000-8004-000000000002', '00000000-0000-4000-8001-000000000001', '00000000-0000-4000-8002-000000000001', 'expo-otono', 'Expo Primavera', 'Otoño', 'La edición pasada.'),
  ('00000000-0000-4000-8004-000000000003', '00000000-0000-4000-8001-000000000001', null, 'expo-invierno', 'Expo Invierno', 'Borrador', null);

insert into public.event_schedules (event_id, organization_id, label, starts_at, ends_at) values
  ('00000000-0000-4000-8004-000000000001', '00000000-0000-4000-8001-000000000001', 'Jornada única', now() - interval '2 hours', now() + interval '8 hours'),
  ('00000000-0000-4000-8004-000000000002', '00000000-0000-4000-8001-000000000001', 'Jornada única', now() - interval '60 days', now() - interval '60 days' + interval '8 hours');

insert into public.event_spots (id, event_id, organization_id, spot_id, code, booth, sort_order) values
  ('00000000-0000-4000-8005-000000000001', '00000000-0000-4000-8004-000000000001', '00000000-0000-4000-8001-000000000001', '00000000-0000-4000-8003-000000000001', 'A01', 'Pabellón 1', 0),
  ('00000000-0000-4000-8005-000000000002', '00000000-0000-4000-8004-000000000001', '00000000-0000-4000-8001-000000000001', '00000000-0000-4000-8003-000000000002', 'A02', 'Plaza central', 1),
  ('00000000-0000-4000-8005-000000000003', '00000000-0000-4000-8004-000000000001', '00000000-0000-4000-8001-000000000001', '00000000-0000-4000-8003-000000000003', 'A03', 'Pabellón 2', 2),
  ('00000000-0000-4000-8005-000000000004', '00000000-0000-4000-8004-000000000002', '00000000-0000-4000-8001-000000000001', '00000000-0000-4000-8003-000000000001', 'B01', null, 0),
  ('00000000-0000-4000-8005-000000000005', '00000000-0000-4000-8004-000000000002', '00000000-0000-4000-8001-000000000001', '00000000-0000-4000-8003-000000000004', 'B02', null, 1),
  ('00000000-0000-4000-8005-000000000006', '00000000-0000-4000-8004-000000000003', '00000000-0000-4000-8001-000000000001', '00000000-0000-4000-8003-000000000004', 'C01', null, 0);

-- Publish the live and the finished one, freezing the spot snapshots as
-- publish_event does.
update public.event_spots es
set snapshot = app.spot_snapshot(s)
from public.spots s
where s.id = es.spot_id
  and es.event_id in ('00000000-0000-4000-8004-000000000001', '00000000-0000-4000-8004-000000000002');

update public.events
set status = 'published', published_at = now() - interval '3 days'
where id in ('00000000-0000-4000-8004-000000000001', '00000000-0000-4000-8004-000000000002');

-- The visitor: two of three medals in the live event, one in the finished one.
insert into public.event_registrations (id, event_id, organization_id, user_id) values
  ('00000000-0000-4000-8006-000000000001', '00000000-0000-4000-8004-000000000001', '00000000-0000-4000-8001-000000000001', '00000000-0000-4000-8000-000000000004'),
  ('00000000-0000-4000-8006-000000000002', '00000000-0000-4000-8004-000000000002', '00000000-0000-4000-8001-000000000001', '00000000-0000-4000-8000-000000000004');

insert into public.spot_claims (event_spot_id, registration_id, event_id, organization_id, user_id) values
  ('00000000-0000-4000-8005-000000000001', '00000000-0000-4000-8006-000000000001', '00000000-0000-4000-8004-000000000001', '00000000-0000-4000-8001-000000000001', '00000000-0000-4000-8000-000000000004'),
  ('00000000-0000-4000-8005-000000000002', '00000000-0000-4000-8006-000000000001', '00000000-0000-4000-8004-000000000001', '00000000-0000-4000-8001-000000000001', '00000000-0000-4000-8000-000000000004'),
  ('00000000-0000-4000-8005-000000000004', '00000000-0000-4000-8006-000000000002', '00000000-0000-4000-8004-000000000002', '00000000-0000-4000-8001-000000000001', '00000000-0000-4000-8000-000000000004');

insert into public.raffles (event_id, organization_id, title, description, min_claims) values
  ('00000000-0000-4000-8004-000000000001', '00000000-0000-4000-8001-000000000001', 'Pase doble para la próxima edición', 'Dos entradas para vos y quien quieras, los tres días.', 2),
  ('00000000-0000-4000-8004-000000000001', '00000000-0000-4000-8001-000000000001', 'Kit de coleccionista', 'Mochila, cuaderno y una lámina firmada por los artistas del evento.', 3);

-- ---------------------------------------------------------------------------
-- "Feria del Sorteo": a second org of the same owner, with a live event, 14
-- visitors and their medals, ready to try the raffle on stage. Two visitors
-- share a public name ("Lucía F."); twelve reach the raffle's 2 medals.
--   visitante01..14@eventdex.test (same magic-link sign-in as the others)
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000',
  format('00000000-0000-4000-8000-0000000001%s', lpad(n::text, 2, '0'))::uuid,
  'authenticated', 'authenticated',
  format('visitante%s@eventdex.test', lpad(n::text, 2, '0')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('full_name', name), now(), now(), '', '', '', ''
from unnest(array[
  'Ana García', 'Bruno Sosa', 'Camila Ríos', 'Diego Paz', 'Elena Vega',
  'Facundo Luna', 'Gabriela Mora', 'Hugo Benítez', 'Inés Aguirre',
  'Joaquín Salas', 'Lucía Fernández', 'Lucía Figueroa', 'Mateo Ibarra',
  'Noelia Castro'
]) with ordinality as v (name, n);

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
)
select gen_random_uuid(), id, id::text, 'email',
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  now(), now(), now()
from auth.users
where email like 'visitante%@eventdex.test';

insert into public.organizations (id, slug, name, brand_color)
values ('00000000-0000-4000-8001-000000000003', 'feria-del-sorteo', 'Feria del Sorteo', '#e11d48');

insert into public.organization_domains (organization_id, hostname, is_primary)
values ('00000000-0000-4000-8001-000000000003', 'sorteo.localhost:3000', true);

insert into public.organization_members (organization_id, user_id, role)
values ('00000000-0000-4000-8001-000000000003', '00000000-0000-4000-8000-000000000002', 'owner');

insert into public.venues (id, organization_id, name, address_line, city, state)
values ('00000000-0000-4000-8002-000000000002', '00000000-0000-4000-8001-000000000003',
  'Costanera Norte', 'Bv. Oroño 1500', 'Rosario', 'Santa Fe');

insert into public.spots (id, organization_id, name, description, type) values
  ('00000000-0000-4000-8003-000000000011', '00000000-0000-4000-8001-000000000003', 'Heladería Polar', 'Helados artesanales.', 'stand'),
  ('00000000-0000-4000-8003-000000000012', '00000000-0000-4000-8001-000000000003', 'Escenario principal', 'Música en vivo.', 'attraction'),
  ('00000000-0000-4000-8003-000000000013', '00000000-0000-4000-8001-000000000003', 'Feria de plantas', 'Suculentas y macetas.', 'stand'),
  ('00000000-0000-4000-8003-000000000014', '00000000-0000-4000-8001-000000000003', 'Cervecería del Río', 'Cerveza de la región.', 'stand'),
  ('00000000-0000-4000-8003-000000000015', '00000000-0000-4000-8001-000000000003', 'Rincón de juegos', 'Juegos de mesa para todos.', 'attraction');

insert into public.events (id, organization_id, venue_id, slug, title, edition_label, summary)
values ('00000000-0000-4000-8004-000000000011', '00000000-0000-4000-8001-000000000003',
  '00000000-0000-4000-8002-000000000002', 'feria-primavera', 'Feria de Primavera', 'Edición actual',
  'Un día de stands, música y sorteos.');

insert into public.event_schedules (event_id, organization_id, label, starts_at, ends_at)
values ('00000000-0000-4000-8004-000000000011', '00000000-0000-4000-8001-000000000003',
  'Jornada única', now() - interval '2 hours', now() + interval '8 hours');

insert into public.event_spots (id, event_id, organization_id, spot_id, code, booth, sort_order)
select format('00000000-0000-4000-8005-0000000000%s', 10 + i)::uuid,
  '00000000-0000-4000-8004-000000000011', '00000000-0000-4000-8001-000000000003',
  format('00000000-0000-4000-8003-0000000000%s', 10 + i)::uuid,
  'F0' || i, null, i - 1
from generate_series(1, 5) as i;

update public.event_spots es
set snapshot = app.spot_snapshot(s)
from public.spots s
where s.id = es.spot_id and es.event_id = '00000000-0000-4000-8004-000000000011';

update public.events
set status = 'published', published_at = now() - interval '1 day'
where id = '00000000-0000-4000-8004-000000000011';

-- Everyone registered; visitor n takes (n mod 5) + 1 medals, in spot order
-- (1 to 5), so visitors 5 and 10 stay short of the raffle's 2.
insert into public.event_registrations (id, event_id, organization_id, user_id)
select format('00000000-0000-4000-8006-0000000001%s', lpad(n::text, 2, '0'))::uuid,
  '00000000-0000-4000-8004-000000000011', '00000000-0000-4000-8001-000000000003',
  format('00000000-0000-4000-8000-0000000001%s', lpad(n::text, 2, '0'))::uuid
from generate_series(1, 14) as n;

insert into public.spot_claims (event_spot_id, registration_id, event_id, organization_id, user_id)
select format('00000000-0000-4000-8005-0000000000%s', 10 + k)::uuid,
  format('00000000-0000-4000-8006-0000000001%s', lpad(n::text, 2, '0'))::uuid,
  '00000000-0000-4000-8004-000000000011', '00000000-0000-4000-8001-000000000003',
  format('00000000-0000-4000-8000-0000000001%s', lpad(n::text, 2, '0'))::uuid
from generate_series(1, 14) as n, generate_series(1, 5) as k
where k <= (n % 5) + 1;

insert into public.raffles (event_id, organization_id, title, min_claims)
values ('00000000-0000-4000-8004-000000000011', '00000000-0000-4000-8001-000000000003',
  'Entradas para el recital', 2);
