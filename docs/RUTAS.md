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
| `/` | Portada del evento activo: banner si tiene, fase, countdown, jornadas, sede y spots. Activo es, entre los publicados y públicos, el que está en curso; si no hay, el próximo; si no, el último que terminó (`resolve_active_event`). Si no hay evento, un estado vacío con la marca de la org | Público | R4 |
| `/eventos/[slug]` | Un evento puntual (pasado o próximo), con la misma vista que la portada | Público | R4 |
| `/s/[id]` | **Destino del QR.** Reclama la medalla al abrirse (es idempotente: recargar responde "ya la tenías") y la celebra con el progreso. Un QR de otra org o de un evento sin publicar es 404, sin pedir login. Sin sesión, pasa por `/ingresar` y vuelve | Visitante | R5 |
| `/mis-medallas` | La colección del evento en curso; si no hay uno, la del último evento en que el visitante juntó medallas (si no juntó nunca, la del activo): la tarjeta de visitante desde la primera medalla, y debajo las medallas conseguidas y faltantes. Quien juntó en otros eventos elige cuál ver (`?evento=`). Sin meta del sorteo: cada sorteo fija su mínimo, y el visitante no lo ve hasta que se publican los ganadores. Se llega desde el menú de la cuenta, en la cabecera de todo el dominio (con sesión, foto, nombre, Mis medallas y Salir; sin sesión, Ingresar) | Visitante | R5 |
| `/mis-medallas/tarjeta` | La tarjeta de visitante de `?evento=slug` como PNG de 1080×1920, para compartir. Privada y sin caché; sin medallas en ese evento es 404, y sin sesión pasa por `/ingresar` | Visitante | R14 |
| `/sorteo` | Ganadores publicados, con nombre e inicial: los de `?evento=slug` o, sin parámetro, los del último evento público que los tenga. Se llega desde la página del evento, cuando ya los publicó | Público | R6 |
| `/ingresar` | Login con Google y la marca de la org; vuelve a `next` (el QR escaneado). En producción el botón Ingresar de la cabecera va directo a Google sin pasar por acá; en desarrollo pasa por acá, que suma el link por mail | Público | R5 |
| `/robots.txt`, `/sitemap.xml` | SEO por dominio. `/s/*` queda fuera del índice | — | R4 |

## Admin · `eventdex-admin.vercel.app`

`app.localhost:3000` en local. Desktop para preparar y mobile para operar. Usuarios:
staff y owner.

