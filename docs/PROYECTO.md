# Eventdex — Proyecto

`v0.3 · 2026-11-07` · Relacionados: [PRODUCT](./PRODUCT.md) · [ARQUITECTURA](./ARQUITECTURA.md) · [RUTAS](./RUTAS.md) · [ROADMAP](./ROADMAP.md)

> Contexto general. Si algo de acá choca con un documento más específico, manda el
> específico y este se corrige en el mismo cambio.

## Visión

Eventdex convierte un evento presencial en un juego de colección. El visitante
recorre el predio, escanea los QR de stands y atracciones y junta medallas. Al
cierre, el organizador sortea premios entre quienes participaron.

Se vende a **organizaciones** (productoras, municipios, expos). Cada una administra
sus eventos y los publica en **su propio dominio**, todos contra un solo deployment.

### Por qué se rehace desde cero

La v2 (Astro + Next + monorepo) resolvió el modelo de datos, pero llegó a la etapa
del admin con dos runtimes, un diseño que no convence y un esquema que se armó
antes de tener pantallas que lo usaran. Esta vez el orden se invierte: cada tabla
nace junto con la vista que la usa (ver [ROADMAP](./ROADMAP.md)).

De la v2 se conservan las **ideas** que funcionaron, no el código:

- Catálogo de spots reutilizable entre ediciones (`spots` + `event_spots`).
- `status` editorial separado de la **fase** temporal, que se calcula y nunca se guarda.
- Autorización en la base (RLS), no en el código con la service key.
- Registro explícito del visitante al evento.
- `timestamptz` en todo; la zona del evento se usa solo para mostrar.

El código de la v2 queda en git con el tag `v2-legacy`, como referencia para la
migración de datos.

## Perfiles de uso

| Perfil | Quién es | Alcance | Dónde usa Eventdex |
|--------|----------|---------|--------------------|
| **Visitante** | Persona que va al evento | Los eventos en los que se registró | Celular, en el predio, con una mano |
| **Staff** | Miembro operativo de la organización | Su organización | Admin, desde notebook o celular |
| **Owner** | Dueño de la organización | Su organización, con miembros, marca y dominio | Admin |
| **Developer** | Vos: soporte, alta de orgs, facturación | Toda la plataforma | Panel de plataforma; entra a cualquier org en modo soporte (solo lectura, auditado) |

**El admin es por organización.** Un organizador entra y cae en el panel de su
org; hoy tiene una sola (el modelo admite varias, con un selector). La invitación
se acepta sola al entrar con el mismo mail. Sin organización no hay acceso al
panel: la cuenta puede existir igual, porque es la misma que usa el visitante.

**Fuera de esta versión:** el expositor (quien atiende un stand y edita sus datos).
El modelo no le cierra la puerta, pero no tiene tablas ni pantallas todavía.

## Módulos

| # | Módulo | Perfil | Qué incluye |
|---|--------|--------|-------------|
| 1 | **Organización** | Owner | Alta de la org (por el developer), miembros, marca, dominio |
| 2 | **Eventos** | Staff / Owner | Evento, jornadas, sede, publicación |
| 3 | **Catálogo y QR** | Staff / Owner | Spots del catálogo, spots del evento, códigos e impresión de QR |
| 4 | **App del visitante** | Visitante | Portada del evento, login, escaneo, medallas, progreso, perfil |
| 5 | **Sorteo** | Staff / Owner | Elegibles, extracción, anulación, ganadores |
| 6 | **Plataforma** | Developer | Organizaciones, dominios, facturación manual, auditoría |
| 7 | **Landing** | Público | Marketing de eventdex.com |
| 8 | **Migración** | Developer | Importar los datos de la v1 al esquema nuevo |

## Glosario

Si un concepto se llama de una forma acá, se llama igual en la base, en el código y
en la interfaz (en la interfaz, en castellano).

