-- R13: crear una edición nueva a partir de un evento de la org.
--
-- Security invoker: las políticas de events y event_spots deciden quién escribe.
-- El chequeo de membresía está porque un evento publicado de otra org se puede
-- leer. Todo o nada: si falla un spot, el evento no queda creado.
--
-- No se copian las jornadas (son fechas nuevas), el banner (borrar el de una
-- edición dejaría a la otra sin archivo) ni visitantes, medallas o sorteos. El
-- snapshot lo arma event_spots_prepare, y un borrador no lo tiene hasta publicarse.
create function public.duplicate_event(
  p_source_id uuid,
  p_slug text,
  p_title text,
  p_timezone text,
  p_edition_label text default null,
  p_summary text default null,
  p_venue_id uuid default null
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_source public.events;
  v_new_id uuid;
begin
  select * into v_source
  from public.events e
  where e.id = p_source_id and e.deleted_at is null;

  if not found or not (select app.is_org_member(v_source.organization_id)) then
    raise exception 'El evento no existe o no es de tu organización'
      using errcode = 'insufficient_privilege';
  end if;

  insert into public.events (organization_id, venue_id, slug, title, edition_label,
                             summary, description, timezone, visibility, settings)
  values (v_source.organization_id, p_venue_id, p_slug::extensions.citext, p_title,
          p_edition_label, p_summary, v_source.description, p_timezone,
          v_source.visibility, v_source.settings)
  returning id into v_new_id;

  -- Un spot archivado no entra en eventos nuevos: event_spots_prepare lo rechazaría.
  insert into public.event_spots (event_id, organization_id, spot_id, code, name_override,
                                  description_override, booth, points, is_active, sort_order)
  select v_new_id, es.organization_id, es.spot_id, es.code, es.name_override,
         es.description_override, es.booth, es.points, es.is_active, es.sort_order
  from public.event_spots es
  join public.spots s on s.id = es.spot_id
  where es.event_id = p_source_id and s.archived_at is null;

  return p_slug;
end;
$$;

revoke all on function public.duplicate_event(uuid, text, text, text, text, text, uuid) from public, anon;
grant execute on function public.duplicate_event(uuid, text, text, text, text, text, uuid) to authenticated;
