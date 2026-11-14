-- R20 · bloque 1: el beneficio de un stand en un evento ("10 % de descuento",
-- "una muestra gratis"). Es de cada evento, no del catálogo: el descuento de un
-- año no se arrastra al siguiente. Lo escribe el staff de la org; lo lee quien ya
-- lee el event_spot (el evento publicado es público).
--
-- Fuera del snapshot a propósito: el staff puede corregirlo con el evento en
-- vivo, como los puntos o el puesto.
-- ---------------------------------------------------------------------------

-- perk_hidden: beneficio sorpresa. La app no muestra el texto hasta que el
-- visitante tiene la medalla; la base lo sigue leyendo (es una sorpresa, no un
-- secreto).
alter table public.event_spots
  add column perk text,
  add column perk_hidden boolean not null default false,
  add constraint event_spots_perk_length
    check (char_length(perk) <= 120 and btrim(perk) <> '');

-- Insert no lo suma: un event_spot nace sin beneficio y se edita después.
grant update (perk, perk_hidden) on public.event_spots to authenticated;