| Término | Significado | Tabla |
|---------|-------------|-------|
| Organización | Cliente de Eventdex | `organizations` |
| Dominio | Hostname que sirve la app pública de una org | `organization_domains` |
| Miembro | Persona del equipo de una org, con rol | `organization_members` |
| Invitación | Pedido para sumarse a una org, por mail, antes de tener cuenta | `organization_invitations` |
| Sede | Lugar físico reutilizable entre ediciones | `venues` |
| Evento | Una edición concreta: "Expo Ubbe 2026" | `events` |
| Jornada | Bloque horario de un evento | `event_schedules` |
| Spot | Stand o atracción del **catálogo** de la org | `spots` |
| Spot del evento | Un spot puesto en un evento; es lo que apunta el QR | `event_spots` |
| Registro | Un visitante inscripto a un evento | `event_registrations` |
| Reclamo | Un escaneo válido. En la interfaz, **medalla** | `spot_claims` |
| Sorteo | Un premio a sortear dentro de un evento | `raffles` |
| Extracción | Una tirada del sorteo, con su ganador | `raffle_draws` |
| Fase | Próximo / en curso / finalizado. Se calcula | *(vista)* |

## Modelo de datos inicial

Es un punto de partida, no un esquema cerrado. Cada tabla se crea en el bloque
**DB** de la rebanada que la necesita, con sus permisos y tests, y ahí se fijan las
columnas. Las convenciones (nombres, `uuid`, `timestamptz`, baja lógica, dinero en
centavos) van en [ARQUITECTURA](./ARQUITECTURA.md).

```mermaid
erDiagram
  profiles ||--o{ organization_members : ""
  profiles ||--o| platform_admins : ""
  organizations ||--o{ organization_members : ""
  organizations ||--o{ organization_domains : ""
  organizations ||--o{ venues : ""
  organizations ||--o{ spots : ""
  organizations ||--o{ events : ""
  venues |o--o{ events : ""
  events ||--o{ event_schedules : ""
  events ||--o{ event_spots : ""
  spots ||--o{ event_spots : ""
  events ||--o{ event_registrations : ""
  profiles ||--o{ event_registrations : ""
  event_spots ||--o{ spot_claims : ""
  event_registrations ||--o{ spot_claims : ""
  events ||--o{ raffles : ""
  raffles ||--o{ raffle_draws : ""
  organizations ||--o{ invoices : ""
```

