-- R2 · bloque 0: el admin es por organización.
-- Las invitaciones se aceptan solas al entrar, y el developer puede entrar a
-- cualquier org en modo soporte, con rastro en la auditoría.

-- Acepta todas las invitaciones abiertas y vigentes para el mail de la cuenta.
-- Idempotente: lo que ya se aceptó no vuelve a aparecer. Devuelve las orgs.
create function public.accept_my_invitations()
returns setof uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- lower(): with search_path = '' citext's case-insensitive operator is not
  -- found and the comparison falls back to plain text.
  v_email text := lower((select app.current_email())::text);
  v_inv   public.organization_invitations;
begin
  -- Una cuenta sin mail no puede coincidir con ninguna invitación.
  if v_email is null then
    return;
  end if;

  for v_inv in
    select * from public.organization_invitations
    where lower(email::text) = v_email
      and accepted_at is null
      and expires_at >= now()
    for update
  loop
    insert into public.organization_members (organization_id, user_id, role)
    values (v_inv.organization_id, (select auth.uid()), v_inv.role)
    on conflict (organization_id, user_id) do update set role = excluded.role;

    update public.organization_invitations set accepted_at = now() where id = v_inv.id;

    perform app.audit(v_inv.organization_id, 'invitation.accepted', 'organization_invitation', v_inv.id);

    return next v_inv.organization_id;
  end loop;
end;
$$;

-- Registra que el developer abrió el panel de una org que no es suya.
create function public.log_support_access(p_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select app.is_developer()) then
    raise exception 'Solo el developer entra en modo soporte'
      using errcode = 'insufficient_privilege';
  end if;
  perform app.audit(p_organization_id, 'support.viewed', 'organization', p_organization_id);
end;
$$;

revoke all on function public.accept_my_invitations() from public, anon;
revoke all on function public.log_support_access(uuid) from public, anon;
grant execute on function public.accept_my_invitations() to authenticated;
grant execute on function public.log_support_access(uuid) to authenticated;

-- Mismo problema en accept_invitation (R1): la comparación de mails distinguía
-- mayúsculas. Se reemplaza con la comparación en minúsculas.
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
     or lower(v_inv.email::text) is distinct from lower((select app.current_email())::text) then
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
