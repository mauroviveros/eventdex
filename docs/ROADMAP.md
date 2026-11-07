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
8. **Migración** de los datos de v1 y v2 (R10), al final, cuando el esquema ya no se
   mueve.

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

## R1 · Organizaciones y acceso ▶

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
4. ▶ **Auditoría.** `/ponytail-audit` o `/code-review` y `/accessibility`.
   *Listo cuando* los hallazgos están resueltos o anotados como pendientes.

## R2 · Eventos

Branch `feat/eventos`. La org crea un evento con sede y jornadas, y lo publica.

1. **DB.** `venues`, `events`, `event_schedules`, la vista de fase y
   `publish_event()`.
   *Listo cuando* pgTAP prueba que `anon` solo ve eventos publicados, que las
   jornadas con fin antes del inicio se rechazan y que la fase sale bien en los
   tres casos.
2. **Backend.** `src/domain/` (fase y formato de fechas con zona), las lecturas y
   las acciones de sede, evento, jornada y publicar.
   *Listo cuando* la lógica de fase tiene tests con eventos pasados, en curso,
   futuros y sin jornadas.
3. **Vista.** `/[org]`, `/[org]/eventos`, `/[org]/eventos/nuevo`,
   `/[org]/eventos/[evento]` y `/[org]/sedes`.
   *Listo cuando* en el navegador se crea una sede, se crea un evento con dos
   jornadas y se publica, con los estados de carga, vacío y error vistos.
4. **Auditoría.**

## R3 · Spots y QR

Branch `feat/spots-y-qr`. Catálogo, spots del evento y QR imprimibles.

1. **DB.** `spots`, `event_spots` y el `snapshot` al publicar.
   *Listo cuando* pgTAP prueba que no se repite el código dentro de un evento, que
   no se borra un spot en uso y que el snapshot congela el nombre.
2. **Backend.** La resolución del nombre efectivo (override → snapshot → catálogo)
   en `src/domain/`, más las acciones del catálogo y de los spots del evento.
   *Listo cuando* la resolución tiene tests con los tres niveles.
3. **Vista.** `/[org]/spots`, `/[org]/spots/nuevo`, `/[org]/spots/[spot]`,
   `/[org]/eventos/[evento]/spots` y `/[org]/eventos/[evento]/qr`.
   *Listo cuando* se carga el catálogo, se ponen spots en un evento y la hoja de QR
   se imprime en A4 legible y escaneable con el celular.
4. **Auditoría.**

## R4 · Portada pública

Branch `feat/portada-publica`. El evento se ve en el dominio de la org.

1. **DB.** `resolve_organization(host)`, `resolve_active_event(org)` y las lecturas
   públicas de evento y spots.
   *Listo cuando* pgTAP prueba la resolución con un host desconocido, una org sin
   eventos y una org con un evento en curso y otro próximo.
2. **Backend.** `proxy.ts` resuelve la org con caché; lecturas de la portada;
   `robots.txt` y `sitemap.xml`.
   *Listo cuando* un host desconocido da 404 y uno conocido resuelve en una sola
   consulta.
3. **Vista.** `/` y `/eventos/[slug]`, con la marca de la org, el countdown y la
   lista de spots.
   *Listo cuando* `expo.localhost:3000` muestra el evento cargado en R2 y R3, a
   360 px, con la marca de la org aplicada.
4. **Auditoría.** Incluye la performance mobile (Lighthouse).

## R5 · Medallas

Branch `feat/medallas`. El visitante escanea y colecciona.

1. **DB.** `event_registrations`, `spot_claims` y `claim_spot()` (registra si hace
   falta y es idempotente).
   *Listo cuando* pgTAP prueba que no se reclama sin pasar por `claim_spot()`, que
   escanear dos veces no duplica, que un bloqueado no reclama y que no se reclama
   fuera de fase.
2. **Backend.** Login del visitante en el dominio de la org con retorno al QR, la
   acción de reclamar y el progreso en `src/domain/`.
   *Listo cuando* los tests cubren los cinco resultados de la celebración.