| Tabla | Para qué | Decisiones clave |
|-------|----------|------------------|
| `profiles` | Espejo de `auth.users` | Se crea por trigger al registrarse |
| `platform_admins` | Quién es developer | Tabla aparte: el acceso es cross-org |
| `organizations` | El cliente | `slug`, `brand_color` (hex: de ahí sale la rampa), `logo_path` (bajo `{id}/` en el bucket `org-logos`), zona horaria por defecto, `status`. El owner edita nombre, color, logo y zona; slug y estado, solo el developer |
| `organization_domains` | Hostnames por org | Tabla y no columna: apex + `www` y cambios de dominio sin downtime. Uno `is_primary` (`set_primary_domain`), que no se puede quitar porque los QR nuevos apuntan ahí. Los configura solo el developer (`assign_domain` suma y mueve entre orgs) |
| `organization_members` | Equipo de la org | Solo miembros activos: quitar es borrar (queda en `audit_logs`). Rol `owner` / `staff`. No se puede quitar ni degradar al último owner. Cambiar un rol o quitar a alguien lo registra la base |
| `organization_invitations` | Invitaciones por mail | La membresía nace al aceptar (`accept_invitation`), si el mail de la cuenta coincide. Vencen a los 14 días. El estado (pendiente, aceptada, vencida) sale de las fechas; revocar es borrar. Una vencida se puede volver a enviar (`invite_member`). No sale ningún mail: quien invita avisa, y la invitación se acepta al entrar con esa cuenta |
| `venues` | Sedes | Definen la zona horaria que hereda el evento. Baja con `deleted_at` |
| `events` | Ediciones | `status` editorial (`draft` → `published` → `archived` / `cancelled`), `visibility` (`public` / `unlisted`), `settings jsonb`. `slug` único por org. Solo se publica con `publish_event()`, que exige al menos una jornada. La sede tiene que ser de la misma org |
| `event_schedules` | Jornadas | `starts_at` / `ends_at` en `timestamptz`, fin después del inicio. La fase sale de la vista `event_phases`: de la primera jornada al fin de la última; sin jornadas es `null` (sin fecha) |
| `spots` | Catálogo de la org | Viven sin evento; tipo `stand` / `attraction` / `sponsor` / `activity`. Se archivan, no se borran: uno usado en un evento no se puede borrar ni con la clave de servicio, y uno archivado no se pone en eventos nuevos |
| `event_spots` | Spot dentro de un evento; su `id` es el destino del QR (`/s/[id]`) | `code` corto en mayúsculas, único por evento; un spot una vez por evento; `points`, `is_active`, puesto y overrides por edición. `snapshot` (nombre, descripción, logo, tipo) se congela al publicar, o al agregarlo si el evento ya está publicado; solo lo escribe la base. Los de eventos publicados son públicos; el catálogo (`spots`) no |
| `event_registrations` | Visitante ↔ evento | Único por (evento, usuario); ancla de RLS y de bloqueos. Nace en el primer reclamo válido, no al escanear fuera de fase. El equipo bloquea con `blocked_at` (queda en `audit_logs`); el visitante no se desbloquea |
| `spot_claims` | Medallas | Único por (spot del evento, usuario): escanear dos veces no duplica. Solo las crea `claim_spot()`, que devuelve el resultado de la celebración (bloqueado → ya la tenías → inactivo → fuera de fase → nueva). Un spot con medallas no se saca del evento: se desactiva |
| `raffles` / `raffle_draws` | Sorteos y extracciones | Cada sorteo pide su mínimo de medallas (`min_claims`, una por defecto). Varias extracciones por sorteo, solo con `draw_raffle()`, entre registrados sin bloquear. Una extracción se anula con motivo, no se borra, y quien salió no vuelve a la tirada de ese sorteo aunque se anule. Lo público es el nombre y la inicial (`winner_name`, congelado al extraer), y solo después de publicar los ganadores |
| `invoices` | Facturación manual | Por organización, con concepto libre, monto en centavos y moneda (`ARS` / `USD`). Estado `pending` → `paid` → `void`: no se edita ni se borra, si está mal se anula y se carga otra. Solo el developer la ve y la escribe, y cada paso queda en `audit_logs` |
| `audit_logs` | Rastro de acciones sensibles | Toda acción cross-org del developer deja registro |

**Lo que se saca respecto de la v2** (cada uno vuelve solo si una rebanada lo pide):

- `event_series`: el vínculo entre ediciones se resuelve con **duplicar evento**. Si
  aparece una métrica entre ediciones que lo necesite, vuelve.
- `event_members` y `event_spot_exhibitors`: no hay roles por evento ni expositor
  en esta versión.
- La vista de cohortes (visitantes nuevos vs. recurrentes) pasa a la rebanada de
  métricas, si entra.

## Preguntas abiertas

1. ~~**Login del visitante**~~: decidido en R5, solo Google. El link por mail queda
   para desarrollo local; otro método se suma si hace falta.
2. **Escaneo**: ¿cámara dentro de la app, la cámara nativa del celular abriendo la
   URL del QR, o las dos?
3. ~~**Sorteo en vivo**~~: decidido en R6, sin vista de presentación; si se proyecta,
   se muestra la página del panel.
4. ~~**Meta de medallas**~~: decidido en R5, alcanza con una; en R6, cada sorteo
   puede pedir un mínimo mayor (`min_claims`).
5. **Duplicar evento**: ¿copia spots, sede y jornadas, o solo spots?
6. ~~**Facturación**~~: decidido en R8, concepto libre por organización; sirve por
   evento y por período.
7. ~~**Migración**~~: decidido en R10, se migran la org, sus eventos pasados, spots y
   medallas (las medallas cuelgan de ellos). Los usuarios conservan su login.
   Mapeo en [ARQUITECTURA](./ARQUITECTURA.md#migración-de-datos-al-final).
