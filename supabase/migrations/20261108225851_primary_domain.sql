-- R7 · bloque 2: cambiar el dominio principal.
-- Hacen falta dos updates (hay un solo principal por org y el índice no se puede
-- diferir), y una org sin principal deja a los QR sin destino: van juntos acá.
-- security invoker: las políticas de organization_domains deciden quién puede.
create function public.set_primary_domain(p_domain_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org
  from public.organization_domains
  where id = p_domain_id;

  update public.organization_domains
  set is_primary = false
  where organization_id = v_org and is_primary and id <> p_domain_id;

  update public.organization_domains
  set is_primary = true
  where id = p_domain_id;

  if not found then
    raise exception 'No podés cambiar ese dominio'
      using errcode = 'insufficient_privilege';
  end if;
end;
$$;

revoke all on function public.set_primary_domain(uuid) from public, anon;
grant execute on function public.set_primary_domain(uuid) to authenticated;
