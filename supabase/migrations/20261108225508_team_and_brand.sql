-- R7 · bloque 1: equipo y marca.
-- El estado de una invitación sale de sus fechas (pendiente, aceptada, vencida)
-- y revocar es borrarla. El color de marca no valida contraste: la rampa lo
-- garantiza para cualquier tono (ver docs/DESIGN_SYSTEM.md).

-- ---------------------------------------------------------------------------
-- Invitar
-- ---------------------------------------------------------------------------

-- security invoker: las políticas de organization_invitations deciden quién
-- invita. Una vencida se reemplaza; una abierta o un miembro dan 23505.
create function public.invite_member(
  p_organization_id uuid,
  p_email           text,
  p_role            public.organization_role
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_id    uuid;
begin
  if exists (
    select 1
    from public.organization_members m
    join public.profiles p on p.id = m.user_id
    where m.organization_id = p_organization_id
      and lower(p.email::text) = v_email
  ) then
    raise exception 'Esa persona ya es parte del equipo'
      using errcode = 'unique_violation';
  end if;

  delete from public.organization_invitations
  where organization_id = p_organization_id
    and lower(email::text) = v_email
    and accepted_at is null
    and expires_at < now();

  insert into public.organization_invitations (organization_id, email, role, invited_by)
  values (p_organization_id, v_email, p_role, (select auth.uid()))
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.invite_member(uuid, text, public.organization_role) from public, anon;
grant execute on function public.invite_member(uuid, text, public.organization_role) to authenticated;

-- ---------------------------------------------------------------------------
-- Auditoría de equipo y dominios: la escritura va directo por RLS, así que el
-- rastro lo deja la base. Argumentos: prefijo de la acción y tipo de entidad.
-- ---------------------------------------------------------------------------

create function app.audit_org_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb := to_jsonb(coalesce(new, old));
  v_org uuid  := (v_row ->> 'organization_id')::uuid;
begin
  -- Cascadas: la org o la cuenta ya no están, y audit_logs las referencia.
  if not exists (select 1 from public.organizations where id = v_org)
     or (v_row ? 'user_id'
         and not exists (select 1 from public.profiles where id = (v_row ->> 'user_id')::uuid)) then
    return null;
  end if;

  perform app.audit(
    v_org,
    tg_argv[0] || '.' || case tg_op when 'INSERT' then 'created' when 'UPDATE' then 'updated' else 'deleted' end,
    tg_argv[1],
    (v_row ->> 'id')::uuid,
    case when tg_op = 'UPDATE'
      then jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new))
      else v_row
    end
  );
  return null;
end;
$$;

revoke all on function app.audit_org_row() from public, anon, authenticated;

create trigger organization_members_audit_role
  after update of role on public.organization_members
  for each row when (old.role is distinct from new.role)
  execute function app.audit_org_row('member', 'organization_member');

create trigger organization_members_audit_delete
  after delete on public.organization_members
  for each row execute function app.audit_org_row('member', 'organization_member');

create trigger organization_invitations_audit
  after insert or delete on public.organization_invitations
  for each row execute function app.audit_org_row('invitation', 'organization_invitation');

create trigger organization_domains_audit
  after insert or update or delete on public.organization_domains
  for each row execute function app.audit_org_row('domain', 'organization_domain');

-- ---------------------------------------------------------------------------
-- Logo de la organización
-- ---------------------------------------------------------------------------

-- Sin SVG: un SVG servido desde el bucket puede ejecutar scripts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('org-logos', 'org-logos', true, 1048576, array['image/png', 'image/jpeg', 'image/webp']);

-- El logo se guarda bajo {organization_id}/. Compara como texto porque la
-- carpeta la elige quien sube y puede no ser un uuid.
create function app.owns_logo_folder(p_object_name text)
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
      and role = 'owner'
  );
$$;

revoke all on function app.owns_logo_folder(text) from public;
grant execute on function app.owns_logo_folder(text) to authenticated;

-- El bucket es público para leer por URL; esta política es la que necesita el
-- owner para reemplazar y borrar, y evita que cualquiera liste el bucket.
create policy org_logos_select on storage.objects
  for select to authenticated
  using (bucket_id = 'org-logos' and (select app.owns_logo_folder(name)));

create policy org_logos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'org-logos' and (select app.owns_logo_folder(name)));

create policy org_logos_update on storage.objects
  for update to authenticated
  using (bucket_id = 'org-logos' and (select app.owns_logo_folder(name)))
  with check (bucket_id = 'org-logos' and (select app.owns_logo_folder(name)));

create policy org_logos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'org-logos' and (select app.owns_logo_folder(name)));

-- Una org no puede apuntar su logo a un archivo de otra.
alter table public.organizations
  add constraint organizations_logo_path_in_org
  check (logo_path is null or logo_path like id::text || '/%');
