# Eventdex — Rutas

`v0.2 · 2026-11-12` · Relacionados: [ARQUITECTURA](./ARQUITECTURA.md#multi-tenancy) · [PROYECTO](./PROYECTO.md#módulos) · [ROADMAP](./ROADMAP.md) · [DESIGN_SYSTEM](./DESIGN_SYSTEM.md)

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
| `/s/[id]` | **Destino del QR.** Reclama la medalla al abrirse (es idempotente: recargar responde "ya la tenías") y la celebra con el progreso. Un QR de otra org o de un evento sin publicar es 404, sin pedir login. Sin sesión, muestra la medalla bloqueada (el sprite del tipo en silueta, con candado) y un solo botón a Google, sin pasar por `/ingresar`; al volver la suma. En desarrollo suma el link por mail | Visitante | R5 · R18 |
| `/mis-medallas` | La colección del evento en curso; si no hay uno, la del último evento en que el visitante juntó medallas (si no juntó nunca, la del activo): la tarjeta de visitante desde la primera medalla, y debajo las medallas conseguidas y faltantes. Quien juntó en otros eventos elige cuál ver (`?evento=`). Sin meta del sorteo: cada sorteo fija su mínimo, y el visitante no lo ve hasta que se publican los ganadores. Sin sesión, en producción va directo a Google y vuelve; en desarrollo pasa por `/ingresar`. Se llega desde el menú de la cuenta, en la cabecera de todo el dominio (con sesión, foto, nombre, Mis medallas y Salir; sin sesión, Ingresar) | Visitante | R5 |
| `/mis-medallas/tarjeta` | La tarjeta de visitante de `?evento=slug` como PNG de 1080×1920, para compartir. Privada y sin caché; sin medallas en ese evento es 404, y sin sesión va a ingresar como `/mis-medallas` | Visitante | R14 |
| `/sorteo` | Ganadores publicados, con nombre e inicial: los de `?evento=slug` o, sin parámetro, los del último evento público que los tenga. Se llega desde la página del evento, cuando ya los publicó | Público | R6 |
| `/ingresar` | Login con Google y la marca de la org; vuelve a `next`. En producción solo se llega por un error del callback (`?error=auth`): el botón Ingresar de la cabecera, el QR sin sesión y las páginas que piden sesión van directo a Google. En desarrollo es la puerta de las páginas que piden sesión, y suma el link por mail | Público | R5 · R18 |
| `/robots.txt`, `/sitemap.xml` | SEO por dominio. `/s/*` queda fuera del índice | — | R4 |

## Panel · `eventdex.vercel.app/panel`

`localhost:3000/panel` en local. Comparte host con la landing. Desktop para preparar
y mobile para operar. Usuarios: staff y owner.

Las rutas de esta tabla van **bajo `/panel`** (`/[org]` es `/panel/[org]`), salvo
`/ingresar`, que queda en la raíz. Salir del panel vuelve a `/ingresar`.

| Ruta | Vista | Acceso | Rebanada |
|------|-------|--------|----------|
| `/ingresar` (en la raíz) | Login del equipo con Google; sin `next`, vuelve a `/panel`. Sobre el fondo de la landing, con el logotipo como link de vuelta al inicio. La landing lo linkea desde su cabecera. En desarrollo suma un link por mail que llega al visor local | Público | R1 |
| `/` | Sin pantalla: acepta las invitaciones abiertas para tu mail y te lleva a tu lugar. Developer → `/plataforma/organizaciones`; miembro → `/[org]` de su primera org; nadie más → `/sin-acceso` | Usuario con sesión | R2 · 0 |
| `/sin-acceso` | Cuenta sin organización ni invitación: lo explica, muestra el mail y deja salir para probar con otra. Sin barra lateral | Usuario con sesión | R2 · 0 |
| `/[org]` | Dashboard de la organización: arriba, el evento activo (en curso o, si no hay, el próximo) con sus cifras y atajos (Gestionar, Hoja de QR, Sorteo, Ver en el sitio); después, los borradores con lo que les falta para publicar; y abajo, todos los eventos en una tabla ordenada por atención (en curso, próximos, borradores, finalizados), con búsqueda y filtro por fase en la URL (`?q=…&fase=…`) y el menú de acciones de cada uno. Un no miembro recibe 404; el developer entra en modo soporte, solo lectura (sin formularios ni botones de alta), y queda en la auditoría | Miembro · developer en soporte | R2 · R15 · R16 |
| `/[org]/eventos/nuevo` | Alta de evento: nace como borrador y lleva a su página. El nombre viene precargado con el del último evento de la org (o el de la org, si es el primero); la dirección (`slug`) se arma sola con el nombre y la edición (`expo-ubbe-2026`) y no cambia más. Si la org ya tiene un evento con ese nombre y edición, se rechaza y se pide otra edición. Con `?desde=<slug>`, lo duplica: el formulario arranca con sus datos y copia sus spots (no las jornadas ni el banner). En modo soporte, 404 | Miembro | R2 · R13 |
| `/[org]/eventos/[evento]` | El evento en pestañas (`?tab=general\|spots\|visitantes\|sorteo`; sin `tab`, General). Arriba, el nombre con su edición y la fase, cuándo y dónde en una línea, el resumen, Editar y el menú de acciones del evento (el mismo de la tabla del dashboard). **Editar** (hoja lateral): nombre, edición y resumen (la dirección no cambia); sede (elegir, cambiar o quitar; el evento toma la zona horaria de la sede) y banner (subir, cambiar y quitar). **General**, de solo lectura: publicación en los borradores (lo que falta: jornadas, spots y sede opcional, y Publicar), la franja de cifras en los publicados (stands activos, visitantes, medallas y medallas por visitante), jornadas y banner. Las jornadas se agregan, corrigen y quitan en su propia hoja lateral, en la zona del evento. **Spots**: tabla con orden y páginas en la URL (`?orden=…&dir=…&pag=…`), agregar desde el catálogo con un buscador (el código se genera solo), y editar o quitar en una hoja lateral. **Visitantes**: tabla de registrados con sus medallas, ordenable y paginada igual, y bloquear. **Sorteo**: un sorteo por premio, con sus elegibles; extraer, **Proyectar**, anular y publicar ganadores, y el alta abajo | Miembro | R2 · R3 · R5 · R6 · R15 · R16 · R17 |
| `/[org]/eventos/[evento]/qr` | Hoja de QR para imprimir: una tarjeta por spot activo, 3 por fila en A4, para recortar. Impresa sale siempre en tonos claros, sin la barra del panel | Miembro | R3 |
| `/[org]/eventos/[evento]/sorteo/proyectar?sorteo=<id>` | El sorteo para proyectar en el escenario: a pantalla completa, sin la barra del panel, con la marca de la org. Un encabezado con el título del premio, cuántas medallas hacen falta y los totales; una placa donde pasan las caras unos cuatro segundos y se frena en el ganador que ya eligió el servidor (con su foto, «Ganador n.º N» y sus medallas, y confeti); un botón **Sortear** de ancho completo; y debajo, solo los nombres públicos («Ana G.») de quienes participaron. Al abrirla muestra la última extracción vigente. Con movimiento reducido el ganador aparece sin animación. Solo ese ganador se anuncia a lectores de pantalla. Sin `sorteo` o con uno mal formado vuelve a la pestaña Sorteo; un sorteo que no es de ese evento es 404. El developer en modo soporte la ve, sin el botón | Miembro · developer en soporte | R17 |
| `/[org]/spots` | Catálogo de spots de la organización: tabla con tipo, en cuántos eventos está y estado, con orden y páginas en la URL (`?orden=…&dir=…&pag=…`). **Nuevo spot** (hoja lateral) da de alta y queda abierta para cargar el siguiente; `?nuevo` la abre (así linkean el catálogo vacío y la pestaña Spots del evento) y sale de la URL al abrirse | Miembro | R3 · R15 |
| `/[org]/spots/[spot]` | En qué eventos se usa (con edición, fechas y fase, para distinguir eventos del mismo nombre). **Editar** (hoja lateral): datos, logo y archivar. `[spot]` es el `id`: un spot no tiene slug, para no pedir uno por cada stand | Miembro | R3 · R15 |
| `/[org]/sedes` | Sedes: cada una con su dirección, su zona horaria y en cuántos eventos se usa. **Nueva sede** (hoja lateral, desde la barra) y **Editar** (hoja lateral): nombre y dirección; la zona horaria no se edita, porque cada evento ya copió la suya. Sin sedes, el alta es la página misma (ahí lleva «Cargá una» desde la sede del evento) | Miembro | R2 · R16 |
| `/[org]/equipo` | Miembros e invitaciones a todo el ancho, cada fila con sus acciones en un ⋮ (cambiar rol, quitar con confirmación, invitar de nuevo, revocar). **Invitar** (hoja lateral, desde la barra). Sin mails: quien invita avisa, y la invitación se acepta al entrar con esa cuenta. Nadie se cambia ni se quita a sí mismo desde acá | Owner (developer: solo lectura) | R7 · R16 |
| `/[org]/ajustes` | **Organización**: nombre y zona horaria. **Marca**: color y logo, con vista previa en claro y oscuro. Cada sección con su Guardar. **Dominios**: se ven, pero los configura el developer | Owner (developer: solo la marca y los dominios, para mirar) | R7 · R16 |

## Plataforma · `eventdex.vercel.app/panel/plataforma`

Dentro del panel: las rutas de esta tabla van bajo `/panel`. Desktop. Usuario: el developer. Cualquier otro rol recibe
un 404, no un 403: la ruta no existe para él.

| Ruta | Vista | Acceso | Rebanada |
|------|-------|--------|----------|
| `/plataforma` | Resumen: organizaciones, eventos en curso, facturas pendientes; organizaciones y facturas llevan a su página | Developer | R8 · R16 |
| `/plataforma/organizaciones` | Tabla de organizaciones con dominio, estado, equipo e invitación abierta (tarjetas en el celular) | Developer | R1 · R16 |
| `/plataforma/organizaciones/nueva` | Alta de organización + invitación al owner + primer dominio | Developer | R1 |
| `/plataforma/organizaciones/[org]` | Detalle: dominios (**Sumar dominio** en hoja lateral, que pregunta antes de moverlo desde otra org; hacer principal y quitar, con confirmación, en el ⋮ de cada uno), miembros, eventos, suspender o reactivar, y la entrada al modo soporte | Developer | R8 · R16 |
| `/plataforma/facturacion` | Facturas manuales en una tabla, cada una con marcar pagada y anular (con confirmación) en su ⋮. **Nueva factura** (hoja lateral, desde la barra) | Developer | R8 · R16 |
| `/plataforma/auditoria` | Registro de acciones sensibles, filtrable por organización y área en la URL (`?org=…&area=…&pagina=…`) | Developer | R8 |

## Landing · `eventdex.vercel.app`

`localhost:3000` en local. Usuario: un posible cliente. Mismo host que el panel.

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
| `/auth/google` | Arranca el ingreso con Google como link; vuelve a `next` por `/auth/callback` | — | R18 |
| `/auth/salir` | Cierra la sesión y vuelve al inicio del host | — | R1 |
| `/dev/componentes` | Catálogo de componentes con todos sus estados. **Solo en desarrollo**: 404 en producción | Dev | F0 |
