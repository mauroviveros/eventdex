-- Hallazgos de la auditoría de R3.

-- prepare_event_spot leía el estado del evento sin bloquearlo: un spot agregado
-- mientras otra sesión publicaba veía 'draft', quedaba sin snapshot y el UPDATE
-- de publish_event tampoco lo alcanzaba. `for share` espera a que la
-- publicación termine (publish_event toma la fila con `for update`) y lee el
-- estado ya confirmado.
create or replace function app.prepare_event_spot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_spot   public.spots;
  v_status public.event_status;
begin
  select status into v_status
  from public.events
  where id = new.event_id
  for share;

  select * into v_spot from public.spots where id = new.spot_id;

  if v_spot.archived_at is not null then
    raise exception 'El spot está archivado: desarchivalo para usarlo en un evento'
      using errcode = 'check_violation';
  end if;

  new.snapshot := case when v_status = 'published' then app.spot_snapshot(v_spot) end;
  return new;
end;
$$;
