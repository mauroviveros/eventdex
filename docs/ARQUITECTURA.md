# Eventdex — Arquitectura

`v0.2 · 2026-11-06` · Relacionados: [PROYECTO](./PROYECTO.md) · [RUTAS](./RUTAS.md) · [ROADMAP](./ROADMAP.md) · [AGENTS](../AGENTS.md)

> Decide sobre lo técnico. Lo que no está acá no está decidido: se agrega en el
> mismo cambio que lo introduce.

## Stack

> **Estado: propuesto.** Esta es la decisión más grande del documento. Se cierra
> cuando lo apruebes; después cambiarla cuesta una reescritura.

### Recomendación: una sola app Next.js

| Capa | Elección | Por qué |
|------|----------|---------|
| Framework | **Next.js 16** (App Router, React 19, Server Actions) | Un runtime para las cuatro superficies |
| Datos y auth | **Supabase** (Postgres, RLS, Auth, Storage) con `@supabase/ssr` | Ya probado en la v2; RLS como barrera real |
| Estilos | **Tailwind v4** con tokens en CSS | Los tokens salen de [DESIGN](./DESIGN.md) |
| Componentes | **shadcn/ui** como base, adaptados al design system | Son código propio, no una dependencia |
| Validación | **Zod** | Un esquema por acción, en el borde del servidor |
| Fechas | **`Intl` nativo** + `@date-fns/tz` si hace falta aritmética con zonas | Formatear con zona no necesita una librería |
| QR | **`uqr`** (`encode()` → matriz; el SVG lo dibuja `QrCode` en el servidor) | Sin dependencias; impresión nítida a cualquier tamaño, sin JS en el navegador. Elegida en R3 sobre `qrcode`, que pesa más para lo mismo |
| Paquetes | **pnpm**, un solo `package.json` | Sin Turborepo ni packages internos |
| Hosting | **Vercel** | Dominios custom por organización contra un deployment |

**Por qué una sola app y no las tres de la v2:**

1. **Una sola sesión.** La v2 resolvía cookies y auth en Astro y en Next por
   separado. Ahora hay un solo `createClient` para servidor y uno para cliente.
2. **Un solo design system.** El objetivo de mejorar mucho el diseño en todas las
   superficies es más barato con un `components/` compartido que con tres apps.
3. **Sin monorepo.** Turborepo y los packages `db`, `domain` y `supabase` existían
   para compartir código entre apps. Con una app, pasan a ser carpetas.
