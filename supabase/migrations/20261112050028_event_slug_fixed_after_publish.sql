-- R15 · bloque 7: la dirección (slug) de un evento solo cambia mientras es un
-- borrador. Publicado, el link a su portada ya puede estar compartido. La
-- acción lo revisa, pero se hace cumplir en la base porque la interfaz se
-- puede saltear (la columna slug sigue en el grant de update para borradores).
create function app.keep_published_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'draft' and new.slug is distinct from old.slug then
    raise exception 'La dirección de un evento publicado no cambia'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger events_keep_published_slug
  before update of slug on public.events
  for each row execute function app.keep_published_slug();
