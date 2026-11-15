-- R26 · bloque 2: el orden de las preguntas frecuentes. Las nuevas van al final y
-- mover una renumera las del evento, sin que otra org ni un visitante puedan.
begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000ea1', 'staff-a@order.local'),
  ('00000000-0000-0000-0000-000000000eb1', 'staff-b@order.local');

insert into public.organizations (id, slug, name) values
  ('0000000a-0000-0000-0000-00000000000e', 'order-a', 'Order A'),
  ('0000000b-0000-0000-0000-00000000000e', 'order-b', 'Order B');

insert into public.organization_members (organization_id, user_id, role) values
  ('0000000a-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-000000000ea1', 'staff'),
  ('0000000b-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-000000000eb1', 'staff');

insert into public.events (id, organization_id, slug, title, status, published_at) values
  ('00000000-0000-0000-0000-0000000000e1', '0000000a-0000-0000-0000-00000000000e', 'orden', 'Orden', 'published', now());

-- Tres preguntas, y la primera con un orden que no es el suyo
insert into public.event_faqs (id, event_id, organization_id, question, answer, sort_order) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', '0000000a-0000-0000-0000-00000000000e', 'Uno',  'a', 7),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000e1', '0000000a-0000-0000-0000-00000000000e', 'Dos',  'a', 0),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000e1', '0000000a-0000-0000-0000-00000000000e', 'Tres', 'a', 0);

-- Quien mira sin sesión no mueve nada
set local role anon;

select throws_ok(
  $$ select public.move_event_faq('00000000-0000-0000-0000-0000000000f1', 1) $$,
  '42501', null,
  'anon cannot move a question'
);

-- Staff de la org
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000ea1","role":"authenticated"}', true);

select results_eq(
  $$ select question, sort_order from public.event_faqs where event_id = '00000000-0000-0000-0000-0000000000e1' order by sort_order $$,
  $$ values ('Uno', 0), ('Dos', 1), ('Tres', 2) $$,
  'new questions go to the end, in the order they were added'
);

select lives_ok(
  $$ select public.move_event_faq('00000000-0000-0000-0000-0000000000f1', 1) $$,
  'staff moves a question down'
);

select results_eq(
  $$ select question from public.event_faqs where event_id = '00000000-0000-0000-0000-0000000000e1' order by sort_order $$,
  $$ values ('Dos'), ('Uno'), ('Tres') $$,
  'the question swapped places with the one below'
);

select lives_ok(
  $$ select public.move_event_faq('00000000-0000-0000-0000-0000000000f3', -1) $$,
  'staff moves a question up'
);

select results_eq(
  $$ select question from public.event_faqs where event_id = '00000000-0000-0000-0000-0000000000e1' order by sort_order $$,
  $$ values ('Dos'), ('Tres'), ('Uno') $$,
  'the question swapped places with the one above'
);

-- En los extremos no pasa nada
select lives_ok(
  $$ select public.move_event_faq('00000000-0000-0000-0000-0000000000f2', -1);
     select public.move_event_faq('00000000-0000-0000-0000-0000000000f1', 1) $$,
  'moving the first one up, or the last one down, is not an error'
);

select results_eq(
  $$ select question, sort_order from public.event_faqs where event_id = '00000000-0000-0000-0000-0000000000e1' order by sort_order $$,
  $$ values ('Dos', 0), ('Tres', 1), ('Uno', 2) $$,
  'the ends stay where they were, numbered with no repeats'
);

-- Preguntas viejas con el mismo número: el orden salía de created_at y se respeta
reset role;
update public.event_faqs set sort_order = 0, created_at = case question
  when 'Uno' then '2026-01-01'::timestamptz when 'Dos' then '2026-01-02' else '2026-01-03' end;
set local role authenticated;

select public.move_event_faq('00000000-0000-0000-0000-0000000000f3', -1);

select results_eq(
  $$ select question, sort_order from public.event_faqs where event_id = '00000000-0000-0000-0000-0000000000e1' order by sort_order $$,
  $$ values ('Uno', 0), ('Tres', 1), ('Dos', 2) $$,
  'questions that all had 0 keep their load order, then move'
);

select lives_ok(
  $$ insert into public.event_faqs (event_id, organization_id, question, answer)
     values ('00000000-0000-0000-0000-0000000000e1', '0000000a-0000-0000-0000-00000000000e', 'Cuatro', 'a') $$,
  'staff adds a question after moving others'
);

select is(
  (select question from public.event_faqs where event_id = '00000000-0000-0000-0000-0000000000e1' order by sort_order desc limit 1), 'Cuatro',
  'and it goes last'
);

select throws_ok(
  $$ select public.move_event_faq('00000000-0000-0000-0000-0000000000f1', 2) $$,
  '22023', null,
  'a direction other than up or down is refused'
);

-- Staff de otra org
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000eb1","role":"authenticated"}', true);

select throws_ok(
  $$ select public.move_event_faq('00000000-0000-0000-0000-0000000000f1', 1) $$,
  '42501', null,
  'staff of another org cannot move a question of this event'
);

select throws_ok(
  $$ select public.move_event_faq('00000000-0000-0000-0000-00000000dead', 1) $$,
  '42501', null,
  'a question that does not exist reads as no permission'
);

select * from finish();
rollback;
