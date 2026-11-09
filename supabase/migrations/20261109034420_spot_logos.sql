-- R10 · bloque 2: logos de los spots.
--
-- Sin SVG: un SVG servido desde el bucket puede ejecutar scripts. Público para
-- leer por URL, y solo se escribe bajo {organization_id}/.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('spot-logos', 'spot-logos', true, 1048576, array['image/png', 'image/jpeg', 'image/webp']);

-- Compara como texto porque la carpeta la elige quien sube y puede no ser un uuid.
create function app.member_of_folder(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id::text = (storage.foldername(p_object_name))[1]
      and user_id = (select auth.uid())
  );
$$;

revoke all on function app.member_of_folder(text) from public;
grant execute on function app.member_of_folder(text) to authenticated;

-- Solo insert: cada subida es un archivo nuevo y no se borra el anterior, porque
-- el snapshot de un evento publicado puede seguir apuntando a él.
create policy spot_logos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'spot-logos' and (select app.member_of_folder(name)));

-- Un spot no puede apuntar su logo a un archivo de otra org.
alter table public.spots
  add constraint spots_logo_path_in_org
  check (logo_path is null or logo_path like organization_id::text || '/%');
