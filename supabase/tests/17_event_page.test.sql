-- R21 · bloque 1: links, preguntas y fotos del evento. Los lee cualquiera si el
-- evento está publicado; los escribe solo la org dueña.
begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000fa1', 'staff-a@page.local'),
  ('00000000-0000-0000-0000-000000000fb1', 'staff-b@page.local');

insert into public.organizations (id, slug, name) values
  ('0000000a-0000-0000-0000-00000000000f', 'page-a', 'Page A'),
  ('0000000b-0000-0000-0000-00000000000f', 'page-b', 'Page B');

insert into public.organization_members (organization_id, user_id, role) values
  ('0000000a-0000-0000-0000-00000000000f', '00000000-0000-0000-0000-000000000fa1', 'staff'),
  ('0000000b-0000-0000-0000-00000000000f', '00000000-0000-0000-0000-000000000fb1', 'staff');

insert into public.events (id, organization_id, slug, title, status, published_at) values
  ('00000000-0000-0000-0000-0000000000a1', '0000000a-0000-0000-0000-00000000000f', 'publicado', 'Publicado', 'published', now()),
  ('00000000-0000-0000-0000-0000000000a2', '0000000a-0000-0000-0000-00000000000f', 'borrador',  'Borrador',  'draft',     null);

insert into public.event_faqs (id, event_id, organization_id, question, answer) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', '0000000a-0000-0000-0000-00000000000f', '¿Hay estacionamiento?', 'Sí, gratis.'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a2', '0000000a-0000-0000-0000-00000000000f', '¿Y el borrador?', 'No se ve.');

insert into public.event_photos (event_id, organization_id, path) values
  ('00000000-0000-0000-0000-0000000000a1', '0000000a-0000-0000-0000-00000000000f', '0000000a-0000-0000-0000-00000000000f/1.jpg'),
  ('00000000-0000-0000-0000-0000000000a2', '0000000a-0000-0000-0000-00000000000f', '0000000a-0000-0000-0000-00000000000f/2.jpg');

select results_eq(
  $$ select public, file_size_limit::int, 'image/svg+xml' = any (allowed_mime_types)
     from storage.buckets where id = 'event-photos' $$,
  $$ values (true, 1572864, false) $$,
  'the photo bucket is public, capped and refuses SVG'
);

-- Quien mira sin sesión
set local role anon;

select results_eq(
  $$ select question from public.event_faqs $$,
  $$ values ('¿Hay estacionamiento?') $$,
  'anon reads the questions of a published event, and not those of a draft'
);

select is(
  (select count(*) from public.event_photos), 1::bigint,
  'anon reads the photos of a published event, and not those of a draft'
);

select throws_ok(
  $$ insert into public.event_faqs (event_id, organization_id, question, answer)
     values ('00000000-0000-0000-0000-0000000000a1', '0000000a-0000-0000-0000-00000000000f', 'x', 'y') $$,
  '42501', null,
  'anon cannot write a question'
);

select throws_ok(
  $$ update public.events set map_url = 'https://maps.example/x' $$,
  '42501', null,
  'anon cannot write a link'
);

-- Staff de otra org
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000fb1","role":"authenticated"}', true);

select throws_ok(
  $$ insert into public.event_faqs (event_id, organization_id, question, answer)
     values ('00000000-0000-0000-0000-0000000000a1', '0000000a-0000-0000-0000-00000000000f', 'x', 'y') $$,
  '42501', null,
  'staff of another org cannot add a question to this event'
);

select is_empty(
  $$ update public.events set map_url = 'https://maps.example/x' returning id $$,
  'staff of another org updates no link'
);

-- Staff de la org
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000fa1","role":"authenticated"}', true);

select lives_ok(
  $$ update public.events set website_url = 'https://expo.example', instagram_url = 'https://instagram.com/expo',
       tickets_url = 'https://tickets.example/expo', map_url = 'https://maps.example/expo'
     where id = '00000000-0000-0000-0000-0000000000a2' $$,
  'staff sets the links, even of a draft event'
);

select throws_ok(
  $$ update public.events set website_url = 'javascript:alert(1)'
     where id = '00000000-0000-0000-0000-0000000000a2' $$,
  '23514', null,
  'a link that is not https is refused'
);

select throws_ok(
  $$ update public.events set map_url = 'https://maps.example/a b'
     where id = '00000000-0000-0000-0000-0000000000a2' $$,
  '23514', null,
  'a link with spaces is refused'
);

select throws_ok(
  $$ insert into public.event_faqs (event_id, organization_id, question, answer)
     values ('00000000-0000-0000-0000-0000000000a1', '0000000a-0000-0000-0000-00000000000f', '   ', 'y') $$,
  '23514', null,
  'a blank question is refused'
);

select lives_ok(
  $$ insert into public.event_faqs (event_id, organization_id, question, answer, sort_order)
     values ('00000000-0000-0000-0000-0000000000a1', '0000000a-0000-0000-0000-00000000000f', '¿Cuánto cuesta?', 'Es gratis.', 1) $$,
  'staff adds a question'
);

select throws_ok(
  $$ insert into public.event_photos (event_id, organization_id, path)
     values ('00000000-0000-0000-0000-0000000000a1', '0000000a-0000-0000-0000-00000000000f',
             '0000000b-0000-0000-0000-00000000000f/x.jpg') $$,
  '23514', null,
  'a photo cannot point at a file of another org'
);

select lives_ok(
  $$ insert into public.event_photos (event_id, organization_id, path, caption)
     select '00000000-0000-0000-0000-0000000000a1', '0000000a-0000-0000-0000-00000000000f',
            '0000000a-0000-0000-0000-00000000000f/p' || n || '.jpg', 'Foto ' || n
     from generate_series(1, 11) n $$,
  'staff fills an event up to the photo cap'
);

select throws_ok(
  $$ insert into public.event_photos (event_id, organization_id, path)
     values ('00000000-0000-0000-0000-0000000000a1', '0000000a-0000-0000-0000-00000000000f',
             '0000000a-0000-0000-0000-00000000000f/extra.jpg') $$,
  '23514', null,
  'a thirteenth photo is refused'
);

select lives_ok(
  $$ delete from public.event_faqs where id = '00000000-0000-0000-0000-0000000000b2' $$,
  'staff deletes a question'
);

select * from finish();
rollback;
