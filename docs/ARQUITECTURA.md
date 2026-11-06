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
| QR | **`qrcode`** (genera SVG en el servidor) | Impresión nítida a cualquier tamaño |
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
- **Operaciones atómicas en SQL.** Reclamar una medalla, publicar un evento y sacar
  una extracción del sorteo son funciones Postgres (`rpc`), no varias queries
  desde JS.

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
- Los roles se resuelven en la base (RLS). En el servidor, `proxy.ts` y los
  layouts solo deciden redirecciones; nunca son la única barrera.

## Multi-tenancy

`proxy.ts` lee el `Host` y reescribe la ruta a la carpeta de su superficie
(`src/lib/surface.ts`, con tests). Son carpetas y no grupos `( )` porque las
cuatro superficies tienen su propia `/`. Como todo pasa por el proxy, esas
carpetas nunca se alcanzan directo (`expo.com/admin` es un 404):

| Host | Superficie |
|------|-----------|
| `eventdex.com`, `www.eventdex.com` | `landing/` |
| `app.eventdex.com` | `admin/` |
| `app.eventdex.com/plataforma` | `admin/plataforma/`, solo para developers |
| cualquier otro | `publica/[host]/`, con la organización resuelta por `organization_domains` |

- El mapeo host → organización es una función SQL. El resultado se cachea, porque
  cambia casi nunca.
- **En local** se usan subdominios de `localhost`, que los navegadores resuelven
  solos: `localhost:3000` es la landing, `app.localhost:3000` el admin y
  `expo.localhost:3000` una organización de seed. No hay que tocar `/etc/hosts`.
- En Vercel, cada dominio de organización se agrega al proyecto. **Shortcut**: al
  principio se hace a mano desde el dashboard de Vercel; se automatiza con la API
  de dominios cuando haya más de un puñado de organizaciones.

## Entornos

| Entorno | Base | App | Para qué |
|---------|------|-----|----------|
| **Local** | Supabase local (`supabase start`, Docker) | `pnpm dev` | Desarrollo y tests, con migraciones y seed |
| **Producción** | Proyecto Supabase de producción | Vercel (`main`) | Usuarios reales |

- Los previews de Vercel **no** tocan la base de producción. **Shortcut**: los
  previews se usan solo para revisar UI con login deshabilitado; si hace falta
  probar con datos, se suma un proyecto de staging.
- Las migraciones llegan a producción con `supabase db push` desde `main`, a mano,
  después de que pasan en local.

## Claves y variables

| Variable | Dónde | Notas |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Todos | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Todos | Respeta RLS |
| `SUPABASE_SECRET_KEY` | Servidor | Se saltea RLS. Solo en `lib/supabase/service.ts` |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Todos | `eventdex.com` en prod, `localhost:3000` en local |

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

GitHub Actions, en cada push y en cada PR a `main`:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `supabase start` + `supabase test db` (permisos)
6. `pnpm build`

Playwright corre en CI recién cuando haya un recorrido que valga la pena: al
principio corre en local, antes de cerrar cada rebanada.

## Hosting

- **Vercel**, un proyecto, con `main` como producción.
- Dominios: `eventdex.com` (landing), `app.eventdex.com` (admin y plataforma) y
  uno o más por organización.
- Las imágenes (logos, portadas, avatares de spots) van en **Supabase Storage**, en
  buckets con políticas por organización.

## Migración de datos (al final)

Es la última rebanada del [ROADMAP](./ROADMAP.md). La estrategia:

1. Dump de solo lectura de las bases v1 y v2.
2. Un script en `scripts/migrate/` (Node, con la clave de servicio) que lee los
   dumps, transforma al esquema nuevo e inserta de forma idempotente (se puede
   correr dos veces sin duplicar).
3. Primero contra la base local, después contra producción.
4. El código de la v2 queda en el tag `v2-legacy` como referencia de los esquemas
   viejos.

## Preguntas abiertas

1. **Stack**: confirmar la recomendación de una sola app Next.
2. **Sesión del staff en el dominio de la org**: si un staff abre la app pública
   de su evento, ¿necesita verla logueado como staff? Hoy cada dominio tiene su
   propia sesión.
3. **Staging**: ¿hace falta desde el principio o se suma cuando un preview lo pida?
4. **Imágenes**: ¿alcanza con el transformador de imágenes de Supabase, o se usa
   `next/image` con Vercel?
5. **Migración**: ¿los usuarios de la v1 y la v2 están en proyectos Supabase
   distintos? Si es así, sus `auth.users` también se migran (con los mismos ids).
