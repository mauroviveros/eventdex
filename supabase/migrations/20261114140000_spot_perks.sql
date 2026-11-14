-- R20 · bloque 1: el beneficio de un stand en un evento ("10 % de descuento",
-- "una muestra gratis"). Es de cada evento, no del catálogo: el descuento de un
-- año no se arrastra al siguiente. Lo escribe el staff de la org; lo lee quien ya
-- lee el event_spot (el evento publicado es público).
--
-- Fuera del snapshot a propósito: el staff puede corregirlo con el evento en
-- vivo, como los puntos o el puesto.
-- ---------------------------------------------------------------------------

alter table public.event_spots
  add column perk text,
  add constraint event_spots_perk_length
    check (char_length(btrim(perk)) between 1 and 120);

-- Insert no lo suma: un event_spot nace sin beneficio y se edita después.
grant update (perk) on public.event_spots to authenticated;
