# Eventdex

Eventos presenciales convertidos en un juego de colección: el visitante escanea los
QR de los stands, junta medallas y entra en el sorteo del cierre. Multi-tenant: cada
organización lo publica en su propio dominio.

> **En reconstrucción.** Se está rehaciendo desde cero; el código anterior quedó en
> el tag `v2-legacy`. Por dónde va: [ROADMAP](./docs/ROADMAP.md).

## Comandos

Requiere Node 22.12+, pnpm (`corepack enable`) y Docker para Supabase local.

```bash
pnpm install
```

```bash
pnpm db:start
```

```bash
pnpm dev
```

```bash
pnpm check
```

`db:start` levanta Supabase local con migraciones y seed. `check` corre lint, tipos
y tests. El resto de los comandos está en [AGENTS.md](./AGENTS.md#comandos).

## Documentación

- [AGENTS.md](./AGENTS.md): cómo se trabaja en este repo (personas y agentes).
- [`docs/`](./docs): [PROYECTO](./docs/PROYECTO.md) · [PRODUCT](./docs/PRODUCT.md) ·
  [ARQUITECTURA](./docs/ARQUITECTURA.md) · [RUTAS](./docs/RUTAS.md) ·
  [DESIGN_SYSTEM](./docs/DESIGN_SYSTEM.md) · [ROADMAP](./docs/ROADMAP.md)
