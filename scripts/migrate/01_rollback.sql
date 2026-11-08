-- Reversa de 01_move_v1_aside.sql: borra lo NUEVO (esquemas `public` y `app`, y el
-- historial de sus migraciones) y devuelve la v1 a su lugar. Lo que se haya cargado
-- en el esquema nuevo se pierde; los perfiles de la v1 no se tocan.

begin;

do $$
begin
  if to_regnamespace('v1') is null then
    raise exception 'No existe el esquema v1: no hay nada que revertir';
  end if;
end;
$$;

drop schema if exists app cascade;
drop schema public cascade;
alter schema v1 rename to public;
grant usage on schema public to public, anon, authenticated;

delete from supabase_migrations.schema_migrations
where version >= '20261106231049';

commit;

notify pgrst, 'reload schema';
