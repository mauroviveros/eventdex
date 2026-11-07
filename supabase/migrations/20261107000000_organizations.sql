-- R1 · Organizaciones y acceso
--
-- Identidad (profiles, platform_admins), tenancy (organizations, domains,
-- members, invitations), auditoría y los helpers de RLS en `app`.
-- Las decisiones viven en docs/PROYECTO.md (modelo) y docs/ARQUITECTURA.md (RLS).

create extension if not exists citext with schema extensions;

create type public.organization_status as enum ('active', 'suspended');
create type public.organization_role as enum ('owner', 'staff');

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

create function app.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: espejo de auth.users, creado por trigger al registrarse
-- ---------------------------------------------------------------------------

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        extensions.citext not null,
  full_name    text not null default '',
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function app.set_updated_at();

-- Corre sin sesión (el usuario recién se crea), por eso security definer.
create function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- ---------------------------------------------------------------------------
-- platform_admins: el rol developer. Tabla aparte porque el acceso es
-- cross-organización. Se otorga a mano por SQL, nunca desde la app.
-- ---------------------------------------------------------------------------

create table public.platform_admins (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  notes      text,
  granted_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

create table public.organizations (
  id               uuid primary key default gen_random_uuid(),
  slug             extensions.citext not null unique,
  name             text not null,
  -- Solo el color: la rampa de cuatro tonos sale de acá (src/domain/palette.ts).
  brand_color      text,
  logo_path        text,
  default_timezone text not null default 'America/Argentina/Buenos_Aires',
  status           public.organization_status not null default 'active',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz,
  deleted_at       timestamptz,

  constraint organizations_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  constraint organizations_name_length check (char_length(name) between 2 and 120),
  constraint organizations_brand_color_format check (brand_color ~ '^#[0-9a-fA-F]{6}$')
);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- organization_domains: resolución multi-tenant por host
-- ---------------------------------------------------------------------------

create table public.organization_domains (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  hostname        extensions.citext not null unique,
  is_primary      boolean not null default false,
  created_at      timestamptz not null default now(),

  -- Host con puerto opcional (local: expo.localhost:3000). Sin esquema ni path.
  constraint organization_domains_hostname_format
    check (hostname ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:[0-9]{2,5})?$')
);

create unique index organization_domains_one_primary
  on public.organization_domains (organization_id)
  where is_primary;

create index organization_domains_org_idx on public.organization_domains (organization_id);

-- ---------------------------------------------------------------------------
-- organization_members: solo miembros activos. Quitar a alguien es borrar la
-- fila; el rastro queda en audit_logs.
-- ---------------------------------------------------------------------------

create table public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  role            public.organization_role not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,

  unique (organization_id, user_id)
);

-- La pregunta caliente de RLS: "¿este usuario es de esta org?".
create index organization_members_user_org_idx
  on public.organization_members (user_id, organization_id);

create trigger organization_members_set_updated_at
  before update on public.organization_members
  for each row execute function app.set_updated_at();

-- Una organización nunca se queda sin owner. Se hace cumplir en la base porque
-- la interfaz se puede saltear. El borrado en cascada de la org entera pasa.
create function app.prevent_last_owner_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Postgres borra la org antes que sus hijos: si ya no está, viene de arriba.
  if not exists (select 1 from public.organizations where id = old.organization_id) then
    return coalesce(new, old);
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

create trigger organization_members_keep_owner
  before update or delete on public.organization_members
  for each row execute function app.prevent_last_owner_removal();

-- ---------------------------------------------------------------------------
-- organization_invitations: el owner todavía no tiene cuenta cuando se crea la
-- org, así que se lo invita por mail. La membresía nace al aceptar.
-- ---------------------------------------------------------------------------

create table public.organization_invitations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email           extensions.citext not null,
  role            public.organization_role not null,
  invited_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default now() + interval '14 days',
  accepted_at     timestamptz
);

-- Una invitación abierta por persona y organización.
create unique index organization_invitations_one_open
  on public.organization_invitations (organization_id, email)
  where accepted_at is null;

create index organization_invitations_email_idx
  on public.organization_invitations (email)
  where accepted_at is null;

-- ---------------------------------------------------------------------------
-- audit_logs: append-only. Toda acción sensible (y toda acción cross-org del
-- developer) deja una fila. Solo se escribe desde funciones, vía app.audit().
-- ---------------------------------------------------------------------------

create table public.audit_logs (
  id              bigint generated always as identity primary key,
  organization_id uuid references public.organizations (id) on delete set null,
  actor_id        uuid references public.profiles (id) on delete set null,
  action          text not null,
  entity_type     text not null,
  entity_id       uuid,
  diff            jsonb,
  created_at      timestamptz not null default now()
);

create index audit_logs_org_time_idx on public.audit_logs (organization_id, created_at desc);

create function app.audit(
  p_organization_id uuid,
  p_action          text,
  p_entity_type     text,
  p_entity_id       uuid,
  p_diff            jsonb default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, diff)
  values (p_organization_id, (select auth.uid()), p_action, p_entity_type, p_entity_id, p_diff);
$$;

-- ---------------------------------------------------------------------------
-- Helpers de RLS. security definer para leer membresías sin disparar RLS
-- recursivo; stable para que (select ...) los evalúe una vez por consulta.
-- ---------------------------------------------------------------------------

create function app.is_developer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.platform_admins where user_id = (select auth.uid()));
$$;

create function app.org_role(p_organization_id uuid)
returns public.organization_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.organization_members
  where organization_id = p_organization_id and user_id = (select auth.uid());
$$;

create function app.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select app.org_role(p_organization_id)) is not null;
$$;

create function app.is_org_owner(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select app.org_role(p_organization_id)) = 'owner';
$$;

