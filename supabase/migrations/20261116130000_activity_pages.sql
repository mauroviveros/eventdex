-- R32 · rediseño, bloque DB: la actividad paginada por cursor.
--
-- La actividad crece mientras se mira: con páginas por número, cada medalla nueva
-- correría las filas y una página repetiría o saltearía líneas. Se pagina por
-- cursor: cada fila trae su momento y su id, y la página siguiente pide las
-- anteriores a la última vista, (momento, id) < (p_before_at, p_before_id). El id
-- desempata dos filas del mismo instante. Sin total: quien llama pide una fila de
-- más para saber si hay otra página.
--
-- Los parámetros nuevos van al final: las llamadas de antes siguen andando.

drop function public.org_activity(uuid, uuid, integer);

create function public.org_activity(
  p_organization_id uuid,
  p_event_id        uuid default null,
  p_limit           integer default 30,
  -- 'medalla', 'premio' o 'sorteo'; null, todas.
  p_kind            text default null,
  -- El cursor: la última fila de la página anterior. Null, desde lo último; sin id,
  -- todo lo anterior a ese momento.
  p_before_at       timestamptz default null,
  p_before_id       uuid default null
)
returns table (
  id          uuid,
  happened_at timestamptz,
  kind        text,
  event_id    uuid,
  user_id     uuid,
  visitor     text,
  detail      text,
  is_first    boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  -- 101: una página de 100 más la fila que dice si hay otra.
  with lim as (select least(greatest(coalesce(p_limit, 30), 1), 101) as n)
  select * from (
    (select c.id, c.claimed_at, 'medalla', c.event_id, c.user_id,
            app.visitor_name(p.display_name, p.full_name),
            coalesce(es.name_override, es.snapshot ->> 'name', s.name),
            not exists (
              select 1 from public.spot_claims f
              where f.registration_id = c.registration_id and f.claimed_at < c.claimed_at
            )
     from public.spot_claims c
     join public.events e on e.id = c.event_id and e.deleted_at is null
     join public.event_spots es on es.id = c.event_spot_id
     left join public.spots s on s.id = es.spot_id
     left join public.profiles p on p.id = c.user_id
     where c.organization_id = p_organization_id
       and (p_event_id is null or c.event_id = p_event_id)
       and (p_kind is null or p_kind = 'medalla')
       and (p_before_at is null or (c.claimed_at, c.id) < (p_before_at, coalesce(p_before_id, '00000000-0000-0000-0000-000000000000'::uuid)))
     order by c.claimed_at desc, c.id desc
     limit (select n from lim))
    union all
    (select w.id, w.won_at, 'premio', w.event_id, w.user_id,
            app.visitor_name(p.display_name, p.full_name), a.title, false
     from public.award_winners w
     join public.event_awards a on a.id = w.award_id
     join public.events e on e.id = w.event_id and e.deleted_at is null
     left join public.profiles p on p.id = w.user_id
     where w.organization_id = p_organization_id
       and (p_event_id is null or w.event_id = p_event_id)
       and (p_kind is null or p_kind = 'premio')
       and (p_before_at is null or (w.won_at, w.id) < (p_before_at, coalesce(p_before_id, '00000000-0000-0000-0000-000000000000'::uuid)))
     order by w.won_at desc, w.id desc
     limit (select n from lim))
    union all
    -- Sin cuenta (borrada), queda el nombre congelado al extraer.
    (select d.id, d.drawn_at, 'sorteo', ra.event_id, d.winner_user_id,
            case when p.id is null then d.winner_name
                 else app.visitor_name(p.display_name, p.full_name) end,
            ra.title, false
     from public.raffle_draws d
     join public.raffles ra on ra.id = d.raffle_id
     join public.events e on e.id = ra.event_id and e.deleted_at is null
     left join public.profiles p on p.id = d.winner_user_id
     where d.organization_id = p_organization_id
       and d.voided_at is null
       and (p_event_id is null or ra.event_id = p_event_id)
       and (p_kind is null or p_kind = 'sorteo')
       and (p_before_at is null or (d.drawn_at, d.id) < (p_before_at, coalesce(p_before_id, '00000000-0000-0000-0000-000000000000'::uuid)))
     order by d.drawn_at desc, d.id desc
     limit (select n from lim))
  ) a (id, happened_at, kind, event_id, user_id, visitor, detail, is_first)
  order by happened_at desc, id desc
  limit (select n from lim)
$$;

revoke all on function public.org_activity(uuid, uuid, integer, text, timestamptz, uuid) from public, anon;
grant execute on function public.org_activity(uuid, uuid, integer, text, timestamptz, uuid) to authenticated;

-- Cada rama lee lo último de la org (o de un evento) en el orden del cursor.
create index spot_claims_org_recent_idx on public.spot_claims (organization_id, claimed_at desc, id desc);
create index spot_claims_event_recent_idx on public.spot_claims (event_id, claimed_at desc, id desc);
create index award_winners_org_recent_idx on public.award_winners (organization_id, won_at desc, id desc);
create index raffle_draws_org_recent_idx on public.raffle_draws (organization_id, drawn_at desc, id desc);
