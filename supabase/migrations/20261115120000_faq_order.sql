-- R26 · bloque 2: el orden de las preguntas frecuentes.
--
-- `event_faqs.sort_order` ya existe, pero hasta ahora valía 0 para todas y el
-- orden salía de `created_at`. Dos cosas:
--   * una pregunta nueva va al final, siempre;
--   * mover una pregunta un lugar renumera las del evento de una sola vez, así
--     el orden queda completo y estable aunque venga de filas con el mismo valor.

-- Al final del evento. Corre como quien inserta: RLS ya limitó qué puede ver.
-- shortcut: max + 1 no es atómico, dos altas a la vez pueden empatar; el empate se desempata por created_at y el primer movimiento lo renumera
create function public.event_faqs_append()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.sort_order := coalesce(
    (select max(f.sort_order) + 1 from public.event_faqs f where f.event_id = new.event_id),
    0
  );
  return new;
end;
$$;

create trigger event_faqs_append
  before insert on public.event_faqs
  for each row execute function public.event_faqs_append();

-- Sube (-1) o baja (+1) una pregunta un lugar. Corre como quien llama, y además
-- chequea que sea de la org: una pregunta ajena o inexistente da 42501, igual
-- que cualquier otra escritura sin permiso. En un extremo no hace nada, salvo
-- dejar el orden numerado 0, 1, 2… sin repetidos.
-- shortcut: bloquea las preguntas del evento mientras mueve, dos movimientos a la vez esperan uno al otro; alcanza con un puñado de preguntas por evento
create function public.move_event_faq(p_faq_id uuid, p_direction integer)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_event uuid;
  v_org   uuid;
begin
  if p_direction not in (-1, 1) then
    raise exception 'direction must be -1 or 1' using errcode = '22023';
  end if;

  select f.event_id, f.organization_id into v_event, v_org
  from public.event_faqs f
  where f.id = p_faq_id;

  if v_event is null or not (select app.is_org_member(v_org)) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  perform 1 from public.event_faqs where event_id = v_event for update;

  with ranked as (
    select f.id,
           (row_number() over (order by f.sort_order, f.created_at, f.id) - 1)::integer as pos
    from public.event_faqs f
    where f.event_id = v_event
  ),
  target as (select pos from ranked where id = p_faq_id),
  neighbor as (
    select r.id, r.pos from ranked r, target t where r.pos = t.pos + p_direction
  ),
  placed as (
    select r.id,
           case
             when r.id = p_faq_id and exists (select 1 from neighbor)
               then (select pos from neighbor)
             when r.id = (select id from neighbor)
               then (select pos from target)
             else r.pos
           end as pos
    from ranked r
  )
  update public.event_faqs f
  set sort_order = p.pos
  from placed p
  where f.id = p.id and f.sort_order is distinct from p.pos;
end;
$$;

revoke all on function public.move_event_faq(uuid, integer) from public;
grant execute on function public.move_event_faq(uuid, integer) to authenticated;
