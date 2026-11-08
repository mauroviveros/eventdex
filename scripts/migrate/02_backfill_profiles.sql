-- Corte a producción, paso 2 de 2. Se corre UNA vez, después del primer
-- `pnpm db:push`. Es idempotente.
--
-- El trigger on_auth_user_created solo ve las altas nuevas: sin esto, un usuario
-- de la v1 entra pero no puede reclamar medallas (spot_claims llega a profiles
-- por FK). Misma lógica que app.handle_new_user.

insert into public.profiles (id, email, full_name, avatar_url)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', ''),
  raw_user_meta_data ->> 'avatar_url'
from auth.users
where email is not null
on conflict (id) do nothing;
