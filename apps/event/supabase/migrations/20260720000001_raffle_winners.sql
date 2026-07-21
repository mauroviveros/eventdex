-- Persiste los ganadores del sorteo server-side (antes vivían solo en
-- localStorage del navegador del organizador). Es append-only: cada sorteo
-- completado agrega una fila, y el "ganador actual" es el más reciente por evento.
-- Esto da historial/auditoría (quién sorteó, cuándo) y sobrevive recargas/dispositivos.

create table if not exists public.raffle_winners (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id),
  user_id uuid not null,
  spot_count integer not null default 0,
  drawn_by uuid not null,
  drawn_at timestamptz not null default now()
);

-- El ganador actual se consulta como el más reciente del evento.
create index if not exists raffle_winners_event_drawn_idx
  on public.raffle_winners (event_id, drawn_at desc);

-- RLS activo sin políticas: la tabla queda accesible solo con la service key,
-- que se usa exclusivamente desde server actions ya validadas como organizador.
alter table public.raffle_winners enable row level security;
