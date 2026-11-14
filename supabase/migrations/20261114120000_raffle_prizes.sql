-- R19 · bloque 1: premios a la vista.
--
-- Los sorteos de un evento publicado se leen sin sesión: el visitante ve qué se
-- gana y cuánto le falta. Las extracciones siguen como estaban, solo con
-- ganadores publicados. La imagen del premio va a un bucket propio, sin SVG y
-- con el mismo límite que los banners.

alter table public.raffles
  add column description text
    check (description is null or char_length(trim(description)) between 1 and 500),
  add column image_path text;

-- Un sorteo no puede apuntar su imagen a un archivo de otra org.
alter table public.raffles
  add constraint raffles_image_path_in_org
  check (image_path is null or image_path like organization_id::text || '/%');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('raffle-images', 'raffle-images', true, 1572864, array['image/png', 'image/jpeg', 'image/webp']);

-- Storage necesita poder leer la fila para borrar el archivo.
create policy raffle_images_select on storage.objects
  for select to authenticated
  using (bucket_id = 'raffle-images' and (select app.member_of_folder(name)));

create policy raffle_images_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'raffle-images' and (select app.member_of_folder(name)));

create policy raffle_images_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'raffle-images' and (select app.member_of_folder(name)));

-- Lectura pública: el sorteo de un evento publicado, ya no solo con ganadores.
drop policy raffles_select_anon on public.raffles;
drop policy raffles_select on public.raffles;

create policy raffles_select_anon on public.raffles
  for select to anon
  using (exists (
    select 1 from public.events e
    where e.id = raffles.event_id and e.status = 'published' and e.deleted_at is null
  ));

create policy raffles_select on public.raffles
  for select to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = raffles.event_id and e.status = 'published' and e.deleted_at is null
    )
    or (select app.is_org_member(organization_id))
    or (select app.is_developer())
  );

-- El equipo cambia la descripción y la imagen. El título y el mínimo no: ya
-- pueden tener extracciones hechas con ellos.
create policy raffles_update on public.raffles
  for update to authenticated
  using ((select app.is_org_member(organization_id)))
  with check ((select app.is_org_member(organization_id)));

grant update (description, image_path) on public.raffles to authenticated;
