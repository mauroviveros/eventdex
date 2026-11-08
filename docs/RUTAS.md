# Eventdex — Rutas

`v0.1 · 2026-11-06` · Relacionados: [ARQUITECTURA](./ARQUITECTURA.md#multi-tenancy) · [PROYECTO](./PROYECTO.md#módulos) · [ROADMAP](./ROADMAP.md) · [DESIGN_SYSTEM](./DESIGN_SYSTEM.md)

> Decide qué pantallas existen. Una pantalla nueva se agrega acá en el mismo
> cambio que la crea. La columna **Rebanada** apunta al [ROADMAP](./ROADMAP.md).

## Convenciones de URL

- **En castellano**, en minúscula y con guiones: `/mis-medallas`, no `/myMedals`.
- **Sustantivos para las páginas**, nunca verbos: crear y editar son Server
  Actions, no rutas. Única excepción: `/nuevo` para el formulario de alta.
- **Slugs legibles en el admin** (`/expo-ubbe/eventos/expo-2026`). **`uuid` donde no
  se tiene que poder adivinar** (el QR de un spot).
- **Las URLs impresas no cambian nunca.** `/s/[id]` es permanente: si alguna vez se
  reorganiza, la ruta vieja redirige.
- Los filtros y las pestañas que se comparten van en query params (`?fase=en-curso`).
  El estado efímero (un modal abierto) no va en la URL.
- Sin barra al final. Una ruta inexistente muestra un 404 propio de cada superficie.
- La superficie la decide el **host**, no un prefijo de ruta (ver
  [ARQUITECTURA](./ARQUITECTURA.md#multi-tenancy)). Las rutas de abajo son
  relativas a su host.

## Pública · dominio de la organización

`expoubbe.com` en producción, `expo.localhost:3000` en local. Mobile-first. Usuario:
el visitante.

| Ruta | Vista | Acceso | Rebanada |
|------|-------|--------|----------|
| `/` | Portada del evento activo: fase, countdown, jornadas, sede y spots. Activo es, entre los publicados y públicos, el que está en curso; si no hay, el próximo; si no, el último que terminó (`resolve_active_event`). Si no hay evento, un estado vacío con la marca de la org | Público | R4 |
| `/eventos/[slug]` | Un evento puntual (pasado o próximo), con la misma vista que la portada | Público | R4 |
| `/s/[id]` | **Destino del QR.** Reclama la medalla al abrirse (es idempotente: recargar responde "ya la tenías") y la celebra con el progreso. Un QR de otra org o de un evento sin publicar es 404, sin pedir login. Sin sesión, pasa por `/ingresar` y vuelve | Visitante | R5 |
| `/mis-medallas` | La colección del evento en curso; si no hay uno, la del último evento en que el visitante juntó medallas (si no juntó nunca, la del activo): medallas conseguidas y faltantes. Sin meta del sorteo (alcanza con una medalla; R6 decide si suma un mínimo). Se llega desde el menú de la cuenta, en la cabecera de todo el dominio (con sesión, foto, nombre, Mis medallas y Salir; sin sesión, Ingresar) | Visitante | R5 |
| `/sorteo` | Ganadores publicados del evento | Público | R6 |
| `/ingresar` | Login con Google y la marca de la org; vuelve a `next` (el QR escaneado) | Público | R5 |
| `/robots.txt`, `/sitemap.xml` | SEO por dominio. `/s/*` queda fuera del índice | — | R4 |

## Admin · `app.eventdex.com`

`app.localhost:3000` en local. Desktop para preparar y mobile para operar. Usuarios:
staff y owner.

| Ruta | Vista | Acceso | Rebanada |
|------|-------|--------|----------|
| `/ingresar` | Login del equipo con Google. En desarrollo suma un link por mail que llega al visor local | Público | R1 |
| `/` | Sin pantalla: acepta las invitaciones abiertas para tu mail y te lleva a tu lugar. Developer → `/plataforma/organizaciones`; miembro → `/[org]` de su primera org; nadie más → `/sin-acceso` | Usuario con sesión | R2 · 0 |
| `/sin-acceso` | Cuenta sin organización ni invitación: lo explica, muestra el mail y deja salir para probar con otra. Sin barra lateral | Usuario con sesión | R2 · 0 |
| `/[org]` | Dashboard de la organización: métricas (eventos, publicados, sedes; stands, visitantes y medallas se suman en R3 y R5), búsqueda y filtro por fase en la URL (`?q=…&fase=…`) y una tarjeta por evento. Un no miembro recibe 404; el developer entra en modo soporte, solo lectura (sin formularios ni botones de alta), y queda en la auditoría | Miembro · developer en soporte | R2 |
| `/[org]/eventos` | Redirige a `/[org]` con los mismos filtros: la lista de eventos es el dashboard | Miembro | R2 |
| `/[org]/eventos/nuevo` | Alta de evento: nace como borrador y lleva a su página. En modo soporte, 404 | Miembro | R2 |
| `/[org]/eventos/[evento]` | Datos del evento, jornadas (agregar y quitar, en la zona del evento) y publicación | Miembro | R2 |
| `/[org]/eventos/[evento]/spots` | Spots del evento: agregar desde el catálogo, código, puntos, activo/inactivo | Miembro | R3 |
| `/[org]/eventos/[evento]/qr` | Hoja de QR para imprimir: una tarjeta por spot activo, 3 por fila en A4, para recortar. Impresa sale siempre en tonos claros, sin la barra del panel | Miembro | R3 |
| `/[org]/eventos/[evento]/visitantes` | Registrados, medallas por visitante, bloquear | Miembro | R5 |
| `/[org]/eventos/[evento]/sorteo` | Sorteos, elegibles, extraer y anular | Miembro | R6 |
| `/[org]/eventos/[evento]/sorteo/presentar` | Vista para proyectar la extracción en vivo *(sujeta a la pregunta abierta 3 de PROYECTO)* | Miembro | R6 |
| `/[org]/spots` | Catálogo de spots de la organización | Miembro | R3 |
| `/[org]/spots/nuevo` | Alta de spot | Miembro | R3 |
| `/[org]/spots/[spot]` | Editar o archivar un spot; en qué eventos se usa. `[spot]` es el `id`: un spot no tiene slug, para no pedir uno por cada stand | Miembro | R3 |
| `/[org]/sedes` | Sedes: lista y alta en la misma vista. La edición llega cuando haga falta | Miembro | R2 |
| `/[org]/equipo` | Miembros, invitaciones y roles | Owner | R7 |
| `/[org]/ajustes` | Nombre, marca (logo y colores, con vista previa) y dominios | Owner | R7 |

## Plataforma · `app.eventdex.com/plataforma`

Mismo host que el admin. Desktop. Usuario: el developer. Cualquier otro rol recibe
un 404, no un 403: la ruta no existe para él.

| Ruta | Vista | Acceso | Rebanada |
|------|-------|--------|----------|
| `/plataforma` | Resumen: organizaciones, eventos en curso, facturas pendientes | Developer | R8 |
| `/plataforma/organizaciones` | Lista de organizaciones con su estado | Developer | R1 |
| `/plataforma/organizaciones/nueva` | Alta de organización + invitación al owner + primer dominio | Developer | R1 |
| `/plataforma/organizaciones/[org]` | Detalle: dominios, miembros, eventos, suspender | Developer | R8 |
| `/plataforma/facturacion` | Facturas manuales: alta, marcar pagada, anular | Developer | R8 |
| `/plataforma/auditoria` | Registro de acciones sensibles, filtrable | Developer | R8 |

## Landing · `eventdex.com`

`localhost:3000` en local. Usuario: un posible cliente.

| Ruta | Vista | Acceso | Rebanada |
|------|-------|--------|----------|
| `/` | Qué es, cómo funciona, para quién y contacto | Público | R9 |
| `/privacidad` | Política de privacidad (la pide Google OAuth) | Público | R1 |
| `/terminos` | Términos de uso | Público | R1 |

## Compartidas · cualquier host

| Ruta | Vista | Acceso | Rebanada |
|------|-------|--------|----------|
| `/auth/callback` | Intercambio de código OAuth por sesión; redirige a `next` | — | R1 |
| `/auth/salir` | Cierra la sesión y vuelve al inicio del host | — | R1 |
| `/dev/componentes` | Catálogo de componentes con todos sus estados. **Solo en desarrollo**: 404 en producción | Dev | F0 |
