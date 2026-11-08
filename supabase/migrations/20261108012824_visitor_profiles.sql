-- R5 · bloque 3: el equipo ve el perfil de quien se registró en sus eventos
-- (nombre y mail en /[org]/eventos/[evento]/visitantes). Nada más: un visitante
-- que no se registró en un evento de la org sigue invisible para ella.

drop policy profiles_select on public.profiles;

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select app.is_developer())
    or exists (
      select 1 from public.organization_members m
      where m.user_id = profiles.id and (select app.is_org_member(m.organization_id))
    )
    or exists (
      select 1 from public.event_registrations r
      where r.user_id = profiles.id and (select app.is_org_member(r.organization_id))
    )
  );
