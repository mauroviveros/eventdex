-- R21 · bloque 1: la portada como cara del evento.
--
-- Lo que el staff carga para quien quiere saber cómo es el evento: links
-- (web, Instagram, entradas, mapa), preguntas frecuentes y fotos. Todo se lee
-- sin sesión mientras el evento está publicado, como los premios y los stands.
-- Fuera del snapshot a propósito: el staff corrige la portada con el evento en
-- vivo. `events.description` se usa tal cual y `duplicate_event` no copia nada
-- de esto: cada edición cuenta su propia historia.
-- ---------------------------------------------------------------------------

-- Links: solo https, sin espacios (se muestran como links; nunca javascript:).
alter table public.events
  add column website_url   text,
  add column instagram_url text,
  add column tickets_url   text,
  add column map_url       text,
  add constraint events_website_url_https   check (website_url   ~ '^https://[^[:space:]]+$' and char_length(website_url)   <= 300),
  add constraint events_instagram_url_https check (instagram_url ~ '^https://[^[:space:]]+$' and char_length(instagram_url) <= 300),
  add constraint events_tickets_url_https   check (tickets_url   ~ '^https://[^[:space:]]+$' and char_length(tickets_url)   <= 300),
  add constraint events_map_url_https       check (map_url       ~ '^https://[^[:space:]]+$' and char_length(map_url)       <= 300);

grant update (website_url, instagram_url, tickets_url, map_url)
  on public.events to authenticated;

-- Preguntas frecuentes
create table public.event_faqs (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  question        text not null,
  answer          text not null,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,

  foreign key (event_id, organization_id)
    references public.events (id, organization_id) on delete cascade,
  constraint event_faqs_question_length check (char_length(btrim(question)) between 1 and 160),
  constraint event_faqs_answer_length   check (char_length(btrim(answer))   between 1 and 600)
);

create index event_faqs_event_idx on public.event_faqs (event_id, sort_order, created_at);
create index event_faqs_org_idx on public.event_faqs (organization_id);

create trigger event_faqs_set_updated_at
  before update on public.event_faqs
  for each row execute function app.set_updated_at();

-- Fotos
create table public.event_photos (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  path            text not null,
  caption         text,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),

  foreign key (event_id, organization_id)
    references public.events (id, organization_id) on delete cascade,
  -- Una foto no puede apuntar a un archivo de otra org.
  constraint event_photos_path_in_org check (path like organization_id::text || '/%'),
  constraint event_photos_caption_length
    check (caption is null or char_length(btrim(caption)) between 1 and 120)
);

create index event_photos_event_idx on public.event_photos (event_id, sort_order, created_at);
create index event_photos_org_idx on public.event_photos (organization_id);

-- Tope por evento: la portada carga todas, y en el celular tienen que entrar.
-- shortcut: el conteo no es atómico, dos altas a la vez pueden pasar el tope por una; un lock por evento si importa
create function public.event_photos_cap()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.event_photos where event_id = new.event_id) >= 12 then
    raise exception 'an event holds at most 12 photos' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger event_photos_cap
  before insert on public.event_photos
  for each row execute function public.event_photos_cap();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-photos', 'event-photos', true, 1572864, array['image/png', 'image/jpeg', 'image/webp']);

-- Storage necesita poder leer la fila para borrar el archivo.
create policy event_photos_select on storage.objects
  for select to authenticated
  using (bucket_id = 'event-photos' and (select app.member_of_folder(name)));

create policy event_photos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-photos' and (select app.member_of_folder(name)));

create policy event_photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-photos' and (select app.member_of_folder(name)));

-- ---------------------------------------------------------------------------
-- RLS: lo lee cualquiera mientras el evento está publicado; lo escribe el staff
-- ---------------------------------------------------------------------------
alter table public.event_faqs enable row level security;
alter table public.event_photos enable row level security;

create policy event_faqs_select_anon on public.event_faqs
  for select to anon
  using (exists (
    select 1 from public.events e
    where e.id = event_faqs.event_id and e.status = 'published' and e.deleted_at is null
  ));

create policy event_faqs_select on public.event_faqs
  for select to authenticated
  using (
    (select app.is_org_member(organization_id))
    or (select app.is_developer())
    or exists (
      select 1 from public.events e
      where e.id = event_faqs.event_id and e.status = 'published' and e.deleted_at is null
    )
  );

create policy event_faqs_insert on public.event_faqs
  for insert to authenticated
  with check ((select app.is_org_member(organization_id)));

create policy event_faqs_update on public.event_faqs
  for update to authenticated
  using ((select app.is_org_member(organization_id)))
  with check ((select app.is_org_member(organization_id)));

create policy event_faqs_delete on public.event_faqs
  for delete to authenticated
  using ((select app.is_org_member(organization_id)));

create policy event_photos_select_anon on public.event_photos
  for select to anon
  using (exists (
    select 1 from public.events e
    where e.id = event_photos.event_id and e.status = 'published' and e.deleted_at is null
  ));

create policy event_photos_select_member on public.event_photos
  for select to authenticated
  using (
    (select app.is_org_member(organization_id))
    or (select app.is_developer())
    or exists (
      select 1 from public.events e
      where e.id = event_photos.event_id and e.status = 'published' and e.deleted_at is null
    )
  );

create policy event_photos_insert on public.event_photos
  for insert to authenticated
  with check ((select app.is_org_member(organization_id)));

create policy event_photos_update on public.event_photos
  for update to authenticated
  using ((select app.is_org_member(organization_id)))
  with check ((select app.is_org_member(organization_id)));

create policy event_photos_delete on public.event_photos
  for delete to authenticated
  using ((select app.is_org_member(organization_id)));

-- ---------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------
grant select on public.event_faqs, public.event_photos to anon, authenticated;

grant insert (event_id, organization_id, question, answer, sort_order)
  on public.event_faqs to authenticated;
grant update (question, answer, sort_order) on public.event_faqs to authenticated;
grant delete on public.event_faqs to authenticated;

grant insert (event_id, organization_id, path, caption, sort_order)
  on public.event_photos to authenticated;
grant update (caption, sort_order) on public.event_photos to authenticated;
grant delete on public.event_photos to authenticated;
