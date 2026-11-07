-- Hallazgos de la auditoría de R1.

-- 1. accept_invitation: una cuenta sin mail comparaba NULL y el guard no
--    disparaba, así que aceptaba cualquier invitación. `is distinct from`
--    trata NULL como distinto.
create or replace function public.accept_invitation(p_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.organization_invitations;
begin
  select * into v_inv
  from public.organization_invitations
  where id = p_invitation_id
  for update;

  if not found
     or v_inv.accepted_at is not null
     or v_inv.expires_at < now()
     or v_inv.email is distinct from (select app.current_email()) then
    raise exception 'La invitación no existe, ya se usó, venció o es para otra cuenta'
      using errcode = 'no_data_found';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_inv.organization_id, (select auth.uid()), v_inv.role)
  on conflict (organization_id, user_id) do update set role = excluded.role;

  update public.organization_invitations set accepted_at = now() where id = v_inv.id;

  perform app.audit(v_inv.organization_id, 'invitation.accepted', 'organization_invitation', v_inv.id);

  return v_inv.organization_id;
end;
$$;

-- 2. El guard del último owner bloqueaba borrar la cuenta de quien era el
--    único owner (cascada auth.users → profiles → members). Borrar una cuenta
--    es un derecho (ver /privacidad): se permite, la org queda sin owner y se
--    registra para que el developer asigne uno.
create or replace function app.prevent_last_owner_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Postgres borra la fila padre antes que sus hijos.
  if not exists (select 1 from public.organizations where id = old.organization_id) then
    return coalesce(new, old);
  end if;

  if not exists (select 1 from public.profiles where id = old.user_id) then
    if old.role = 'owner' then
      perform app.audit(old.organization_id, 'member.account_deleted', 'organization_member', old.id,
        jsonb_build_object('role', old.role));
    end if;
    return old;
  end if;

  if old.role <> 'owner' or (tg_op = 'UPDATE' and new.role = 'owner') then
    return coalesce(new, old);
  end if;

  if not exists (
    select 1 from public.organization_members
    where organization_id = old.organization_id and role = 'owner' and id <> old.id
  ) then
    raise exception 'La organización tiene que conservar al menos un owner'
      using errcode = 'check_violation';
  end if;

  return coalesce(new, old);
end;
$$;

-- 3. create_organization: la auditoría guarda los valores ya normalizados,
--    los mismos que quedan en las tablas.
create or replace function public.create_organization(
  p_slug        text,
  p_name        text,
  p_hostname    text,
  p_owner_email text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org      uuid;
  v_slug     text := lower(trim(p_slug));
  v_hostname text := lower(trim(p_hostname));
  v_email    text := lower(trim(p_owner_email));
begin
  if not (select app.is_developer()) then
    raise exception 'Solo el developer puede crear organizaciones'
      using errcode = 'insufficient_privilege';
  end if;

  insert into public.organizations (slug, name)
  values (v_slug, trim(p_name))
  returning id into v_org;

  insert into public.organization_domains (organization_id, hostname, is_primary)
  values (v_org, v_hostname, true);

  insert into public.organization_invitations (organization_id, email, role, invited_by)
  values (v_org, v_email, 'owner', (select auth.uid()));

  perform app.audit(v_org, 'organization.created', 'organization', v_org,
    jsonb_build_object('slug', v_slug, 'hostname', v_hostname, 'owner_email', v_email));

  return v_org;
end;
$$;
