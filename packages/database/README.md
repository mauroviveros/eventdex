# @eventdex/database

Tipos compartidos del esquema Supabase y DTOs de dominio, para no duplicarlos
entre apps (`apps/event` y la futura `apps/admin`).

- `src/database.ts` — tipos generados del esquema (regenerar con la CLI de Supabase).
- `src/event.ts` — tipo `Event` (evento con ubicación y horarios embebidos).
- `src/raffle.ts` — DTO `RaffleParticipant`.

Es un paquete **solo de tipos** (sin runtime): se consume importando desde
`@eventdex/database`. No requiere build; los tipos se resuelven vía el campo
`exports`/`types` del `package.json`.

> Los **clientes Supabase** se extraerán a `packages/supabase` cuando exista
> `apps/admin`, para que sus requisitos reales guíen la API.
