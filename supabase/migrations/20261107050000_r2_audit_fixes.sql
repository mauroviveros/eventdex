-- Hallazgos de la auditoría de R2.

-- Un evento publicado no se queda sin jornadas: publish_event() exige una, y
-- borrar la última dejaría un evento público sin fecha ni fase. Se hace
-- cumplir en la base porque la interfaz se puede saltear.
create function app.keep_published_schedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Si el evento ya no está (borrado en cascada), viene de arriba: pasa.
  if exists (
    select 1 from public.events
    where id = old.event_id and status = 'published'
  ) and not exists (
    select 1 from public.event_schedules
    where event_id = old.event_id and id <> old.id
  ) then
    raise exception 'Un evento publicado necesita al menos una jornada'
      using errcode = 'check_violation';
  end if;
  return old;
end;
$$;

revoke all on function app.keep_published_schedule() from public;

create trigger event_schedules_keep_published
  before delete on public.event_schedules
  for each row execute function app.keep_published_schedule();