| Ruta | Vista | Acceso | Rebanada |
|------|-------|--------|----------|
| `/ingresar` | Login del equipo con Google. En desarrollo suma un link por mail que llega al visor local | Público | R1 |
| `/` | Sin pantalla: acepta las invitaciones abiertas para tu mail y te lleva a tu lugar. Developer → `/plataforma/organizaciones`; miembro → `/[org]` de su primera org; nadie más → `/sin-acceso` | Usuario con sesión | R2 · 0 |
| `/sin-acceso` | Cuenta sin organización ni invitación: lo explica, muestra el mail y deja salir para probar con otra. Sin barra lateral | Usuario con sesión | R2 · 0 |
| `/[org]` | Dashboard de la organización: eventos, visitantes y medallas de todos sus eventos, búsqueda y filtro por fase en la URL (`?q=…&fase=…`) y una tarjeta por evento con sus stands, visitantes, medallas y medallas por visitante, Gestionar y el menú de acciones. Un no miembro recibe 404; el developer entra en modo soporte, solo lectura (sin formularios ni botones de alta), y queda en la auditoría | Miembro · developer en soporte | R2 · R15 |
| `/[org]/eventos` | Redirige a `/[org]` con los mismos filtros: la lista de eventos es el dashboard | Miembro | R2 |
| `/[org]/eventos/nuevo` | Alta de evento: nace como borrador y lleva a su página. El nombre viene precargado con el del último evento de la org (o el de la org, si es el primero); la dirección (`slug`) se arma sola con el nombre y la edición (`expo-ubbe-2026`, con `-2`, `-3`… si ya existe) y no cambia más. Con `?desde=<slug>`, lo duplica: el formulario arranca con sus datos y copia sus spots (no las jornadas ni el banner). En modo soporte, 404 | Miembro | R2 · R13 |
| `/[org]/eventos/[evento]` | El evento en pestañas (`?tab=general\|spots\|visitantes`; sin `tab`, General). Arriba, sus datos, Hoja de QR y el menú de acciones del evento (el mismo de la tarjeta). **Editar** (hoja lateral): nombre, edición y resumen (la dirección no cambia); sede (elegir, cambiar o quitar; el evento toma la zona horaria de la sede) y banner (subir, cambiar y quitar). **General**, de solo lectura: publicación (borradores), visitantes, medallas y spots activos, jornadas y banner. Las jornadas se agregan, corrigen y quitan en su propia hoja lateral, en la zona del evento. **Spots**: tabla con orden y páginas en la URL (`?orden=…&dir=…&pag=…`), agregar desde el catálogo con un buscador, y editar o quitar en una hoja lateral. **Visitantes**: tabla de registrados con sus medallas, ordenable y paginada igual, y bloquear | Miembro | R2 · R3 · R5 · R15 |
| `/[org]/eventos/[evento]/spots` | Redirige a la pestaña Spots del evento (`?tab=spots`) | Miembro | R3 · R15 |
| `/[org]/eventos/[evento]/qr` | Hoja de QR para imprimir: una tarjeta por spot activo, 3 por fila en A4, para recortar. Impresa sale siempre en tonos claros, sin la barra del panel | Miembro | R3 |
| `/[org]/eventos/[evento]/visitantes` | Redirige a la pestaña Visitantes del evento (`?tab=visitantes`) | Miembro | R5 · R15 |
| `/[org]/eventos/[evento]/sorteo` | Sorteos, elegibles, extraer y anular | Miembro | R6 |
| `/[org]/spots` | Catálogo de spots de la organización | Miembro | R3 |
| `/[org]/spots/nuevo` | Alta de spot | Miembro | R3 |
| `/[org]/spots/[spot]` | Editar o archivar un spot; en qué eventos se usa. `[spot]` es el `id`: un spot no tiene slug, para no pedir uno por cada stand | Miembro | R3 |
| `/[org]/sedes` | Sedes: lista y alta en la misma vista. La edición llega cuando haga falta | Miembro | R2 |
| `/[org]/equipo` | Miembros, invitaciones y roles. Sin mails: quien invita avisa, y la invitación se acepta al entrar con esa cuenta. Nadie se cambia ni se quita a sí mismo desde acá | Owner (developer: solo lectura) | R7 |
| `/[org]/ajustes` | Nombre, zona horaria, marca (logo y color, con vista previa en claro y oscuro). Los dominios se ven, pero los configura el developer | Owner (developer: solo lectura) | R7 |

## Plataforma · `eventdex-admin.vercel.app/plataforma`

Mismo host que el admin. Desktop. Usuario: el developer. Cualquier otro rol recibe
un 404, no un 403: la ruta no existe para él.

| Ruta | Vista | Acceso | Rebanada |
|------|-------|--------|----------|
| `/plataforma` | Resumen: organizaciones, eventos en curso, facturas pendientes | Developer | R8 |
| `/plataforma/organizaciones` | Lista de organizaciones con su estado | Developer | R1 |
| `/plataforma/organizaciones/nueva` | Alta de organización + invitación al owner + primer dominio | Developer | R1 |
| `/plataforma/organizaciones/[org]` | Detalle: dominios (sumar, hacer principal, quitar y mover desde otra org, con confirmación), miembros, eventos, suspender o reactivar, y la entrada al modo soporte | Developer | R8 |
| `/plataforma/facturacion` | Facturas manuales: alta, marcar pagada, anular | Developer | R8 |
| `/plataforma/auditoria` | Registro de acciones sensibles, filtrable por organización y área en la URL (`?org=…&area=…&pagina=…`) | Developer | R8 |

## Landing · `eventdex.vercel.app`

`localhost:3000` en local. Usuario: un posible cliente.

| Ruta | Vista | Acceso | Rebanada |
|------|-------|--------|----------|
| `/` | Qué es, cómo funciona, para quién y contacto | Público | R9 |
| `/privacidad` | Política de privacidad (la pide Google OAuth) | Público | R1 |
| `/terminos` | Términos de uso | Público | R1 |
| `/robots.txt` · `/sitemap.xml` | Para los buscadores | Público | R9 |

## Compartidas · cualquier host

| Ruta | Vista | Acceso | Rebanada |
|------|-------|--------|----------|
| `/auth/callback` | Intercambio de código OAuth por sesión; redirige a `next` | — | R1 |
| `/auth/salir` | Cierra la sesión y vuelve al inicio del host | — | R1 |
| `/dev/componentes` | Catálogo de componentes con todos sus estados. **Solo en desarrollo**: 404 en producción | Dev | F0 |