-- El mail del usuario actual, leído de auth.users y no del JWT.
create function app.current_email()
returns extensions.citext
language sql
stable
security definer
set search_path = ''
as $$
  select email::extensions.citext from auth.users where id = (select auth.uid());
$$;

revoke all on all functions in schema app from public;
grant execute on all functions in schema app to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Acciones atómicas (RPC)
-- ---------------------------------------------------------------------------

-- Alta de organización: solo el developer. Crea la org, su primer dominio y la
-- invitación del owner en una sola transacción.
create function public.create_organization(
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
  v_org uuid;
begin
  if not (select app.is_developer()) then
    raise exception 'Solo el developer puede crear organizaciones'
      using errcode = 'insufficient_privilege';
  end if;

  insert into public.organizations (slug, name)
  values (lower(trim(p_slug)), trim(p_name))
  returning id into v_org;

  insert into public.organization_domains (organization_id, hostname, is_primary)
  values (v_org, lower(trim(p_hostname)), true);

  insert into public.organization_invitations (organization_id, email, role, invited_by)
  values (v_org, lower(trim(p_owner_email)), 'owner', (select auth.uid()));

  perform app.audit(v_org, 'organization.created', 'organization', v_org,
    jsonb_build_object('slug', p_slug, 'hostname', p_hostname, 'owner_email', p_owner_email));

  return v_org;
end;
$$;

-- Aceptar una invitación: el mail de la cuenta tiene que coincidir con el
-- invitado. Devuelve la organización.
create function public.accept_invitation(p_invitation_id uuid)
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
     or v_inv.email <> (select app.current_email()) then
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

revoke all on function public.create_organization(text, text, text, text) from public, anon;
revoke all on function public.accept_invitation(uuid) from public, anon;
grant execute on function public.create_organization(text, text, text, text) to authenticated;
grant execute on function public.accept_invitation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS. Toda tabla con RLS; sin política = cero filas.
-- ---------------------------------------------------------------------------

alter table public.profiles                 enable row level security;
alter table public.platform_admins          enable row level security;
alter table public.organizations            enable row level security;
alter table public.organization_domains     enable row level security;
alter table public.organization_members     enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.audit_logs               enable row level security;

-- profiles: uno mismo, los compañeros de organización y el developer.
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select app.is_developer())
    or exists (
      select 1 from public.organization_members m
      where m.user_id = profiles.id and (select app.is_org_member(m.organization_id))
    )
  );

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- El mail viene de auth.users: el usuario edita solo cómo se muestra.
revoke update on public.profiles from authenticated;
grant update (full_name, display_name, avatar_url) on public.profiles to authenticated;

-- platform_admins: solo se ven entre ellos. Sin escritura desde la app.
create policy platform_admins_select on public.platform_admins
  for select to authenticated
  using ((select app.is_developer()));

-- organizations: las activas son públicas (la app pública las necesita); el
-- equipo ve la suya aunque esté suspendida; el developer ve todas.
create policy organizations_select_public on public.organizations
  for select to anon, authenticated
  using (status = 'active' and deleted_at is null);

create policy organizations_select_team on public.organizations
  for select to authenticated
  using ((select app.is_org_member(id)) or (select app.is_developer()));

-- El owner edita su org, pero solo las columnas de abajo (grant por columna):
-- slug, estado y baja quedan para el developer vía funciones.
create policy organizations_update_owner on public.organizations
  for update to authenticated
  using ((select app.is_org_owner(id)))
  with check ((select app.is_org_owner(id)));

revoke update on public.organizations from authenticated;
grant update (name, brand_color, logo_path, default_timezone) on public.organizations to authenticated;

-- organization_domains: el lookup por host es público (no dice nada que el DNS
-- no diga). Escriben el owner y el developer.
create policy organization_domains_select on public.organization_domains
  for select to anon, authenticated
  using (true);

create policy organization_domains_write on public.organization_domains
  for all to authenticated
  using ((select app.is_org_owner(organization_id)) or (select app.is_developer()))
  with check ((select app.is_org_owner(organization_id)) or (select app.is_developer()));

-- organization_members: se ven entre miembros; el owner administra. Nadie se
-- agrega a sí mismo: eso pasa solo por accept_invitation().
create policy organization_members_select on public.organization_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select app.is_org_member(organization_id))
    or (select app.is_developer())
  );

create policy organization_members_update_owner on public.organization_members
  for update to authenticated
  using ((select app.is_org_owner(organization_id)))
  with check ((select app.is_org_owner(organization_id)));

-- Solo se cambia el rol: nadie mueve una membresía a otra persona u org.
revoke update on public.organization_members from authenticated;
grant update (role) on public.organization_members to authenticated;

create policy organization_members_delete_owner on public.organization_members
  for delete to authenticated
  using ((select app.is_org_owner(organization_id)));

-- organization_invitations: el owner y el developer las administran; el
-- invitado ve las suyas para poder aceptarlas.
create policy organization_invitations_select on public.organization_invitations
  for select to authenticated
  using (
    (select app.is_org_owner(organization_id))
    or (select app.is_developer())
    or email = (select app.current_email())
  );

create policy organization_invitations_insert on public.organization_invitations
  for insert to authenticated
  with check (
    ((select app.is_org_owner(organization_id)) or (select app.is_developer()))
    and invited_by = (select auth.uid())
    and accepted_at is null
  );

create policy organization_invitations_delete on public.organization_invitations
  for delete to authenticated
  using ((select app.is_org_owner(organization_id)) or (select app.is_developer()));

-- audit_logs: lectura para el developer y para el owner de esa org. Sin
-- escritura directa: solo app.audit() desde funciones.
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using ((select app.is_developer()) or (select app.is_org_owner(organization_id)));
