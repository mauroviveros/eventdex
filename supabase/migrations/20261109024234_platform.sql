-- R8 · bloque 1: facturación manual, suspender una org y lectura de auditoría.
--
-- Una factura no se edita ni se borra: si está mal, se anula y se carga otra.
-- Solo cambia su estado, y cada paso queda en audit_logs.

create type public.invoice_status as enum ('pending', 'paid', 'void');
create type public.invoice_currency as enum ('ARS', 'USD');

create table public.invoices (
  id              uuid primary key default gen_random_uuid(),
  -- restrict: la facturación sobrevive a cualquier limpieza de una org.
  organization_id uuid not null references public.organizations (id) on delete restrict,
  -- Texto libre ("Expo 2026", "Noviembre"): sirve por evento y por período.
  concept         text not null check (char_length(trim(concept)) between 1 and 200),
  amount_cents    bigint not null check (amount_cents > 0),
  currency        public.invoice_currency not null,
  status          public.invoice_status not null default 'pending',
  issued_on       date not null default current_date,
  -- Lo escribe el trigger. Una factura anulada conserva cuándo se había pagado.
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),

  check (status <> 'paid' or paid_at is not null)
);

create index invoices_org_idx on public.invoices (organization_id, issued_on desc);

create function app.invoice_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform app.audit(
      new.organization_id, 'invoice.created', 'invoice', new.id,
      jsonb_build_object('concept', new.concept, 'amount_cents', new.amount_cents, 'currency', new.currency)
    );
    return new;
  end if;

  -- Repetir la marca (doble clic) no es un error ni un paso nuevo.
  if new.status = old.status then
    return new;
  end if;

  if old.status = 'void' or new.status = 'pending' then
    raise exception 'Una factura no puede pasar de % a %', old.status, new.status
      using errcode = 'check_violation';
  end if;

  if new.status = 'paid' then
    new.paid_at := now();
  end if;

  perform app.audit(
    new.organization_id,
    case new.status when 'paid' then 'invoice.paid' else 'invoice.voided' end,
    'invoice',
    new.id,
    jsonb_build_object('before', old.status, 'after', new.status)
  );
  return new;
end;
$$;

revoke all on function app.invoice_lifecycle() from public, anon, authenticated;

create trigger invoices_lifecycle
  before insert or update of status on public.invoices
  for each row execute function app.invoice_lifecycle();

alter table public.invoices enable row level security;

create policy invoices_select on public.invoices
  for select to authenticated
  using ((select app.is_developer()));

create policy invoices_insert on public.invoices
  for insert to authenticated
  with check ((select app.is_developer()));

create policy invoices_update on public.invoices
  for update to authenticated
  using ((select app.is_developer()))
  with check ((select app.is_developer()));

grant select on public.invoices to authenticated;
grant insert (organization_id, concept, amount_cents, currency, issued_on) on public.invoices to authenticated;
grant update (status) on public.invoices to authenticated;

-- ---------------------------------------------------------------------------
-- Suspender: función y no política, porque un update sobre organizations lo
-- pueden hacer los owners y el estado es solo del developer.
-- ---------------------------------------------------------------------------

create function public.set_organization_status(
  p_organization_id uuid,
  p_status          public.organization_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current public.organization_status;
begin
  if not (select app.is_developer()) then
    raise exception 'Solo el developer cambia el estado de una organización'
      using errcode = 'insufficient_privilege';
  end if;

  select status into v_current
    from public.organizations
    where id = p_organization_id
    for update;

  if not found then
    raise exception 'La organización no existe' using errcode = 'no_data_found';
  end if;

  if v_current = p_status then
    return;
  end if;

  update public.organizations set status = p_status where id = p_organization_id;

  perform app.audit(
    p_organization_id,
    case p_status when 'suspended' then 'organization.suspended' else 'organization.reactivated' end,
    'organization',
    p_organization_id,
    jsonb_build_object('before', v_current, 'after', p_status)
  );
end;
$$;

revoke all on function public.set_organization_status(uuid, public.organization_status) from public, anon;
grant execute on function public.set_organization_status(uuid, public.organization_status) to authenticated;

-- ---------------------------------------------------------------------------
-- Auditoría: la política ya deja leer al developer; falta poder listarla entera
-- por fecha sin pasar por el índice de cada org.
-- ---------------------------------------------------------------------------

create index audit_logs_time_idx on public.audit_logs (created_at desc);
