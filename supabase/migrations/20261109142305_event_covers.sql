-- R12 · bloque 2: el banner de cada evento.
--
-- Sin SVG, como los logos. Público para leer por URL, y solo se escribe bajo
-- {organization_id}/. A diferencia de los logos de spots, se puede borrar: el
-- banner no entra en ningún snapshot y solo lo apunta su evento.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-covers', 'event-covers', true, 1572864, array['image/png', 'image/jpeg', 'image/webp']);

-- Storage necesita poder leer la fila para borrar el archivo.
create policy event_covers_select on storage.objects
  for select to authenticated
  using (bucket_id = 'event-covers' and (select app.member_of_folder(name)));

create policy event_covers_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-covers' and (select app.member_of_folder(name)));

create policy event_covers_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-covers' and (select app.member_of_folder(name)));

-- Un evento no puede apuntar su banner a un archivo de otra org.
alter table public.events
  add constraint events_cover_path_in_org
  check (cover_path is null or cover_path like organization_id::text || '/%');