3. **Vista.** `/ingresar`, `/s/[id]`, `/mis-medallas` y
   `/[org]/eventos/[evento]/visitantes`.
   *Listo cuando* con el celular real: se escanea un QR impreso, se inicia sesión,
   aparece la medalla, y el staff ve al visitante en el admin.
4. **Auditoría.** Más un recorrido de Playwright del escaneo completo.

## R6 · Sorteo

Branch `feat/sorteo`. Al cierre, se sortea entre los que participaron.

1. **DB.** `raffles`, `raffle_draws`, la elegibilidad y `draw_raffle()` (aleatorio en
   el servidor, registrado).
   *Listo cuando* pgTAP prueba que solo salen elegibles, que no sale dos veces el
   mismo ganador y que anular no borra.
2. **Backend.** Las acciones de crear sorteo, extraer, anular y publicar ganadores.
   *Listo cuando* los tests cubren un sorteo sin elegibles y uno con anulación.
3. **Vista.** `/[org]/eventos/[evento]/sorteo`, `/sorteo/presentar` (si se confirma)
   y `/sorteo` público.
   *Listo cuando* se hace un sorteo completo en el navegador y el ganador se ve en
   la app pública.
4. **Auditoría.**

## R7 · Equipo y marca

Branch `feat/equipo-y-marca`.

1. **DB.** Las invitaciones con estado, `brand` validado y el bucket de logos.
   *Listo cuando* pgTAP prueba que solo el owner invita y edita la marca.
2. **Backend.** Las acciones de invitar, cambiar rol, quitar, guardar marca (con
   validación de contraste) y dominios.
   *Listo cuando* un color de marca sin contraste se rechaza con un mensaje claro.
3. **Vista.** `/[org]/equipo` y `/[org]/ajustes` con vista previa de la marca.
   *Listo cuando* el owner cambia el color y el logo y se ven en la portada pública.
4. **Auditoría.**

## R8 · Plataforma

Branch `feat/plataforma`.

1. **DB.** `invoices` y las lecturas de auditoría para el developer.
   *Listo cuando* pgTAP prueba que solo el developer ve y escribe facturación.
2. **Backend.** Las acciones de facturas, suspender una org y el filtro de auditoría.
   *Listo cuando* cada acción del developer deja una fila en `audit_logs`.
3. **Vista.** `/plataforma`, `/plataforma/organizaciones/[org]`,
   `/plataforma/facturacion` y `/plataforma/auditoria`.
   *Listo cuando* se registra una factura, se marca pagada y aparece en la
   auditoría.
4. **Auditoría.**

## R9 · Landing

Branch `feat/landing`. Sin DB: es contenido estático.

1. **Vista.** `/` de eventdex.com, con `/impeccable` en modo Persuade.
   *Listo cuando* está aprobada, no inventa testimonios ni métricas y pasa
   Lighthouse en mobile.
2. **Auditoría.** SEO y accesibilidad.

## R10 · Migración de datos

Branch `feat/migracion`. Los datos de v1 y v2 al esquema nuevo.

1. **Relevamiento.** El mapeo tabla por tabla, desde los esquemas de `v2-legacy` y
   de la v1.
   *Listo cuando* el mapeo está aprobado, incluyendo qué se descarta.
2. **Script.** `scripts/migrate/`, idempotente, con un reporte de cuántas filas
   entran y cuántas se descartan.
   *Listo cuando* corre dos veces contra la base local sin duplicar, y los conteos
   cierran.
3. **Producción.** Corrida real con backup previo.
   *Listo cuando* un visitante de la v1 inicia sesión y ve sus medallas viejas.
4. **Auditoría.**

---

## ⏸ Estacionado

Fuera de esta versión; vuelve solo con una decisión explícita.

- Panel del expositor.
- Roles por evento (`event_members`).
- Series de eventos y métricas entre ediciones.
- Métricas avanzadas (cohortes de visitantes nuevos y recurrentes).
- Staging (ver [ARQUITECTURA](./ARQUITECTURA.md#entornos)).
