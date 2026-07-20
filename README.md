# Eventdex

Plataforma de eventos con mecánica de colección de medallas. Los asistentes escanean
códigos QR distribuidos por el predio ("spots"), inician sesión y coleccionan medallas;
al final del evento un organizador ejecuta un sorteo entre los participantes.

Monorepo gestionado con [Turborepo](https://turborepo.dev/) y [pnpm](https://pnpm.io/).

## Estructura

```
apps/
  event/        App pública del evento (Next.js 16, App Router)
packages/       (reservado para código compartido: tipos, dominio, UI)
```

### `apps/event`

| Ruta            | Descripción                                                        |
| --------------- | ------------------------------------------------------------------ |
| `/`             | Landing del evento con cuenta regresiva                            |
| `/spot/[id]`    | Reclamo de medalla vía QR (requiere login con Google)             |
| `/perfil`       | Medallas obtenidas vs. bloqueadas del usuario                      |
| `/raffle`       | Panel de sorteo (solo organizadores)                              |

**Stack:** Next.js 16 · React 19 · Supabase (SSR + Auth Google) · Tailwind v4 ·
shadcn/ui · Luxon.

## Requisitos

- Node.js >= 24
- pnpm 11

## Puesta en marcha

```sh
pnpm install
```

Copiá el archivo de ejemplo de variables de entorno y completá los valores:

```sh
cp apps/event/.env.example apps/event/.env
```

| Variable                              | Descripción                                          |
| ------------------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`            | URL del proyecto Supabase                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`| Clave pública (publishable) de Supabase              |
| `SUPABASE_SERVICE_ROLE_KEY`           | Clave service-role (solo servidor)                   |
| `EVENTDEX_ORGANIZATION_ID`            | ID de la organización dueña del evento               |
| `EVENTDEX_EVENT_ID`                   | ID del evento que sirve este deployment              |

## Scripts

Desde la raíz del monorepo:

```sh
pnpm dev           # Levanta las apps en modo desarrollo
pnpm build         # Build de producción
pnpm lint          # Lint (Biome)
pnpm check-types   # Chequeo de tipos
pnpm format        # Formatea con Prettier
```
