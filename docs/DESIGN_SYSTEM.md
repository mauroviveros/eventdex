# Eventdex — Design system

`v0.1 · 2026-11-06` · Relacionados: [PRODUCT](./PRODUCT.md) · [DESIGN](./DESIGN.md) · [RUTAS](./RUTAS.md) · [ARQUITECTURA](./ARQUITECTURA.md)

> Decide **cómo se comporta** la interfaz. Los valores visuales (colores, tipos,
> radios, sombras) viven en [DESIGN](./DESIGN.md), que genera
> `/impeccable document`. Este archivo nombra tokens; nunca define valores.
> Todo componente se puede ver con todos sus estados en `/dev/componentes`.

## Principios

1. **Una tarea por pantalla.** Cada vista tiene una acción principal, y se nota.
2. **El visitante no espera ni lee.** La medalla aparece antes que cualquier
   explicación. Los textos se escanean de un vistazo.
3. **La marca de la org vive en la superficie pública; Eventdex, en el resto.** Los
   componentes son los mismos; cambian los tokens `--brand-*`.
4. **Ningún estado queda sin diseñar.** Carga, vacío, error y éxito son parte del
   componente, no un agregado.
5. **Densidad según la superficie.** Aire y tamaños grandes en la app pública;
   tablas densas y escaneables en el admin y la plataforma.

## Voz en la interfaz

