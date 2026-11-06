-- Private schema for RLS helpers (app.is_org_member, app.is_developer, ...).
-- It is not listed in [api].schemas, so PostgREST never exposes it; roles only
-- need USAGE so policies can call its security definer functions.
create schema app;

revoke all on schema app from public;
grant usage on schema app to anon, authenticated, service_role;
