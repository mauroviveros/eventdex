# Eventdex — Roadmap

`v0.2 · 2026-11-06` · Relacionados: [PROYECTO](./PROYECTO.md) · [RUTAS](./RUTAS.md) · [ARQUITECTURA](./ARQUITECTURA.md) · [AGENTS](../AGENTS.md)

> Decide qué se hace ahora. Estados: ✅ hecho · ▶ en curso · ⏸ estacionado · sin
> marca = pendiente.

## Cómo se lee

- **Rebanada** = una funcionalidad completa, de punta a punta, con datos reales.
  Una rebanada es una branch `feat/...`.
- Adentro, **bloques** numerados que se hacen de a uno y en orden:
  **DB** (tablas, permisos, tests) → **Backend** (capa de datos, acciones,
  validación) → **Vista** → **Auditoría**.
- Cada bloque cierra con un *Listo cuando*: algo concreto que se puede verificar.
- Ni pantallas con datos inventados ni backend sin una vista que lo use.

## Por qué este orden

Sigue el recorrido real: **nada existe hasta que alguien lo carga.**

1. Primero hay una **organización** con alguien adentro (R1). Sin eso no hay quién
   cree nada.
2. Esa persona crea un **evento** con jornadas y sede (R2). De las jornadas sale la
   fase, que usa todo lo demás.
3. Le carga **spots** e imprime los **QR** (R3). Ya hay algo físico en el predio.
4. El evento se ve en **el dominio de la organización** (R4): la primera pantalla
   pública, con los datos que se cargaron en R2 y R3.
5. El **visitante** escanea y junta **medallas** (R5). Es el corazón del producto, y
   llega con datos reales detrás.
6. Al cierre, el **sorteo** (R6) usa las medallas de R5.
7. Con el circuito completo andando: **equipo y marca** (R7), la **plataforma**
   completa (R8) y la **landing** (R9). Ninguno bloquea el circuito.
8. **Migración** de los datos de la v1 (R10), cuando el esquema ya no se mueve. Se
   hizo antes que R9: desde el corte, la v1 estaba apagada y sus datos no se veían.

---

## F0 · Fundaciones ✅

Branch `docs/base` y después `chore/fundaciones`. Lo que ya existe y lo que falta
para escribir la primera rebanada.

1. ✅ **Documentos base.** `PROYECTO`, `PRODUCT`, `ARQUITECTURA` y `RUTAS` aprobados.
   *Listo cuando* están commiteados en `docs/base`.
2. ✅ **Documentos restantes.** `DESIGN_SYSTEM`, `ROADMAP`, symlink `PRODUCT.md`,
   `README` corto y borrado de los docs viejos.
   *Listo cuando* `docs/` tiene solo los documentos nuevos, los symlinks resuelven
   y no hay links rotos.
3. ✅ **`AGENTS.md`.** Reglas para agentes y `CLAUDE.md` como symlink.
   *Listo cuando* está aprobado y commiteado.
4. ✅ **Limpieza del código viejo.** Tag `v2-legacy` y borrado de `apps/`, `packages/`,
   `supabase/`, `turbo.json` y la config que quede huérfana.
   *Listo cuando* el tag existe en el remoto y el repo solo tiene docs y config.
5. ✅ **Esqueleto Next.** App Next 16 + Tailwind v4 + Biome + Vitest + `proxy.ts` con
   las cuatro superficies respondiendo una página vacía por host. `.env.example`,
   validación de variables y `.claude/launch.json`.
   *Listo cuando* `pnpm dev` levanta, `localhost:3000`, `app.localhost:3000` y
   `expo.localhost:3000` muestran su superficie, y pasan `pnpm lint`,
   `pnpm typecheck` y `pnpm test`.
6. ✅ **Supabase local.** `supabase init`, el esquema `app` vacío, pgTAP habilitado y
   un test trivial.
   *Listo cuando* `supabase start` + `supabase test db` pasa en local.
