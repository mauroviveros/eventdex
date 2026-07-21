-- Garantiza idempotencia de la colección de medallas: un usuario no puede tener
-- el mismo spot más de una vez. Sin esto, dos escaneos casi simultáneos del mismo
-- QR pueden crear filas duplicadas e inflar el conteo del sorteo.
--
-- El índice único hace que un insert duplicado falle con el código 23505, que la
-- app (collectMedal) trata como "ya coleccionado".

-- Si ya existieran duplicados, este índice fallará al crearse. En ese caso,
-- deduplicar primero quedándose con la fila más antigua (descomentar):
--
-- delete from public.user_spot_history a
--   using public.user_spot_history b
--   where a.user_id = b.user_id
--     and a.spot_id = b.spot_id
--     and a.id > b.id;

create unique index if not exists user_spot_history_user_spot_unique
  on public.user_spot_history (user_id, spot_id);