Las reglas de voz están en [PRODUCT](./PRODUCT.md#brand-commitments). En los
componentes se traducen así:

| Elemento | Regla | Sí | No |
|----------|-------|----|----|
| Botón | Verbo en imperativo con voseo, y qué hace | "Publicar evento" | "Aceptar", "OK" |
| Botón destructivo | Nombra el objeto | "Anular extracción" | "Eliminar" |
| Título | Qué es esta pantalla, sin adornos | "Spots de Expo 2026" | "Gestioná tus spots" |
| Error | Qué pasó + qué hacer | "No pudimos guardar. Revisá tu conexión y probá de nuevo." | "Error 500" |
| Vacío | Por qué está vacío + la acción que lo llena | "Todavía no hay spots. Agregá el primero desde el catálogo." | "Sin datos" |
| Éxito del visitante | Breve y celebratorio | "¡Medalla nueva! Te faltan 3." | "Operación exitosa" |
| Fechas | Hora local del evento, formato es-AR | "sáb 14 de nov, 14:00" | "2026-11-14T17:00Z" |

Los números, fechas y monedas siempre pasan por `Intl` con `es-AR` y la zona del
evento.

## Color

Los valores los define [DESIGN](./DESIGN.md). Los roles son fijos:

| Token | Rol |
|-------|-----|
| `--background` / `--foreground` | Fondo y texto base |
| `--surface` / `--surface-foreground` | Tarjetas y paneles |
| `--muted` / `--muted-foreground` | Texto secundario y fondos sutiles |
| `--border` | Bordes y separadores |
| `--primary` / `--primary-foreground` | Acción principal de Eventdex |
| `--brand` / `--brand-foreground` | Acción principal en la app pública; lo pisa `organizations.brand` |
| `--success`, `--warning`, `--danger` (+ `-foreground`) | Estados |
| `--focus` | Anillo de foco |

- **Nada de colores sueltos** en los componentes: solo tokens.
- **El color nunca es la única señal.** Cada estado lleva texto o ícono.
- **Marca de la org:** al guardar `brand`, se calcula `--brand-foreground` y se
  valida el contraste (4.5:1 para texto, 3:1 para elementos de UI). Si no alcanza,
  se avisa en `/[org]/ajustes` y se usa el color de respaldo.
- **Modo oscuro:** *pendiente*, lo decide la dirección visual de impeccable.

## Tipografía

Los valores los define [DESIGN](./DESIGN.md). La escala tiene roles fijos:
`display` (números grandes: medallas, countdown), `title`, `heading`, `body`,
`label` y `caption`.

- Texto base de 16 px como mínimo en mobile; nada por debajo de 12 px.
- Números tabulares (`tabular-nums`) en contadores, tablas y puntajes.
- Largo de línea de 45 a 75 caracteres en los textos corridos.

## Espacio, forma y elevación

- Espaciado en la escala de Tailwind. Los saltos fuera de escala se justifican o se
  corrigen.
- Radios y sombras **solo desde tokens** (`--radius-*`, `--shadow-*`). Nada de
  `rounded-[13px]`.

## Componentes base

Primitivas de shadcn/ui en `src/components/ui/`, adaptadas a los tokens: Button,
Input, Textarea, Select, Checkbox, Switch, Dialog, Sheet, Dropdown, Tabs, Table,
Badge, Toast, Skeleton, Tooltip, Avatar y Card.

**Regla:** una primitiva se agrega cuando la usa la primera pantalla real, no antes.

## Componentes de dominio

En `src/components/<dominio>/`. Cada uno documenta sus estados en `/dev/componentes`.

| Componente | Qué muestra | Estados |
|------------|-------------|---------|
| **Medalla** | Un spot conseguido o pendiente | conseguida · pendiente · recién conseguida (celebración) · spot inactivo |
| **Progreso** | Medallas conseguidas / total, puntos y si entra al sorteo | sin medallas · en progreso · meta alcanzada · evento finalizado |
| **Celebración** | La pantalla de `/s/[id]` al reclamar | medalla nueva · ya la tenías · spot inactivo · evento no en curso · no registrado o bloqueado |
| **Countdown** | Tiempo hasta la próxima jornada | días · horas · en curso · finalizado |
| **Fase** | Badge de próximo / en curso / finalizado / borrador | uno por fase + `sin fecha` |
| **Tarjeta de evento** | Título, fechas, sede, fase | completa · sin sede · sin jornadas |
| **Tarjeta de spot** | Nombre, código, tipo, puntos | activa · inactiva · archivada · override de esta edición |
| **QR** | Código + nombre + código corto, listo para imprimir | normal · vista de impresión A4 |
| **Extracción** | Ganador de una tirada del sorteo | sorteando · ganador · anulada |
| **Selector de organización** | La org activa en el admin | una org · varias |

## Estados

Cada vista con datos resuelve los cuatro:

| Estado | Cómo se ve | Regla |
|--------|-----------|-------|
| **Carga** | `Skeleton` con la forma del contenido final | Nunca un spinner en pantalla completa. `loading.tsx` por segmento |
| **Vacío** | Ilustración o ícono + por qué está vacío + acción para llenarlo | Si el usuario no puede llenarlo, explica cuándo se va a llenar |
| **Error** | Qué pasó, qué hacer y un botón de reintento | `error.tsx` por segmento. El error técnico va al log, no a la pantalla |
| **Éxito** | Toast breve para acciones del admin; pantalla propia para la medalla | Las acciones destructivas ofrecen deshacer o piden confirmación nombrando el objeto |

Los formularios además muestran:
- errores por campo, al lado del campo, después del primer envío;
- el botón deshabilitado con texto de progreso mientras envía ("Publicando…");
- lo cargado intacto si falla el envío.

## Móvil

- La app pública se diseña a **360 px** y después se agranda. El admin, al revés:
  desktop primero, pero todo se puede operar desde el celular.
- Las acciones principales del visitante quedan al alcance del pulgar (mitad
  inferior) y miden al menos 44×44 px.
- En el admin, las tablas pasan a lista de tarjetas por debajo de 640 px.
- Sin hover como única forma de llegar a algo.
- Contemplar la red lenta: las mutaciones muestran el resultado optimista solo
  cuando revertirlo es seguro (nunca en el reclamo de medallas ni en el sorteo).

## Movimiento

- La celebración de la medalla es el único momento con movimiento protagonista.
  En el resto: transiciones cortas, menos de 200 ms, que acompañan el cambio de
  estado.
- Con `prefers-reduced-motion`, la celebración se resuelve sin animación.

## Accesibilidad

- WCAG 2.2 AA (ver [PRODUCT](./PRODUCT.md#accessibility--inclusion)).
- Foco visible con `--focus` en todo lo interactivo; orden de foco = orden visual.
- Cada vista tiene un único `h1`; los íconos solos llevan `aria-label`.
- Los cambios de estado importantes (medalla nueva, error al enviar) se anuncian
  con `aria-live`.
- Los modales atrapan el foco y lo devuelven al cerrar (lo resuelve Radix, que usa
  shadcn).
- Se revisa con `/accessibility` y el panel de accesibilidad del navegador antes de
  cerrar cada rebanada.
