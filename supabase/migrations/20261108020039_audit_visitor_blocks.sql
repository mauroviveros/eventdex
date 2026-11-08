-- R5 · auditoría: bloquear o desbloquear a un visitante lo saca (o lo devuelve)
-- del sorteo, así que queda en audit_logs con quién y cuándo. Trigger y no
-- acción: lo registra venga de donde venga la escritura.

create function app.audit_registration_block()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.blocked_at is distinct from old.blocked_at then
    perform app.audit(
      new.organization_id,
      case when new.blocked_at is null then 'visitor.unblocked' else 'visitor.blocked' end,
      'event_registration',
      new.id,
      jsonb_build_object('event_id', new.event_id, 'user_id', new.user_id)
    );
  end if;
  return new;
end;
$$;

revoke all on function app.audit_registration_block() from public;

create trigger event_registrations_audit_block
  after update of blocked_at on public.event_registrations
  for each row execute function app.audit_registration_block();
