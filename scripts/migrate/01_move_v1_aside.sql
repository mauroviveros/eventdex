-- Corte a producción, paso 1 de 2. Se corre UNA vez, a mano, antes del primer
-- `pnpm db:push`, contra el proyecto que todavía tiene la v1.
--
-- Deja todas las tablas de la v1 intactas en el esquema `v1` (R10 las lee de ahí)
-- y una `public` vacía para el esquema nuevo. No borra ninguna fila; la reversa es
-- 01_rollback.sql. Después de esto, la app v1 deja de funcionar.

begin;

do $$
begin
  if to_regclass('public.user_spot_history') is null then
    raise exception 'public no tiene las tablas de la v1: no se mueve nada';
  end if;
  if to_regnamespace('v1') is not null then
    raise exception 'El esquema v1 ya existe: este script ya corrió';
  end if;
end;
$$;

alter schema public rename to v1;

-- La API no expone `v1`, pero tiene datos personales: solo service_role (R10).
revoke all on schema v1 from public, anon, authenticated;

create schema public authorization pg_database_owner;
comment on schema public is 'standard public schema';
grant usage on schema public to postgres, anon, authenticated, service_role;

-- Los permisos por defecto se fueron con el renombrado. anon y authenticated no
-- llevan: cada migración otorga lo suyo con GRANT explícitos.
alter default privileges for role postgres in schema public
  grant all on tables to service_role;
alter default privileges for role postgres in schema public
  grant all on sequences to service_role;
alter default privileges for role postgres in schema public
  grant all on functions to service_role;

commit;

notify pgrst, 'reload schema';
