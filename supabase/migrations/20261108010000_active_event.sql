-- Auditoría de R4: la portada resolvía el evento activo y después lo leía, dos
-- viajes a la base. active_event devuelve la fila de events, así PostgREST
-- embebe jornadas, sede y spots en la misma llamada. Security invoker: RLS
-- sigue siendo la barrera; la regla es la de resolve_active_event.
create function public.active_event(p_organization_id uuid)
returns setof public.events
language sql
stable
set search_path = ''
as $$
  select * from public.events
  where id = (select public.resolve_active_event(p_organization_id));
$$;

revoke all on function public.active_event(uuid) from public;
grant execute on function public.active_event(uuid) to anon, authenticated;