4. **Las cuatro superficies se separan por host** en `proxy.ts` (ver
   [Multi-tenancy](#multi-tenancy)), no por deployment.

### Alternativa descartada: Astro para lo público, con un monorepo mínimo

Ganaría algo de peso en la app del visitante (HTML casi sin JS). Se descarta porque
vuelve el problema de las dos sesiones y los dos sistemas de componentes, y porque
Next con Server Components ya manda poco JS cuando la página no lo necesita. Si
algún día la app pública pesa demasiado, se mide primero y recién ahí se reabre.

## Estructura

```
src/
├── app/
│   ├── publica/[host]/  App del evento, por dominio de la org
│   ├── admin/           Admin de la organización
│   │   └── plataforma/  Panel del developer
│   ├── landing/         eventdex.com
│   ├── auth/            Callback y salida, compartidos
│   └── dev/             Rutas solo de desarrollo (/dev/componentes)
├── components/
│   ├── ui/              Primitivas (shadcn adaptadas)
│   └── <dominio>/       Medalla, progreso, countdown, QR…
├── lib/
│   ├── supabase/        Clientes servidor / navegador / servicio
│   ├── data/            Lecturas por entidad (una función por consulta)
│   └── actions/         Server Actions con validación Zod
├── domain/              Lógica pura: fase, elegibilidad, resolución de spots
├── proxy.ts             Host → superficie y organización
supabase/
├── migrations/          Fuente de verdad del esquema
├── tests/               pgTAP: permisos por tabla y rol
└── seed.sql             Datos locales reales de ejemplo, no de producción
```

Regla dura: **`src/domain/` no importa Supabase, React ni Next.** Es lógica pura
que se prueba sin mocks.

## Backend y datos

- **Postgres en Supabase.** El esquema vive en `supabase/migrations/` y se crea con
  `supabase migration new`. Nunca se edita una migración ya aplicada en producción.
- **Tipos generados** con `supabase gen types` a `src/lib/supabase/database.types.ts`.
  Se regeneran en el mismo cambio que la migración.
- **Lecturas** en `src/lib/data/`, desde Server Components. **Escrituras** con
  Server Actions en `src/lib/actions/`: validan con Zod, llaman a Supabase con la
  sesión del usuario y devuelven `{ ok, error }`, sin tirar excepciones a la vista.
  El tipo `ActionResult` y la traducción de los códigos de Postgres a mensajes
  viven en `src/lib/results.ts`. La lógica de cada acción (validar, escribir,
  traducir errores) va en `src/lib/<área>.ts` con sus tests; la Server Action solo
  le suma la sesión, la caché y la redirección. Las del panel de la org comparten
  `runFormWrite` y `FormState` (`src/lib/actions/form.ts`).
- **Operaciones atómicas en SQL.** Reclamar una medalla, publicar un evento y sacar
  una extracción del sorteo son funciones Postgres (`rpc`), no varias queries
  desde JS.
- **Reclamar al abrir el QR.** `claim_spot()` es idempotente, así que `/s/[id]`
  reclama al renderizar, sin botón ni Server Action de por medio: volver a abrir
  el link solo responde "ya la tenías". Antes comprueba que el QR sea de la org
  del dominio (`getClaimTarget`); si no, es un 404 y no una medalla.

### Convenciones del esquema

| Regla | Ejemplo |
|-------|---------|
| Tablas en plural, `snake_case` | `event_spots` |
| PK `id uuid default gen_random_uuid()` | — |
| FK `<tabla_singular>_id` | `venue_id` |
| Timestamps `timestamptz` con sufijo `_at` | `published_at` |
| Booleanos con prefijo `is_` / `has_` | `is_primary` |
| Enums en minúscula | `'draft'` |
| Baja lógica con `deleted_at` | — |
| Dinero en centavos (`bigint`) | `amount_cents` |
| **Toda tabla de tenant lleva `organization_id`** | Hace que cada política sea un índice simple |

### Permisos (RLS)

- RLS habilitado en **todas** las tablas de `public`. Sin políticas = cero filas.
- Helpers `security definer`, `stable`, con `set search_path = ''` en un esquema
  `app` que no se expone por la API (`app.is_org_member(org)`, `app.is_developer()`…).
- Toda función dentro de una política va envuelta en `(select …)`, para que se
  evalúe una vez por consulta y no una vez por fila.
- Índice sobre cada columna que aparezca en una política.
- Vistas con `security_invoker = true`.
- **Clave de servicio solo donde no hay usuario:** alta de organización, triggers,
  jobs y migración de datos. Si una pantalla la necesita, falta una política.

## Auth

- **Supabase Auth con Google OAuth.** Si se suma otro método para el visitante,
  se decide en la rebanada correspondiente ([PROYECTO](./PROYECTO.md#preguntas-abiertas)).
- **La sesión es por dominio.** El visitante inicia sesión en el dominio de la
  organización, y el staff en el del admin. Cada dominio tiene su cookie; no se
  comparte sesión entre dominios.
- La URL de callback es siempre `/auth/callback` en el host actual. En Supabase,
  las Redirect URLs llevan cada dominio de organización (se agrega al dar de alta
  el dominio) más el del admin.
- **Modo soporte:** el developer puede abrir el panel de cualquier org. Es solo
  lectura porque RLS no le da políticas de escritura sobre los datos de las orgs
  (solo dominios, invitaciones y facturación), y cada apertura queda en
  `audit_logs` (`support.viewed`). El registro lo dispara el navegador al abrir el
  panel, una vez por visita: Next renderiza los layouts al hacer prefetch de un link
  y eso no es una visita. Cada tabla nueva decide si el developer la lee.
- Los roles se resuelven en la base (RLS). En el servidor, `proxy.ts` y los
  layouts solo deciden redirecciones; nunca son la única barrera.

## Multi-tenancy

`proxy.ts` lee el `Host` y reescribe la ruta a la carpeta de su superficie
(`src/lib/surface.ts`, con tests). Son carpetas y no grupos `( )` porque las
cuatro superficies tienen su propia `/`. Como todo pasa por el proxy, esas
carpetas nunca se alcanzan directo (`expo.com/admin` es un 404):

| Host | Superficie |
|------|-----------|
| `NEXT_PUBLIC_ROOT_DOMAIN` (y `www.`) | `landing/` |
| `NEXT_PUBLIC_ADMIN_HOST`, o `app.` + el dominio raíz | `admin/` |
| el host del admin + `/plataforma` | `admin/plataforma/`, solo para developers |
| cualquier otro | `publica/[host]/`, con la organización resuelta por `organization_domains` |

- El mapeo host → organización es una función SQL (`resolve_organization`, una sola
  consulta; un host desconocido o una org suspendida no devuelven nada). La llama el
  layout de `publica/[host]/`, no el proxy: el proxy solo enruta, la org llega entera
  a las páginas y un host desconocido es un 404 de verdad. El resultado se cachea
  entre requests e instancias (`unstable_cache`, tag `organizations`, 1 minuto),
  porque cambia casi nunca. Toda acción que cambie una org (nombre, marca, estado)
  o sus dominios llama a `invalidateOrganizations()`; lo que se cambia por SQL se
  ve en menos de un minuto. Se lee con un cliente
  anónimo sin sesión (`src/lib/supabase/public.ts`), igual para todos.
- **En local** se usan subdominios de `localhost`, que los navegadores resuelven
  solos: `localhost:3000` es la landing, `app.localhost:3000` el admin y
  `expo.localhost:3000` una organización de seed. No hay que tocar `/etc/hosts`.
- En Vercel, cada dominio de organización se agrega al proyecto. **Shortcut**: al
  principio se hace a mano desde el dashboard de Vercel; se automatiza con la API
  de dominios cuando haya más de un puñado de organizaciones.

## Entornos

| Entorno | Base | App | Para qué |
|---------|------|-----|----------|
| **Local** | Supabase local (`pnpm db:start`, Docker) en los puertos **544xx** (API `54421`, base `54422`, Studio `54423`), corridos para no chocar con otros proyectos en los 543xx por defecto | `pnpm dev` | Desarrollo y tests, con migraciones y seed |
| **Producción** | Proyecto Supabase de producción | Vercel (`main`) | Usuarios reales |

- Los previews de Vercel **no** tocan la base de producción. **Shortcut**: los
  previews se usan solo para revisar UI con login deshabilitado; si hace falta
  probar con datos, se suma un proyecto de staging.
- Las migraciones llegan a producción con `pnpm db:push` desde `main`, a mano,
  después de que pasan en local (`--dry-run` muestra qué aplicaría).

## Claves y variables

| Variable | Dónde | Notas |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Todos | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Todos | Respeta RLS |
| `SUPABASE_SECRET_KEY` | Servidor | Se saltea RLS. Solo en `lib/supabase/service.ts` |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Todos | `eventdex.vercel.app` en prod, `localhost:3000` en local |
| `NEXT_PUBLIC_ADMIN_HOST` | Producción | `eventdex-admin.vercel.app`. Opcional: sin ella, `app.` + el dominio raíz |

- `.env.example` documenta todas, sin valores reales. `.env.local` no se commitea.
- Las variables se validan al arrancar con Zod: si falta una, falla el arranque y
  no el primer request.

## Calidad

| Herramienta | Qué cubre |
|-------------|-----------|
| **Biome** | Lint y formato |
| **`tsc --noEmit`** | Tipos |
| **Vitest** | `src/domain/`, acciones y utilidades |
| **pgTAP** (`supabase test db`) | Permisos: qué ve y qué puede hacer cada rol en cada tabla |
| **Playwright** | Recorridos completos por rebanada (escanear → medalla, sortear…) |

Mínimo por rebanada: tests de permisos para cada tabla nueva, un test de cada
acción con su caso de error y un recorrido de Playwright.

## CI

GitHub Actions (`.github/workflows/ci.yml`), en cada PR a `main` y en cada push a
`main`. Dos jobs en paralelo, los dos con `pnpm install --frozen-lockfile`:

- **`app`**: `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build`.
- **`db`**: `supabase db start` (solo Postgres, con migraciones y seed) →
  `pnpm db:test` (permisos con pgTAP).

Playwright corre en local, antes de cerrar cada rebanada (`pnpm test:e2e`, con
`pnpm db:start`). Cada recorrido siembra su propia org en un host nuevo
(`e2e-<id>.localhost:3000`) con la clave secreta local, entra con el link por mail
de desarrollo (leído de Mailpit) y la borra al terminar. Pasa a CI cuando el job
pueda levantar Supabase completo (auth y Mailpit) y la app.

## Hosting

- **Vercel**, un proyecto, con `main` como producción.
- Dominios: `eventdex.vercel.app` (landing), `eventdex-admin.vercel.app` (admin y
  plataforma) y uno o más por organización. Un `*.vercel.app` no admite subdominios,
  por eso el admin va aparte. Al comprar un dominio propio solo cambian las dos
  variables.
- Las imágenes (logos, portadas, avatares de spots) van en **Supabase Storage**, en
  buckets con políticas por organización. `org-logos` es público para leer, solo
  el owner escribe bajo la carpeta `{organization_id}/`, hasta 1 MiB y sin SVG (un
  SVG servido desde el bucket puede ejecutar scripts). El logo sube por Server
  Action, por eso `serverActions.bodySizeLimit` es de 2 MB. `spot-logos` tiene los
  mismos límites, cualquier miembro de la org sube bajo su carpeta y los archivos
  no se reemplazan ni se borran: el snapshot de un evento publicado puede usarlos.

## Corte a producción (hecho el 2026-11-08)

El proyecto de Supabase de producción es el de la v1: el plan gratis no da para uno
más. La v2 nunca llegó a producción. El esquema nuevo convive con la v1 así, y se
ensayó entero con una copia real (permisos iguales a un proyecto limpio, pgTAP y un
usuario de la v1 reclamando una medalla):

1. Backup con `supabase db dump`, fuera del repo: tiene datos personales.
2. `supabase link` y `pnpm db:push --dry-run`, que no aplica nada.
3. `scripts/migrate/01_move_v1_aside.sql` en el SQL Editor: `public` pasa a llamarse
   `v1`, sin perder filas, y queda una `public` vacía. Desde acá la app v1 no funciona.
4. `pnpm db:push`.
5. `scripts/migrate/02_backfill_profiles.sql`: un perfil por cada usuario de la v1;
   el trigger de altas solo ve los nuevos.
6. Alta del developer en `platform_admins`.

Si algo sale mal, `scripts/migrate/01_rollback.sql` borra lo nuevo y devuelve la v1.

## Migración de datos (al final)

Es la última rebanada del [ROADMAP](./ROADMAP.md). La fuente es el esquema `v1` del
mismo proyecto, cerrado a la API. Los usuarios ya están en `auth.users` con sus ids
y sus perfiles salieron del backfill del corte: no se migran. La v2 no llegó a
producción y su código queda en el tag `v2-legacy`.

- **`scripts/migrate/03_import_v1.sql`**: `insert … select` desde `v1`, en una sola
  transacción y con `on conflict do nothing`. SQL y no Node porque `v1` no se expone
  por la API y son unas 2500 filas.
- **`scripts/migrate/04_copy_spot_logos.mjs`**: los logos no se copian por SQL. Los
  pasa con la API de Storage y la clave de servicio, del bucket `spot` de la v1 a
  `spot-logos`. Va después del 03 y también se puede repetir.
- Primero contra la base local con una copia del backup, después contra producción.

### Mapeo desde la v1

Conteos del backup del corte (2026-11-08).

| v1 | Filas | Destino | Filas | Cómo |
|---|---|---|---|---|
| `organizations` | 1 | `organizations` | 0 | Ya existe en producción, vacía: `lodecharlytcg`, con mejor nombre y el mismo dominio. No se toca; todo lo de la v1 se cuelga de su id |
| `organizations.domain` | 1 | `organization_domains` | 0 | `evento.lodecharlytcg.com` ya está cargado como principal |
| `organization_members` | 3 | `organization_members` | 2 | `ADMIN` → `owner`: en la v1 podía hacer todo. Uno de los tres ya es owner de la org |
| `events` | 5 | `events` | 4 | Mismo id. Publicados y públicos, `published_at` = `created_at`. `edition` → `edition_label`. Slug de título + edición (`burning-tower-fest-mayo-2026`) |
| `event_locations` | 5 | `venues` | 3 | Una por nombre: dos ediciones comparten sede. `Argentina` → `AR`. Sin latitud ni longitud |
| `event_schedules` | 5 | `event_schedules` | 4 | Id nuevo, derivado del viejo para que correr dos veces no duplique |
| `event_spots` | 71 | `event_spots` | 70 | Mismo id. `code` secuencial por evento en orden de alta (`A01`). El `snapshot` guarda nombre, descripción y logo de esa edición |
| `event_spots` | 71 | `spots` (catálogo) | 58 | Uno por nombre, sin distinguir mayúsculas; 8 se repiten entre ediciones y queda la más reciente. `LOCAL` → `stand` |
| `event_spots.avatar_path` | 70 | bucket `spot-logos` | 70 | Un archivo por edición, bajo `{organization_id}/`. Ninguno pasa de 1 MiB |
| `user_spot_history` | 1650 | `spot_claims` | 1649 | `collected_at` → `claimed_at` |
| — | — | `event_registrations` | 703 | Una por visitante y evento, con fecha de su primera medalla. La v1 no las tenía |

**Se descarta:**

- El evento de prueba `temp_20260807`, ya borrado en la v1, con su sede, su spot y su
  única medalla.
- `profiles` de la v1 (1 fila): los perfiles ya salieron de `auth.users`.
- `raffle_winners` (0 filas) y `events.config`, que repite título y descripción.
- `event_spots.location` (vacío en todos), 3 archivos del bucket `spot` que ningún
  spot usa, y la latitud y longitud de las sedes.
- Las URLs viejas `/spot/[id]`: los cuatro eventos ya terminaron. Los spots conservan
  su id, así que `/s/[id]` responde con el spot correcto.

El script aborta sin escribir nada si la org `lodecharlytcg` no existe.

## Preguntas abiertas

1. **Stack**: confirmar la recomendación de una sola app Next.
2. **Sesión del staff en el dominio de la org**: si un staff abre la app pública
   de su evento, ¿necesita verla logueado como staff? Hoy cada dominio tiene su
   propia sesión.
3. **Staging**: ¿hace falta desde el principio o se suma cuando un preview lo pida?
4. **Imágenes**: ¿alcanza con el transformador de imágenes de Supabase, o se usa
   `next/image` con Vercel?
5. ~~**Migración**~~: decidido, los usuarios de la v1 quedan en el mismo proyecto y
   conservan sus ids. La v2 no llegó a producción.
