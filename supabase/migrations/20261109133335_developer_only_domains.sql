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

-- Suma un dominio a la org. Si es de otra, solo lo mueve cuando p_transfer_from es esa
-- org: la que el developer vio al confirmar. Si no, devuelve una fila con quién lo tiene
-- y qué dominio pasaría a ser su principal, y no cambia nada. Sin filas: se hizo.
-- Atómica: una org no puede quedar sin principal, porque sus QR se quedan sin destino.
create function public.assign_domain(
  p_organization_id uuid,
  p_hostname        text,
  p_make_primary    boolean default false,
  p_transfer_from   uuid default null
)
returns table (owner_id uuid, owner_name text, next_primary text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_host    text := lower(trim(p_hostname));
  v_taken   public.organization_domains;
  v_next    public.organization_domains;
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
        using errcode = 'duplicate_object';
    end if;

    if v_taken.is_primary then
      select d.* into v_next
      from public.organization_domains d
      where d.organization_id = v_taken.organization_id and d.id <> v_taken.id
      order by d.hostname
      limit 1;
    end if;

    if v_taken.organization_id is distinct from p_transfer_from then
      return query
        select o.id, o.name, v_next.hostname::text
        from public.organizations o
        where o.id = v_taken.organization_id;
      return;
    end if;

    if v_taken.is_primary and v_next.id is null then
      raise exception 'La organización no tiene otro dominio para que sea el principal'
        using errcode = 'restrict_violation';
    end if;

    -- En este orden: el índice admite un solo principal por org y no se puede diferir.
    delete from public.organization_domains where id = v_taken.id;
    update public.organization_domains set is_primary = true where id = v_next.id;
  end if;

  v_primary := p_make_primary or not exists (
    select 1 from public.organization_domains d
    where d.organization_id = p_organization_id and d.is_primary
  );

  if v_primary then
    update public.organization_domains d
    set is_primary = false
    where d.organization_id = p_organization_id and d.is_primary;
  end if;

  insert into public.organization_domains (organization_id, hostname, is_primary)
  values (p_organization_id, v_host::extensions.citext, v_primary);
end;
$$;

revoke all on function public.assign_domain(uuid, text, boolean, uuid) from public, anon;
grant execute on function public.assign_domain(uuid, text, boolean, uuid) to authenticated;
