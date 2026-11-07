-- Permisos explícitos por tabla.
--
-- Desde 2026-10-30 Supabase ya no expone tablas nuevas de `public` a la Data
-- API sin GRANT. En local, en cambio, anon y authenticated recibían todo
-- (TRUNCATE incluido, que se saltea RLS). Acá se iguala local con producción:
-- nada por defecto, y cada tabla otorga solo lo que sus políticas necesitan.

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, display_name, avatar_url) on public.profiles to authenticated;

grant select on public.platform_admins to authenticated;

grant select on public.organizations to anon, authenticated;
grant update (name, brand_color, logo_path, default_timezone) on public.organizations to authenticated;

grant select on public.organization_domains to anon, authenticated;
grant insert, update, delete on public.organization_domains to authenticated;

grant select, delete on public.organization_members to authenticated;
grant update (role) on public.organization_members to authenticated;

grant select, insert, delete on public.organization_invitations to authenticated;

grant select on public.audit_logs to authenticated;

-- ---------------------------------------------------------------------------
-- Una política permisiva por rol y acción (advisor 0006): cada política extra
-- se evalúa en cada fila.
-- ---------------------------------------------------------------------------

drop policy organizations_select_public on public.organizations;
drop policy organizations_select_team on public.organizations;

create policy organizations_select_anon on public.organizations
  for select to anon
  using (status = 'active' and deleted_at is null);

create policy organizations_select on public.organizations
  for select to authenticated
  using (
    (status = 'active' and deleted_at is null)
    or (select app.is_org_member(id))
    or (select app.is_developer())
  );

drop policy organization_domains_write on public.organization_domains;

create policy organization_domains_insert on public.organization_domains
  for insert to authenticated
  with check ((select app.is_org_owner(organization_id)) or (select app.is_developer()));

create policy organization_domains_update on public.organization_domains
  for update to authenticated
  using ((select app.is_org_owner(organization_id)) or (select app.is_developer()))
  with check ((select app.is_org_owner(organization_id)) or (select app.is_developer()));

create policy organization_domains_delete on public.organization_domains
  for delete to authenticated
  using ((select app.is_org_owner(organization_id)) or (select app.is_developer()));