7. ✅ **CI.** El workflow nuevo según [ARQUITECTURA](./ARQUITECTURA.md#ci).
   *Listo cuando* el PR de `chore/fundaciones` a `main` corre verde en GitHub.
8. ✅ **Dirección visual.** `/impeccable` sobre `PRODUCT.md` y `/impeccable document`
   genera `docs/DESIGN.md`, con su symlink `DESIGN.md` en la raíz (se crea recién
   ahí para no dejar un link roto). Tokens en el CSS global.
   *Listo cuando* `DESIGN.md` está aprobado y los tokens están en `globals.css`.
9. ✅ **`/dev/componentes`.** Las primitivas base con los tokens, en todos sus
   estados. 404 en producción.
   *Listo cuando* la ruta muestra Button, Input y Card en claro y en sus estados,
   y en un build de producción devuelve 404.

---

## R1 · Organizaciones y acceso ✅

Branch `feat/organizaciones`. El developer da de alta una org y su owner entra al
admin.

1. ✅ **DB.** `profiles` (con trigger de alta), `platform_admins`, `organizations`,
   `organization_domains`, `organization_members`, `organization_invitations`,
   `audit_logs`, las funciones `create_organization` y `accept_invitation`, y los helpers
   `app.*`.
   *Listo cuando* los tests pgTAP prueban que un miembro de la org A no ve nada de
   la org B, que solo un developer crea organizaciones y que no se puede quitar al
   último owner.
2. ✅ **Backend.** Clientes Supabase (servidor y navegador; el de servicio llega
   con su primer uso), sesión refrescada en `proxy.ts`,
   `/auth/callback`, `/auth/salir`, y las acciones "crear organización" (con
   invitación al owner y primer dominio) y "aceptar invitación".
   *Listo cuando* los tests de las acciones cubren el caso feliz, el de datos
   inválidos y el de usuario sin permiso.
3. ✅ **Vista.** `/ingresar` del admin, `/` (tus organizaciones),
   `/plataforma/organizaciones`, `/plataforma/organizaciones/nueva`, `/privacidad`
   y `/terminos`.
   *Listo cuando* en el navegador: el developer crea una org, el owner invitado
   entra con Google y ve su organización, y un usuario sin org ve un estado vacío
   que le explica qué pasa.
4. ✅ **Auditoría.** `/ponytail-audit` o `/code-review` y `/accessibility`.
   *Listo cuando* los hallazgos están resueltos o anotados como pendientes.

## R2 · Eventos ✅

Branch `feat/eventos`. La org crea un evento con sede y jornadas, y lo publica.

0. ✅ **Acceso por organización.** El admin deja de ser una lista: `/` acepta las
   invitaciones propias (`accept_my_invitations`) y te lleva a tu org, a la
   plataforma (developer) o a `/sin-acceso`. `/[org]` con su shell, guard y modo
   soporte (`log_support_access`).
   *Listo cuando* el owner invitado cae directo en su org, una cuenta sin org ve
   `/sin-acceso`, un no miembro recibe 404 y el soporte del developer queda auditado.
1. ✅ **DB.** `venues`, `events`, `event_schedules`, la vista de fase
   (`event_phases`) y `publish_event()`.
   *Listo cuando* pgTAP prueba que `anon` solo ve eventos publicados, que las
   jornadas con fin antes del inicio se rechazan y que la fase sale bien en los
   tres casos.
2. ✅ **Backend.** `src/domain/` (fase y formato de fechas con zona), las lecturas y
   las acciones de sede, evento, jornada y publicar.
   *Listo cuando* la lógica de fase tiene tests con eventos pasados, en curso,
   futuros y sin jornadas.
3. ✅ **Vista.** `/[org]` (el dashboard: arma `StatTile`, `EventFilters` y `EventCard`, que ya están en `/dev/componentes`, y pasa el selector de organización al shell), `/[org]/eventos`, `/[org]/eventos/nuevo`,
   `/[org]/eventos/[evento]` y `/[org]/sedes`.
   *Listo cuando* en el navegador se crea una sede, se crea un evento con dos
   jornadas y se publica, con los estados de carga, vacío y error vistos.
4. ✅ **Auditoría.** `/code-review`: resueltos el registro del modo soporte en los
   prefetch, la última jornada de un evento publicado (trigger), los contadores con
   búsqueda, el botón Publicar con teclado, el catálogo y repeticiones menores.
   Pendiente: la fase ignora `cancelled` y `archived`; se resuelve cuando exista
   cancelar o archivar.

## R3 · Spots y QR ✅

Branch `feat/spots-y-qr`. Catálogo, spots del evento y QR imprimibles.

1. ✅ **DB.** `spots`, `event_spots` y el `snapshot` al publicar.
   *Listo cuando* pgTAP prueba que no se repite el código dentro de un evento, que
   no se borra un spot en uso y que el snapshot congela el nombre.
2. ✅ **Backend.** La resolución del nombre efectivo (override → snapshot → catálogo)
   en `src/domain/`, más las acciones del catálogo y de los spots del evento.
   *Listo cuando* la resolución tiene tests con los tres niveles.
3. ✅ **Vista.** `/[org]/spots`, `/[org]/spots/nuevo`, `/[org]/spots/[spot]`,
   `/[org]/eventos/[evento]/spots` y `/[org]/eventos/[evento]/qr`.
   *Listo cuando* se carga el catálogo, se ponen spots en un evento y la hoja de QR
   se imprime en A4 legible y escaneable con el celular.
4. ✅ **Auditoría.** `/code-review`: 8 hallazgos resueltos. Entre ellos, un spot
   agregado mientras se publica ya no queda sin snapshot (el trigger bloquea el
   evento) y quitar un spot del evento pide confirmación porque su QR impreso deja
   de funcionar.

## R4 · Portada pública ✅

Branch `feat/portada-publica`. El evento se ve en el dominio de la org.

1. ✅ **DB.** `resolve_organization(host)`, `resolve_active_event(org)` y las lecturas
   públicas de evento y spots.
   *Listo cuando* pgTAP prueba la resolución con un host desconocido, una org sin
   eventos y una org con un evento en curso y otro próximo.
2. ✅ **Backend.** El layout de la app pública resuelve la org con caché (el proxy
   solo enruta); lecturas de la portada; `robots.txt` y `sitemap.xml`.
   *Listo cuando* un host desconocido da 404 y uno conocido resuelve en una sola
   consulta.
3. ✅ **Vista.** `/` y `/eventos/[slug]`, con la marca de la org, el countdown y la
   lista de spots.
   *Listo cuando* `expo.localhost:3000` muestra el evento cargado en R2 y R3, a
   360 px, con la marca de la org aplicada.
4. ✅ **Auditoría.** Incluye la performance mobile (Lighthouse). `/code-review`: 6
   hallazgos (5 resueltos; el logo de las medallas espera a Storage). Lighthouse mobile
   sobre el build de producción: performance 99, accesibilidad 100, buenas prácticas
   100, SEO 100.

## R5 · Medallas ✅

Branch `feat/medallas`. El visitante escanea y colecciona.

1. ✅ **DB.** `event_registrations`, `spot_claims` y `claim_spot()` (registra si hace
   falta y es idempotente).
   *Listo cuando* pgTAP prueba que no se reclama sin pasar por `claim_spot()`, que
   escanear dos veces no duplica, que un bloqueado no reclama y que no se reclama
   fuera de fase.
2. ✅ **Backend.** Login del visitante en el dominio de la org con retorno al QR, la
   acción de reclamar y el progreso en `src/domain/`.
   *Listo cuando* los tests cubren los cinco resultados de la celebración.
3. ✅ **Vista.** `/ingresar`, `/s/[id]`, `/mis-medallas` y
   `/[org]/eventos/[evento]/visitantes`.
   *Listo cuando* con el celular real: se escanea un QR impreso, se inicia sesión,
   aparece la medalla, y el staff ve al visitante en el admin. Probado en producción
   (2026-11-08) con la org de pruebas `eventdex-demo.vercel.app`.
4. ✅ **Auditoría.** Más un recorrido de Playwright del escaneo completo. `/code-review`: 10
   hallazgos (9 resueltos; la paginación de visitantes queda como atajo). Lighthouse
   accesibilidad: 100 en `/ingresar` y la página del evento; `/dev/componentes` pedía nombre
   en la barra de progreso (resuelto). Playwright (`e2e/medallas.spec.ts`): escanear sin
   sesión → ingresar → medalla nueva → repetida → mis medallas → el staff bloquea → no
   suma más, y QR ajeno o roto = 404; estable en 5 repeticiones. Encontró que el
   `loading.tsx` de `/s/[id]` convertía el 404 en 200 (resuelto con un Suspense).

## R6 · Sorteo ✅

Branch `feat/sorteo`. Al cierre, se sortea entre los que participaron.

1. ✅ **DB.** `raffles`, `raffle_draws`, la elegibilidad y `draw_raffle()` (aleatorio en
   el servidor, registrado).
   *Listo cuando* pgTAP prueba que solo salen elegibles, que no sale dos veces el
   mismo ganador y que anular no borra.
2. ✅ **Backend.** Las acciones de crear sorteo, extraer, anular y publicar ganadores.
   *Listo cuando* los tests cubren un sorteo sin elegibles y uno con anulación.
3. ✅ **Vista.** `/[org]/eventos/[evento]/sorteo` y `/sorteo` público. Sin vista para
   proyectar: la del panel alcanza.
   *Listo cuando* se hace un sorteo completo en el navegador y el ganador se ve en
   la app pública.
4. ✅ **Auditoría.** Más un recorrido de Playwright del sorteo completo. `/code-review`: 10
   hallazgos (7 resueltos; quedan el link a ganadores si se anularon todas las extracciones,
   los uuid visibles para quien tiene sesión y una consulta de elegibles por sorteo).
   Lighthouse accesibilidad: 100 en el panel y en `/sorteo`.

## R7 · Equipo y marca ✅

Branch `feat/equipo-y-marca`.

1. ✅ **DB.** `invite_member()` (una invitación vencida se reemplaza), el estado
   de la invitación sale de sus fechas, auditoría de equipo y dominios, y el bucket
   `org-logos` con el logo atado a su org.
   *Listo cuando* pgTAP prueba que solo el owner invita y edita la marca.
2. ✅ **Backend.** Las acciones de invitar, revocar, cambiar rol, quitar, guardar
   marca, subir o quitar el logo y dominios. El color no se valida por contraste:
   la rampa lo garantiza (ver [DESIGN_SYSTEM](./DESIGN_SYSTEM.md)).
   *Listo cuando* un color o un logo inválido se rechaza con un mensaje claro.
3. ✅ **Vista.** `/[org]/equipo` y `/[org]/ajustes` con vista previa de la marca.
   *Listo cuando* el owner cambia el color y el logo y se ven en la portada pública
   sin esperar la caché.
4. ✅ **Auditoría.** `/code-review`: 3 hallazgos, todos resueltos (aviso al hacer
   principal un dominio que todavía no abre, logo que se achicaba en la cabecera,
   lista de zonas duplicada). axe: 0 violaciones en equipo, ajustes y portada, con
   owner y en modo soporte, que queda de solo lectura.

## R8 · Plataforma ✅

Branch `feat/plataforma`.

1. ✅ **DB.** `invoices`, `set_organization_status()` y las lecturas de auditoría
   para el developer.
   *Listo cuando* pgTAP prueba que solo el developer ve y escribe facturación.
2. ✅ **Backend.** Las acciones de facturas, suspender una org y el filtro de auditoría.
   *Listo cuando* cada acción del developer deja una fila en `audit_logs`.
3. ✅ **Vista.** `/plataforma`, `/plataforma/organizaciones/[org]`,
   `/plataforma/facturacion` y `/plataforma/auditoria`.
   *Listo cuando* se registra una factura, se marca pagada y aparece en la
   auditoría.
4. ✅ **Auditoría.** `/code-review`: 7 hallazgos, 5 resueltos (test de pgTAP que
   dependía de datos locales, consultas antes de la guarda del developer, textos y
   el límite de la lista de facturas) y 2 sin cambios por ahora (ninguna acción hace
   baja lógica de una org; los selects cargan de más con pocas orgs). axe: 0 violaciones en
   las cuatro pantallas, en claro y oscuro, a 412 y 1280 px.

## R9 · Landing ✅

Branch `feat/landing`. Sin DB: es contenido estático.

1. ✅ **Vista.** `/` de eventdex.com, con `/impeccable` en modo Persuade.
   *Listo cuando* está aprobada, no inventa testimonios ni métricas y pasa
   Lighthouse en mobile.
2. ✅ **Auditoría.** SEO y accesibilidad. `/code-review`: 10 hallazgos, 9 resueltos
   (faltaban `robots.txt`, `sitemap.xml`, la URL canónica y los datos para compartir;
   la consola no anunciaba el stand elegido a los lectores de pantalla) y 1 sin
   cambios (el armado de las variables de la rampa, repetido en otras vistas). Lighthouse
   mobile sobre el build de producción: 100 en las cuatro categorías.

## R10 · Migración de datos ✅

Branch `feat/migracion`. Los datos de la v1 (esquema `v1` del proyecto de
producción) al esquema nuevo. La v2 no llegó a producción.

1. ✅ **Relevamiento.** El mapeo tabla por tabla desde el esquema `v1`, en
   [ARQUITECTURA](./ARQUITECTURA.md#mapeo-desde-la-v1).
   *Listo cuando* el mapeo está aprobado, incluyendo qué se descarta.
2. ✅ **Logos de spots.** Bucket `spot-logos` con permisos por organización, subida
   desde el formulario del spot y las medallas mostrando el logo.
   *Listo cuando* pgTAP prueba que una org no escribe en la carpeta de otra, y un
   spot con logo se ve así en la portada y en mis medallas.
3. ✅ **Script.** `scripts/migrate/`, idempotente, con un reporte de cuántas filas
   entran y cuántas se descartan.
   *Listo cuando* corre dos veces contra la base local sin duplicar, y los conteos
   cierran.
4. ✅ **Producción.** Corrida real con backup previo.
   *Listo cuando* un visitante de la v1 inicia sesión y ve sus medallas viejas.
   Corrido el 2026-11-09: 4 eventos, 70 spots, 703 inscripciones, 1649 medallas y 70
   logos, con los conteos exactos. Una cuenta de la v1 entró con Google en
   `evento.lodecharlytcg.com` y vio sus medallas.
5. ✅ **Auditoría.** `/code-review` antes del merge: 10 hallazgos, 8 resueltos (los
   logos de las medallas cargan de a poco, el script de logos no falla con los
   subidos después, casos del importador que el backup no tenía y repeticiones). Sin
   cambios: un archivo huérfano si falla la escritura del spot, y la clave secreta
   del script, que ARQUITECTURA permite para la migración. Lighthouse accesibilidad:
   100 en `/dev/componentes`.

---

## R11 · Dominios del developer ✅

Sumar un dominio exige cargarlo a mano en Vercel y en Auth, y moverlo toca a dos
organizaciones. Branch `feat/dominios-developer`.

1. ✅ **DB.** Las políticas de `organization_domains` quedan solo para el developer, y
   `assign_domain` suma o mueve sin dejar una org sin principal.
   *Listo cuando* un owner no puede escribir dominios y mover uno deja rastro en las dos orgs.
2. ✅ **Vista.** En `/plataforma/organizaciones/[org]`: sumar, sumar y hacer principal,
   quitar, y mover con confirmación si otra org lo tiene. `/[org]/ajustes` solo los muestra.
   *Listo cuando* el developer mueve un dominio ocupado después de confirmar.
3. ✅ **Auditoría y producción.** `/code-review`: 10 hallazgos, 7 resueltos; quedan sin
   cambios el panel de confirmación parecido al de `ActionButton`, un texto de error que
   no se muestra y `DomainForm` fuera de `/dev/componentes`, como los demás forms de
   página. axe (WCAG AA): 0 violaciones en plataforma, la alerta y ajustes, antes de
   esos arreglos. Migración aplicada el 2026-11-09, con las políticas verificadas en
   producción.

## R12 · Marca por organización ✅

Logos y banner a la vista. El skin a medida de Burning Tower Fest (bloques 3 y 4) se
descartó: BT vuelve a ser parte de Lo de Charly TCG y usa su marca
([ARQUITECTURA](./ARQUITECTURA.md#burning-tower-fest-separación-y-vuelta-atrás)).

1. ✅ **Logos tal cual.** Branch `feat/logos-originales`. Se ven como se subieron, sin
   pasar a cuatro tonos; solo la medalla pendiente va en gris.
   *Listo cuando* header, medalla conseguida y celebración muestran el archivo original
   en claro y oscuro, y la pendiente se ve gris.
   `/code-review`: sin hallazgos. axe queda sin correr.
2. ✅ **Banner por evento.** Branch `feat/portada-evento`. Bucket `event-covers`, subida
   desde el panel y portada pública.
   *Listo cuando* el staff sube el banner y se ve en la portada; sin banner, todo igual.
   `/code-review`: sin hallazgos. axe queda sin correr.
3. ✅ **Vuelta atrás.** Branch `chore/unificar-burning-tower`. Sin `src/skins/`;
   `07_copy_logos_back.mjs` y `08_merge_burning_tower.sql` juntan las dos orgs en PRD.
   *Listo cuando* la org `burning-tower-fest` no existe, sus eventos, medallas y QR
   andan bajo Lo de Charly, y la app pública se ve con la marca de Charly.
   `/code-review`: 3 hallazgos, 3 resueltos. 07 y 08 corridos en producción el 2026-11-12.

## R13 · Duplicar evento

Una edición nueva suele repetir casi todo de la anterior, y cargar cada spot de a uno
es lo que más tarda. Branch `feat/duplicar-evento`.

1. ✅ **Duplicar.** `duplicate_event` crea un borrador con los datos del formulario y
   los spots del original, todo o nada; salta los archivados. No copia jornadas, banner,
   visitantes, medallas ni sorteos, y cada edición tiene sus propios QR. Se entra con
   «Duplicar» desde el evento, a `/[org]/eventos/nuevo?desde=<slug>`.
   *Listo cuando* un evento se duplica desde el panel y el borrador trae sus spots, sin
   tocar el original.
   `/code-review`: sin hallazgos. axe queda sin correr.

## R14 · Tarjeta de visitante ✅

La colección del evento, con la cara de quien la juntó, lista para mostrar. Branch
`feat/tarjeta-visitante`.

1. ✅ **Tarjeta en Mis medallas.** `VisitorCard`, con la foto en la pantalla LCD; sin
   cambios en la base.
   *Listo cuando* desde la primera medalla la tarjeta encabeza `/mis-medallas` con datos
   reales, y sin medallas la página sigue como antes.
2. ✅ **Compartir.** Una imagen de 1080×1920 generada con sesión, Web Share con archivo y
   descarga si el navegador no puede.
   *Listo cuando* el visitante comparte su tarjeta como imagen desde el celular.
   `/code-review`: 10 hallazgos, 8 resueltos; los 2 de limpieza quedaron sin
   objeto al sacar los skins. `/accessibility`: revisión manual sin hallazgos abiertos.
   Verificado en `chore/cierres-r14-r16`: `/mis-medallas/tarjeta` da un PNG de
   1080×1920, privado y sin caché, y 404 para un evento sin medallas; sin Web Share, el
   botón descarga `tarjeta-<evento>.png`. axe (WCAG 2.2 AA y buenas prácticas) en
   `/mis-medallas`: 0 violaciones, claro y oscuro, 375 y 1280 px. Mauro la
   compartió desde su celular, en producción.

## R15 · Panel con shadcn ✅

El panel pasa a las primitivas de shadcn/ui, adaptadas al mundo LCD: esquinas rectas,
reglas de 2 px, sin sombras ni animaciones, objetivos de 44 px. Un bloque por zona,
cada uno revisado antes del siguiente. Branch `feat/admin-shadcn`.
Cerrado con el R16: el axe que en estos bloques quedó sin correr lo cubren las pasadas
del R16 sobre las mismas pantallas, ya rediseñadas.

1. ✅ **Shell.** `Sidebar` con la organización arriba, las secciones con íconos pixel y
   la cuenta abajo (`DropdownMenu` + `Avatar`). Colapsa a íconos y lo recuerda; en el
   celular es una `Sheet` que abre el botón de la barra superior.
   *Listo cuando* se navega, se cambia de organización y se sale desde el panel en
   escritorio y celular, con teclado, en ambos esquemas.
2. ✅ **Formularios.** `Field` y `SelectField` sobre Input, NativeSelect y Label;
   Checkbox en los spots; `DateField` (Calendar + Popover, en castellano) para las
   jornadas y las facturas, que manda el mismo texto que el input nativo. `Button`
   queda para el bloque de confirmaciones.
   *Listo cuando* se agrega una jornada eligiendo la fecha en el calendario, un error
   conserva lo cargado, y los formularios del panel pasan sus e2e.
3. ✅ **Tablas y estados.** Table en organizaciones, facturación y auditoría; Badge
   para la fase del evento (`PhaseBadge`), el estado de una organización y el de una
   factura. Las tablas siguen corriéndose de costado en el celular; pasarlas a
   tarjetas (DESIGN_SYSTEM · Móvil) queda pendiente.
   *Listo cuando* las tres tablas y los estados se ven con las primitivas, y los e2e
   de la plataforma pasan.
4. ✅ **Confirmaciones y avisos.** `Button` sobre el de shadcn (mismos nombres de
   variante y estado pendiente). Lo que no se deshace confirma en un AlertDialog con la
   acción y su objeto, la consecuencia y un botón explícito; el foco arranca en Cancelar.
   Los éxitos del panel son un toast (Sonner) abajo; los errores siguen al lado del
   formulario.
   *Listo cuando* las confirmaciones y los avisos del panel usan las primitivas, y la
   suite e2e pasa.
5. ✅ **Detalle del evento.** Branch `feat/evento-pestanas`. Una página con Tabs (General ·
   Spots · Visitantes) en `?tab=`; Spots y Visitantes son `DataTable` (TanStack Table)
   con orden y páginas en la URL, resueltos en el server, y tarjetas bajo 640 px. El
   spot del catálogo se elige con `Combobox` (Command); se edita en una `Sheet`. Las
   rutas `/spots` y `/visitantes` redirigen a su pestaña; QR y Sorteo siguen aparte.
   *Listo cuando* se cambia de pestaña, se ordena y pagina por URL, se agrega un spot
   con el buscador usando el teclado, y los e2e del panel pasan.
   `/code-review`: 7 hallazgos, 5 resueltos, 1 descartado (la hoja no bloquea el panel)
   y 1 que queda (el panel de la pestaña se nombra antes de cargar; resuelto en
   `chore/cierres-r14-r16`: lo nombra la pestaña que todavía muestra, y el conteo se lee
   separado, «Spots 4»). `/accessibility`:
   revisión manual (contraste AA, teclado, foco de la hoja); axe queda sin correr.
6. ✅ **Cifras y acciones del evento.** Misma branch. Cada tarjeta del dashboard muestra
   stands activos, visitantes, medallas y medallas por visitante, contados en la misma
   lectura de eventos; arriba, Eventos · Visitantes · Medallas. Un ⋮ (`EventActions`)
   junta Hoja de QR, Sorteo, Ver en el sitio, Publicar (con confirmación) y Duplicar,
   en la tarjeta y en el encabezado del evento. Sin borrar.
   *Listo cuando* las tarjetas muestran cifras reales, se duplica desde el menú de una
   tarjeta y los e2e del panel pasan.
   `/code-review` (con el bloque 7): 8 hallazgos, 3 resueltos (total de visitantes
   rotulado, error viejo al reabrir Publicar, carrera al cambiar la dirección). Después,
   3 más: la dirección fija también en la base (trigger `events_keep_published_slug`,
   con pgTAP), Publicar desde el menú con su e2e (que encontró un toast doble) y la hoja
   de spots sobre `EditSheet`. Quedan 2: conteos de medallas por spot (con `shortcut`)
   y conteos que paga la plataforma. Los dos quedan como atajos aceptados: con los
   eventos de hoy no pesan, y se pasan a una vista agrupada por evento si se acercan al
   umbral del `shortcut` (~50 spots por evento). `/accessibility`: revisión manual sin
   hallazgos.
7. ✅ **Editar el evento.** Misma branch. Un botón Editar en el encabezado abre una
   hoja lateral (`EditSheet`) con nombre, dirección (solo en borradores), edición,
   resumen, sede y banner; las jornadas tienen su propia hoja, donde además se corrigen.
   General queda de solo lectura.
   *Listo cuando* se edita un evento y una jornada desde las hojas, un publicado no
   cambia de dirección, y los e2e del panel pasan.
8. ✅ **Migas y ancho del evento.** Branch `feat/evento-layout`, salida de un
   `/impeccable critique` del detalle del evento. La barra superior lleva migas
   (`Breadcrumb`) en vez de título y link de volver en las seis pantallas que dependen
   de otra; en el celular queda solo el tramo de arriba. Editar y el ⋮ suben a la
   barra; Hoja de QR queda solo en el ⋮. El detalle ocupa todo el ancho (el texto
   conserva su medida) y Agregar spots abre una `EditSheet` junto al título de la
   sección, como Jornadas.
   *Listo cuando* se vuelve por las migas en escritorio y celular, se agregan varios
   spots seguidos a un evento vacío sin que la hoja se cierre, y los e2e del panel pasan.
   `/code-review`: 6 hallazgos, 5 resueltos (la hoja se cerraba al agregar el primer
   spot o la primera jornada, con su e2e; el catálogo vacío detrás de una hoja; la
   página actual oculta a lectores en el celular; la galería sin el caso de dos
   tramos) y 1 que queda (clases de link repetidas en los estados vacíos; resuelto en
   `chore/cierres-r14-r16`: queda `underline`, porque grosor y separación ya vienen del
   estilo base de `a`).
   `/accessibility`: revisión manual (contraste AA, foco, orden, objetivos de 44 px,
   foco de la hoja) sin hallazgos; axe queda sin correr.
9. ✅ **Catálogo de spots.** Branch `feat/spots-catalogo`. El catálogo es una `DataTable`
   (tipo, en cuántos eventos está, estado) con orden y páginas en la URL. Nuevo spot y
   Editar abren una `EditSheet`; la de alta queda abierta para cargar el siguiente y
   `?nuevo` la abre al entrar (reemplaza a `/spots/nuevo`). El detalle distingue los
   eventos del mismo nombre por edición, fechas y fase. Al agregar un spot a un evento
   el código se genera (`A01`, `A02`…); se puede cambiar desde su hoja.
   *Listo cuando* se crean varios spots seguidos desde la hoja, se ordena el catálogo
   por URL, se agrega un spot a un evento sin escribir código, y los e2e del panel pasan.
   e2e: 19 de 19; `equipo.spec.ts` falla a veces, también sin esta branch.
   `/code-review`: 7 hallazgos, 6 resueltos (solo se reintenta el choque de código,
   con su mensaje; `?nuevo` sale de la URL al abrir la hoja y también la abre desde
   un link; `/spots/nuevo` redirige; los usos del spot van del más nuevo al más viejo;
   el link de cada fila ya no repite el tipo; el catálogo vacío vuelve a tener botón) y
   1 descartado (`/dev/componentes` muestra `DataTable` en general, como con las
   tablas del evento). `/accessibility`: revisión manual (hojas con nombre y foco que
   vuelve al botón, `aria-sort`, objetivos de 44 px, orden de títulos); solo el link
   que repetía el tipo. axe queda sin correr.

## R16 · Panel unificado ✅

El panel se muda al dominio de la landing, bajo `/panel`, y se rediseña por zonas
con las primitivas de shadcn adaptadas al mundo LCD. Una zona por bloque, cada una
revisada antes de la siguiente.

1. ✅ **Un solo host.** Branch `feat/panel-unificado`. `eventdex.vercel.app/panel/…` sirve
   el panel y la plataforma, y `/ingresar` el login del staff; el host aparte del admin
   (`eventdex-admin.vercel.app`, `app.localhost`) desaparece, sin redirección: no
   llegó a producción. Las carpetas de `src/app/` pasan a ser las URLs (`(landing)/`,
   `ingresar/`, `panel/`) y el proxy solo reescribe los hosts de las orgs. La landing
   suma Ingresar en su cabecera y sigue estática. Sin cambios en la base.
   *Listo cuando* se entra por `/ingresar` y se cae en `/panel/[org]`, salir vuelve a
   `/ingresar` y los e2e del panel pasan.
2. ✅ **Dashboard de la org.** Misma branch. `/impeccable critique`: 25/40, sin hallazgos
   del detector; los problemas eran de jerarquía (totales que no deciden nada, ningún
   atajo al evento del día, borradores sin decir qué les falta, eventos del mismo nombre
   sin edición). Arriba, el evento activo (`ActiveEvent`: en curso o el próximo, con sus
   cifras y atajos); después, «Para publicar» (`DraftChecklist`); abajo, la tabla de
   eventos (`EventsTable` sobre `DataTable`, con tarjetas compactas bajo 640 px) ordenada
   por atención (`sortForPanel`, con tests). Salen los totales de la org y `EventCard`.
   Sin cambios en la base. El shell queda como está.
   *Listo cuando* el dashboard muestra el evento activo, los borradores y la tabla con
   datos reales en escritorio y celular, y los e2e del panel pasan.
   axe (WCAG 2.2 AA): 0 violaciones en el dashboard (claro y oscuro, 375 y 1280 px) y
   en `/dev/componentes`.
3. ✅ **Detalle del evento y sorteo.** Misma branch. El encabezado sigue al dashboard: la
   edición en el título, cuándo y dónde en una línea, y en General la misma franja de
   cifras (`StatStrip`, compartida con `ActiveEvent`) en vez de tres cajas. Un borrador
   muestra en Publicación lo que le falta (`DraftSteps`). El sorteo pasa a ser la
   pestaña Sorteo (`?tab=sorteo`), y `/sorteo` redirige; la Hoja de QR sigue aparte
   porque va al papel. En el celular las pestañas van de borde a borde, como los
   filtros. Sin cambios en la base.
   *Listo cuando* se sortea desde la pestaña, un link viejo a `/sorteo` cae en ella, un
   borrador dice qué le falta, y los e2e del panel pasan.
   axe (WCAG 2.2 AA): 0 violaciones en General, Sorteo y un borrador, a 375 y 1280 px.
4. ✅ **Limpieza del panel.** Misma branch, salida de una revisión de lo hecho. Publicar es
   uno solo (`PublishEvent`): el ⋮ y General abren la misma confirmación, y en General
   aparece recién con jornadas. Las pestañas del evento son cuatro columnas en el
   celular, sin scroll. Sin las rutas que solo redirigían (`/eventos`,
   `/eventos/[evento]/spots|visitantes|sorteo`, `/spots/nuevo`): no llegaron a
   producción. `StatTile` pasa a `StatStrip` (con leyenda) en la plataforma. Sin código
   muerto (`supabase/client.ts`, `visibility` en la lista de eventos, 31 `export` que
   solo se usaban en su archivo). `components/admin` → `components/panel`, `AdminShell`
   → `PanelShell`, `adminLanding` → `panelLanding`, el grupo `(panel)` → `(secciones)`,
   la superficie `landing` → `raiz`, y las fichas de impeccable apuntan a las rutas
   nuevas.
   *Listo cuando* hay un solo Publicar con confirmación, las cuatro pestañas entran a
   320 px, y pasan lint, tipos, tests y e2e.
5. ✅ **Catálogo de spots y sedes.** Misma branch. Todas las tablas usan en el celular
   las tarjetas compactas del dashboard, con un selector «Ordenar por» en vez de los
   encabezados sueltos. En las secciones, la barra es el título (h1) y se va el título
   grande repetido; «Nuevo evento» y el detalle de una organización suman migas. Sedes:
   «Nueva sede» y «Editar» (nombre y dirección, `updateVenue` con tests; la zona no se
   edita) en hojas laterales, cada sede con en cuántos eventos se usa, y sin sedes el
   alta es la página. Sin cambios en la base: la política de `update` ya existía.
   *Listo cuando* se ordena una tabla desde el celular, se edita una sede, y pasan los
   e2e.
6. ✅ **Equipo y ajustes.** Misma branch. Equipo: «Invitar» en la barra abre una hoja
   lateral; miembros e invitaciones a todo el ancho, con sus acciones en un ⋮
   (`RowActions`: cambiar rol, quitar con confirmación, invitar de nuevo, revocar).
   Ajustes: Organización (nombre y zona), Marca (color y logo junto a la vista previa) y
   Dominios, cada sección con su Guardar. Sin cambios en la base.
   *Listo cuando* se invita, se cambia el rol y se quita desde el ⋮, se guarda el color
   aparte del nombre, y pasan los e2e.
7. ✅ **Plataforma e `/ingresar`.** Misma branch. Organizaciones, facturas y auditoría en
   `DataTable` (tarjetas compactas en el celular). «Nueva factura» y «Sumar dominio» en
   hojas laterales; las acciones de cada factura y de cada dominio en `RowActions`. Las
   cifras del Resumen llevan a su página (`StatStrip` con `href`). En el celular el título
   de una sección no se corta: la acción baja. `/ingresar` toma el fondo y el logotipo
   de la landing, con vuelta al inicio. Sin cambios en la base.
   *Listo cuando* se factura, se marca pagada y se suma un dominio desde las hojas y los
   ⋮, y pasan los e2e.
   `/code-review` de la branch: 9 hallazgos, 9 resueltos. El aviso de éxito sale con la
   respuesta de la acción (`announce`), no de un efecto, y ya no se pierde al publicar
   desde General; una sola confirmación (`ConfirmDialog`) con foco de respaldo cuando
   la fila desaparece; `SignInCard` y `PublishButton` en `/dev/componentes`; un proyecto
   `desktop` de Playwright para ordenar por encabezados; el conteo de eventos por sede
   solo en Sedes; la última columna de una tarjeta se alinea a la derecha solo si es el
   ⋮; y nombres que no se repiten («Guardar marca», las acciones de cada factura).
   axe (WCAG 2.2 AA): 0 violaciones en `/ingresar` y `/dev/componentes`.
   Después del merge (branch `chore/cierres-r14-r16`): Lighthouse de la landing en
   producción con Ingresar, 100 en accesibilidad, buenas prácticas y SEO (celular y
   escritorio), y en el celular con 4G lento y CPU ×4, LCP 704 ms y CLS 0. `/ingresar` en
   claro, 375 y 1280 px: axe sin violaciones. Ajustes en modo soporte muestra solo Marca y
   Dominios, sin formularios. axe (WCAG 2.2 AA y buenas prácticas) en el dashboard,
   Ajustes y las cinco pantallas de la plataforma, claro y oscuro, 375 y 1280 px: 0
   violaciones, después de pasar la barra lateral de escritorio a `<aside>` (el nombre
   de la org y la cuenta quedaban fuera de todo landmark).

## R17 · Sorteo en escenario

El sorteo para proyectar, como en la v1 (tag `v1.0.0`, `apps/event/src/app/raffle/`):
la extracción con animación y los participantes a la vista. Vive en el panel, donde el
equipo ya tiene sesión, y no en el dominio de la org. El ganador lo sigue eligiendo
`draw_raffle` en el servidor, parejo entre los elegibles: la animación solo termina en
el nombre que devolvió. Branch `feat/sorteo-escenario`.

1. ✅ **Backend.** `drawRaffle` devuelve la extracción (id, número y nombre público) en
   vez de descartarla, y `listRaffleParticipants` lee quién puede ganar con su nombre
   público («Ana G.») y sus medallas, sin mails ni ids (`publicName`, copia de
   `app.public_name`). Sin cambios en la base.
   *Listo cuando* los tests cubren la extracción devuelta y las reglas del nombre
   público.
2. ▶ **Vista.** `/[org]/eventos/[evento]/sorteo/proyectar?sorteo=<id>`, a pantalla
   completa y sin la barra del panel, con la marca de la org (`RaffleStage`). Para dejarla
   afuera, el layout con la barra y todas sus páginas pasan al grupo `(con-barra)` de
   `[org]`, y la pantalla vive en `(escenario)`: las URLs no cambian. Participantes a la
   vista, animación en pasos que frena en el ganador (sin movimiento con
   `prefers-reduced-motion`), solo el ganador se anuncia, y «Proyectar» en cada sorteo de
   la pestaña. Sin cambios en la base.
   *Listo cuando* se sortea desde la pantalla proyectada y el ganador coincide con el
   de la pestaña.
   e2e (`sorteo-escenario.spec.ts`): se sortea, el ganador coincide con la extracción del
   panel, con movimiento reducido aparece sin animación (el test falla si se saca esa
   rama), y un sorteo inexistente es 404. Suite completa: 23 de 23. axe (WCAG 2.2 AA y
   buenas prácticas) en la pantalla: 0 violaciones en claro y oscuro a 1280 px y en
   oscuro a 375 px, sin scroll horizontal. En `/dev/componentes` entra con sus cuatro
   estados.
3. **Auditoría.** `/code-review` de la branch y `/accessibility`; axe en el estado con
   ganador y en claro a 375 px, que quedaron sin correr.
   *Listo cuando* se resuelven los hallazgos y axe da 0 violaciones, claro y oscuro, a 375
   y 1280 px.

---

## ⏸ Estacionado

Fuera de esta versión; vuelve solo con una decisión explícita.

- **Sorteo en vivo desde el celular**: el equipo extrae desde el panel y la pantalla
  pública del proyector, sin sesión, recibe el resultado en tiempo real y anima
  (Supabase Realtime). Se construye sobre el R17.

- Panel del expositor.
- Roles por evento (`event_members`).
- Series de eventos y métricas entre ediciones.
- Métricas avanzadas (cohortes de visitantes nuevos y recurrentes).
- Staging (ver [ARQUITECTURA](./ARQUITECTURA.md#entornos)).
