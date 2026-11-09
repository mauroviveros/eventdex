-- Los dominios los configura solo el developer: sumar uno exige cargarlo a mano en
-- Vercel y en Auth, y moverlo toca a dos organizaciones.

drop policy organization_domains_insert on public.organization_domains;
drop policy organization_domains_update on public.organization_domains;
drop policy organization_domains_delete on public.organization_domains;

create policy organization_domains_insert on public.organization_domains
  for insert to authenticated
  with check ((select app.is_developer()));

create policy organization_domains_update on public.organization_domains
  for update to authenticated
  using ((select app.is_developer()))
  with check ((select app.is_developer()));

create policy organization_domains_delete on public.organization_domains
  for delete to authenticated
  using ((select app.is_developer()));

-- Suma un dominio a la org y, si es de otra, lo mueve con p_transfer. Sin p_transfer
-- devuelve el nombre de la org que lo tiene y no cambia nada; null es que se hizo.
-- Atómica: una org no puede quedar sin principal, porque sus QR se quedan sin destino.
create function public.assign_domain(
  p_organization_id uuid,
  p_hostname        text,
  p_make_primary    boolean default false,
  p_transfer        boolean default false
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_host    text := lower(trim(p_hostname));
  v_taken   public.organization_domains;
  v_owner   text;
  v_next    uuid;
  v_primary boolean;
begin
  if not (select app.is_developer()) then
    raise exception 'Solo el developer puede configurar dominios'
      using errcode = 'insufficient_privilege';
  end if;

  select d.* into v_taken
  from public.organization_domains d
  where d.hostname = v_host::extensions.citext
  for update;

  if found then
    if v_taken.organization_id = p_organization_id then
      raise exception 'El dominio ya es de esta organización'
        using errcode = 'unique_violation';
    end if;

    if not p_transfer then
      select name into v_owner
      from public.organizations where id = v_taken.organization_id;
      return v_owner;
    end if;

    if v_taken.is_primary then
      select id into v_next
      from public.organization_domains
      where organization_id = v_taken.organization_id and id <> v_taken.id
      order by hostname
      limit 1;

      if v_next is null then
        raise exception 'La organización no tiene otro dominio para que sea el principal'
          using errcode = 'check_violation';
      end if;
    end if;

    -- En este orden: el índice admite un solo principal por org y no se puede diferir.
    delete from public.organization_domains where id = v_taken.id;
    update public.organization_domains set is_primary = true where id = v_next;
  end if;

  v_primary := p_make_primary or not exists (
    select 1 from public.organization_domains
    where organization_id = p_organization_id and is_primary
  );

  if v_primary then
    update public.organization_domains
    set is_primary = false
    where organization_id = p_organization_id and is_primary;
  end if;

  insert into public.organization_domains (organization_id, hostname, is_primary)
  values (p_organization_id, v_host::extensions.citext, v_primary);

  return null;
end;
$$;

revoke all on function public.assign_domain(uuid, text, boolean, boolean) from public, anon;
grant execute on function public.assign_domain(uuid, text, boolean, boolean) to authenticated;
