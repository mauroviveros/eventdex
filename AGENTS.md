# AGENTS.md

Reglas para cualquier agente (y persona) que trabaje en Eventdex. `CLAUDE.md` es un
symlink a este archivo.

Antes de tocar nada, leé [ROADMAP](./docs/ROADMAP.md) para saber qué bloque está en
curso y el documento que decide sobre lo que vas a cambiar (ver
[Documentos](#documentos)).

## Cómo trabajamos

- **Rebanadas verticales.** Cada funcionalidad se hace de punta a punta, con datos
  reales: DB → Backend → Vista → Auditoría. Ni pantallas con datos inventados ni
  backend sin una vista que lo use.
- **Bloques chicos, de a uno.** Se hace un bloque del ROADMAP, se prueba y **se para**
  hasta que Mauro lo revise. No se adelanta el bloque siguiente "ya que estamos".
- **Probar antes de seguir.** Cada bloque se verifica en el navegador o con un test
  antes de darlo por terminado. Si no se pudo probar algo, se dice.
- **Auditar al cerrar cada branch** con `/ponytail-audit` o `/code-review`, y
  `/accessibility` si la rebanada tiene vista.
- **Área nueva, skill primero.** Cuando aparece un área que no cubre ninguna skill
  instalada (pagos, PDF, e2e…), se busca con `/find-skills` y se propone. **No se
  instala nada sin OK**, ni skills ni dependencias.
- **Lo mínimo que resuelve el problema entero.** Antes de agregar una dependencia,
  una abstracción o una opción, se busca si ya existe en el repo o en la plataforma.
- **Si algo contradice los documentos, se pregunta.** No se decide en el código.

## Un bloque está listo cuando

- [ ] **Anda**: se probó en el navegador o lo cubre un test, y cumple el *Listo
      cuando* del ROADMAP.
- [ ] **Cubre los estados** de error, vacío y carga (ver
      [DESIGN_SYSTEM](./docs/DESIGN_SYSTEM.md#estados)).
- [ ] **Pasan** `pnpm lint`, `pnpm typecheck` y `pnpm test` (y `pnpm db:test` si tocó
      la base).
- [ ] **Los documentos están al día**: si cambió una ruta, una tabla o una decisión,
      el documento que decide sobre eso se actualizó en el mismo cambio.
- [ ] **Mauro lo revisó.**

Al cerrar el bloque se marca en el ROADMAP (✅ / ▶ / ⏸).

## Branches y commits

- **Una branch por rebanada** (`feat/medallas`, `chore/fundaciones`). Nada directo
  en `main`; se integra por PR.
- Los mensajes siguen el skill **`commits-a-mi-nombre`**: Conventional Commits con
  gitmoji en shortcode, en inglés y sin línea de co-autoría.
  Ejemplo: `feat(medallas): :sparkles: add spot claim action`.
- **El agente no commitea.** Al cerrar cada bloque deja el comando para que lo
  corra Mauro, con los archivos exactos (**nunca `git add .`** ni `-A` sin ruta):

  ```bash
  git add src/lib/actions/claim.ts src/lib/actions/claim.test.ts
  git commit -m "feat(medallas): :sparkles: add spot claim action"
  ```

- Un commit por cambio lógico. Si un bloque mezcla temas, van varios commits.

## Documentos

Cada documento tiene una sola responsabilidad. Si dos se contradicen, decide el de
la columna **Decide sobre**, y el otro se corrige en el mismo cambio.

| Documento | Responde | Decide sobre |
|---|---|---|
| [`docs/PROYECTO.md`](./docs/PROYECTO.md) | Visión, perfiles de uso, módulos, modelo de datos inicial, preguntas abiertas | Contexto general |
| [`docs/PRODUCT.md`](./docs/PRODUCT.md) | Usuarios, propósito, posicionamiento, voz, principios, accesibilidad | Producto y textos |
| [`docs/ARQUITECTURA.md`](./docs/ARQUITECTURA.md) | Librerías, backend y datos, auth, entornos, claves, calidad, CI, hosting, preguntas abiertas | Decisiones técnicas |
| [`docs/RUTAS.md`](./docs/RUTAS.md) | Convenciones de URL y todas las vistas o rutas, agrupadas por área | Qué pantallas existen |
| [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md) | Principios, voz, color, tipografía, componentes de dominio, estados, móvil, accesibilidad | Comportamiento de la UI |
| `docs/DESIGN.md` | Tokens y reglas visuales. Lo genera `/impeccable document`, no se escribe a mano | Colores, tipografía, formas |
| [`docs/ROADMAP.md`](./docs/ROADMAP.md) | Orden de trabajo: fases → branches → bloques | Qué se hace ahora |

`PRODUCT.md` y `DESIGN.md` en la raíz son symlinks a `docs/`, para que impeccable
los encuentre.

## Convenciones

### Textos

- Castellano rioplatense con **voseo** en toda la interfaz. Las reglas de voz y la
  tabla de sí/no están en [PRODUCT](./docs/PRODUCT.md#brand-commitments) y
  [DESIGN_SYSTEM](./docs/DESIGN_SYSTEM.md#voz-en-la-interfaz).
- Código, nombres de tablas y commits **en inglés**; URLs y textos de la interfaz
  **en castellano**. El glosario de [PROYECTO](./docs/PROYECTO.md#glosario) fija la
  traducción (medalla = `claim`).
- Fechas, números y monedas siempre con `Intl`, `es-AR` y la zona del evento.

### Diseño

- **Solo tokens.** Nada de colores sueltos (`#e11d48`, `text-[#…]`, `bg-red-500`),
  radios (`rounded-[13px]`) ni sombras arbitrarias. Si falta un token, se propone en
  `DESIGN.md`; no se inventa en el componente.
- Todo componente nuevo aparece en `/dev/componentes` con todos sus estados.
- Las primitivas de shadcn se agregan cuando las usa una pantalla real, con
  `pnpm dlx shadcn@latest add <nombre>`, y se adaptan a los tokens antes de usarlas:
  sin `rounded-*`, `shadow-*` ni `animate-*`, íconos pixel en vez de lucide.

### Framework (Next.js 16 + Supabase)

- Server Components por defecto; `"use client"` solo donde hay interacción, y lo más
  abajo posible en el árbol.
- Lecturas en `src/lib/data/`; escrituras con Server Actions en `src/lib/actions/`,
  validadas con Zod y devolviendo `{ ok, error }`.
- `src/domain/` es lógica pura: no importa Supabase, React ni Next.
- El routing por host vive en `src/proxy.ts` (en Next 16 reemplaza a `middleware.ts`).
- **La autorización la hace RLS.** La clave secreta solo en
  `src/lib/supabase/service.ts`, y solo para lo que no tiene usuario. Si una
  pantalla la necesita, falta una política.
- **Cada tabla nueva otorga sus permisos con `GRANT` explícitos** (solo lo que sus
  políticas usan). Nada se otorga por defecto: así funciona Supabase en producción
  desde 2026-10-30, y local quedó igual.
- Cada migración trae sus tests pgTAP y los tipos regenerados (`pnpm db:types`) en
  el mismo cambio. No se edita una migración ya aplicada en producción.
- Las URLs impresas (`/s/[id]`) no cambian nunca.

### Atajos con un límite conocido

Un atajo que tiene un límite conocido lleva un comentario en el código con este
formato:

```ts
// shortcut: <límite>, <cuándo cambiarlo>
// shortcut: dominios cargados a mano en Vercel, automatizar con la API al pasar las 5 orgs
```

## Comandos

> Se crean en F0 · Fundaciones (bloques 5 y 6). Hasta entonces no existen.

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo (`localhost:3000` con el panel en `/panel`, `expo.localhost:3000`) |
| `pnpm build` | Build de producción |
| `pnpm lint` | Biome: lint y formato, sin escribir |
| `pnpm format` | Biome: aplica los arreglos |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest |
| `pnpm test:e2e` | Playwright, contra Supabase local y `pnpm dev` (lo reusa si ya corre) |
| `pnpm check` | `lint` + `typecheck` + `test` |
| `pnpm db:start` / `db:stop` | Levanta o baja Supabase local (Docker) |
| `pnpm db:reset` | Recrea la base local con migraciones y seed |
| `pnpm db:new <nombre>` | Nueva migración |
| `pnpm db:test` | Tests pgTAP de permisos |
| `pnpm db:types` | Regenera `src/lib/supabase/database.types.ts` |
| `pnpm db:push` | Aplica las migraciones a producción (a mano, desde `main`) |

## Skills

### Del proyecto

Fijadas en `skills-lock.json` en la raíz. Viven en `.agents/skills/`, con symlinks
desde `.claude/skills/`. Se restauran con `npx skills experimental_install`.

| Skill | Cuándo usarla |
|---|---|
| `next-best-practices` | Cualquier archivo de `src/app/`: convenciones, RSC, metadata, route handlers |
| `next-cache-components` | Al cachear lecturas (resolución de host, portada pública) |
| `next-upgrade` | Al subir de versión de Next |
| `react-best-practices` | Al escribir o revisar componentes de React |
| `composition-patterns` | Cuando un componente empieza a juntar props booleanas |
| `supabase` | Todo lo de Supabase fuera del esquema: auth, `@supabase/ssr`, CLI, Storage |
| `supabase-postgres-best-practices` | En cada bloque **DB**: esquema, índices, RLS, funciones |
| `typescript-advanced-types` | Tipos derivados del esquema y de los resultados de las acciones |
| `tailwind-css-patterns` | Estilos y layout responsive con tokens |
| `frontend-design` | Al construir una vista nueva, junto con impeccable |
| `accessibility` | Auditoría de cada rebanada con vista |
| `seo` | R4 (portada pública) y R9 (landing) |
| `vitest` | Tests unitarios y de acciones |
| `playwright-best-practices` | Recorridos e2e de cada rebanada (`e2e/`) |
| `deploy-to-vercel` | Deploys y configuración de dominios |
| `nodejs-best-practices` | El script de migración (R10) |
| `shadcn` | Al agregar o adaptar primitivas de shadcn/ui (`components.json`, `ui/shadcn/`) |

### Del usuario (globales)

| Skill | Cuándo usarla |
|---|---|
| `/impeccable` | Dirección visual, vistas nuevas, crítica y pulido de UI. `document` genera `docs/DESIGN.md` |
| `/ponytail-audit` · `/code-review` | Auditoría al cerrar cada branch |
| `/find-skills` | Cuando aparece un área nueva (instalar solo con OK) |
| `commits-a-mi-nombre` | Siempre que se armen mensajes de commit o PR |

### Para su fase (todavía no instaladas)

Se buscan con `/find-skills` al llegar a la fase y se instalan solo con OK.

| Área | Fase |
|---|---|
| Tests de base con pgTAP | F0 · bloque 6 |
| Generación e impresión de QR | R3 · buscada: no hay una skill útil; se usa `uqr` (ver ARQUITECTURA) |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
