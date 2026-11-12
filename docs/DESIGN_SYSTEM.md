# Eventdex — Design system

`v0.3 · 2026-11-07` · Relacionados: [PRODUCT](./PRODUCT.md) · [DESIGN](./DESIGN.md) · [RUTAS](./RUTAS.md) · [ARQUITECTURA](./ARQUITECTURA.md)

> Decide **cómo se comporta** la interfaz. Los valores visuales (colores, tipos,
> radios, sombras) viven en [DESIGN](./DESIGN.md), que genera
> `/impeccable document`. Este archivo nombra tokens; nunca define valores.
> Todo componente se puede ver con todos sus estados en `/dev/componentes`.

## Principios

1. **Una tarea por pantalla.** Cada vista tiene una acción principal, y se nota.
2. **El visitante no espera ni lee.** La medalla aparece antes que cualquier
   explicación. Los textos se escanean de un vistazo.
3. **La marca de la org vive en la superficie pública; Eventdex, en el resto.** Los
   componentes son los mismos; cambia la rampa de cuatro tonos (`--ramp-*`), que
   sale del color de marca, o el skin entero si la org tiene uno a medida.
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
| Éxito del visitante | Breve y celebratorio | "¡Medalla nueva! Ya tenés 3." | "Operación exitosa" |
| Fechas | Hora local del evento, formato es-AR | "sáb 14 de nov, 14:00" | "2026-11-14T17:00Z" |

Los números, fechas y monedas siempre pasan por `Intl` con `es-AR` y la zona del
evento.

## Color

Los valores los define [DESIGN](./DESIGN.md). Hay una sola paleta de cuatro tonos
(`--ramp-0..3`) y los componentes usan **roles**, nunca tonos sueltos:

| Token | Rol |
|-------|-----|
| `--lcd-0` | Fondo |
| `--lcd-1` | Relleno: segmentos pendientes, fondos de selección, deshabilitado |
| `--lcd-2` | Secundario: texto de apoyo, reglas tenues, estado apagado |
| `--lcd-3` | Tinta: texto, reglas de 2 px, acción principal |
| `--danger` | Error y acciones destructivas. Siempre con su ícono de alerta |
| `--accent-red`, `--accent-yellow` | Solo en la app pública, como texto sobre el fondo: título del evento (rojo), fecha y sede (amarillo). Ver [DESIGN](./DESIGN.md) |

- **Nada de colores sueltos** en los componentes: solo tokens.
- **El color nunca es la única señal.** Cada estado lleva texto o ícono.
- **Marca de la org:** del color de marca se toma solo el tono y la saturación;
  la luminosidad de cada tono es fija (`src/domain/palette.ts`). Por eso el
  contraste está garantizado para cualquier marca, sin validar nada al guardar.
- **Skin de la org:** reemplaza la rampa, los acentos, la tipografía y las texturas
  de su app pública, redefiniendo los mismos roles. Los componentes no cambian. Vive
  en `src/skins/`, cada uno con su test de contraste, y el campo de color de Ajustes
  no aparece.
- **Modo oscuro:** sigue al sistema (`prefers-color-scheme`). Los roles se
  invierten (el fondo pasa a ser el tono más oscuro) y el contraste no cambia.
- **Logos:** los de la org y los spots se ven tal cual son, sin filtro. La única
  excepción es la medalla que todavía no se consiguió, que va en gris y apagada;
  al conseguirla recupera el color. Un spot sin logo usa el sprite de su tipo.

## Tipografía

Los valores los define [DESIGN](./DESIGN.md). Dos voces:

- **Pixelada** (`font-display`): títulos, contadores, puntos y códigos de spot.
  Solo en los pasos de la escala `text-px-1..4`, nunca por debajo de 20 px.
- **Legible** (`font-sans`): todo lo que se lee, formularios incluidos.
- Texto base de 16 px como mínimo en mobile; nada por debajo de 12 px.
- Números tabulares (`tabular-nums`) en contadores, tablas y puntajes.
- Largo de línea de 45 a 75 caracteres en los textos corridos.

## Espacio, forma y elevación

- Espaciado en la escala de Tailwind. Los saltos fuera de escala se justifican o se
  corrigen.
- **Esquinas rectas y sin sombras.** La profundidad la dan las reglas de 2 px y el
  panel de doble regla (`.panel`). Nada de `rounded-*` ni `shadow-*`. La única
  excepción es `shadow-plate`, la sombra dura del cartel, que solo se ve en la app
  pública de una org sin skin.

## Componentes base

Primitivas de shadcn/ui en `src/components/ui/shadcn/`, adaptadas a los tokens: Button,
Input, Textarea, Select, Checkbox, Switch, Dialog, Sheet, Dropdown, Tabs, Table,
Badge, Toast, Skeleton, Tooltip, Avatar y Card. Ya están Sidebar, Sheet, Dropdown,
Tooltip, Avatar, Input, Label, NativeSelect (el select del sistema, cómodo en el
celular), Checkbox, Popover, Calendar, Table, Badge, Button, AlertDialog, Toast (Sonner),
Tabs, Command (R15) y Breadcrumb (las migas de la barra superior, con chevron pixel). Tabs es la tira de los filtros: reglas de 2 px y la activa en
tinta. `Combobox` (Popover + Command) es el select en el que se escribe, para listas
largas como el catálogo de spots; manda su valor en un input oculto, igual que un
select. `DataTable` arma las tablas del panel con orden y páginas en la URL. Badge tiene una variante por tono
(tinta, relleno, regla, secundario) más `destructive`, que es solo para algo que anda
mal. Las fechas se eligen con `DateField`:
calendario en castellano, semana desde el lunes, días de 44 px y la hora al lado. Sus roles (`sidebar-*`, `popover`, `accent`, `muted`,
`border`, `ring`) apuntan a los roles LCD en `globals.css`: no suman colores.

**Regla:** una primitiva se agrega cuando la usa la primera pantalla real, no antes.

## Componentes de dominio

En `src/components/<dominio>/`. Cada uno documenta sus estados en `/dev/componentes`.

| Componente | Qué muestra | Estados |
|------------|-------------|---------|
| **Medalla** | Un spot conseguido o pendiente: su logo original, o el sprite de su tipo | conseguida (a color) · pendiente (gris y apagada) · nueva (pasa de gris a color en pasos) · spot inactivo (gris y tramada) |
| **Progreso** | Medallas conseguidas / total. Sin meta habla de completar la colección; con meta (R6, si el sorteo pide un mínimo), del sorteo | sin medallas · en progreso · colección completa · evento finalizado · con meta |
| **Tarjeta de visitante** | Encabeza Mis medallas desde la primera medalla: evento, foto, nombre y lo conseguido, hasta 12 casillas. Lo que falta lo dice Progreso. Sin nombre dice «Visitante», nunca el mail. Debajo, Compartir: abre el menú del celular con la imagen o, si el navegador no puede, la descarga | una medalla · varias · más de 12 · colección completa · sin foto · nombre largo · sin nombre · sin sede |
| **Cuenta del visitante** | Fin de la cabecera del dominio de la org: foto, nombre y mail, con un menú a Mis medallas y Salir | con sesión · sin nombre (solo mail) · celular (solo la foto) · sin sesión (Ingresar) |
| **Celebración** | La pantalla de `/s/[id]` al reclamar. Las fechas, en la zona del evento | medalla nueva · ya la tenías · spot inactivo · evento no en curso (todavía no arrancó / terminó) · bloqueado |
| **Countdown** | Tiempo hasta la próxima jornada | días · horas · en curso · finalizado |
| **Fase** | Badge de próximo / en curso / finalizado / borrador | uno por fase + `sin fecha` |
| **Tarjeta de evento** | Cuándo y dónde; stands activos, visitantes y medallas, y las medallas por visitante (un número, no un porcentaje: el público junta de 2 a 3). Abajo, Gestionar y el ⋮ de acciones del evento | finalizado · en curso · borrador (tira punteada, solo stands) · sin visitantes ("Todavía sin visitantes") |
| **Acciones del evento** | `EventActions`: un ⋮ que abre Hoja de QR (si hay spots), Sorteo, Ver en el sitio (si está publicado), Publicar (borrador con jornadas, con confirmación: no vuelve a borrador) y Duplicar. Cada acción aparece solo si tiene sentido; en soporte, solo las que no cambian nada. Sin borrar. Está en la tarjeta y en la barra superior del evento, al lado de Editar | con todo · borrador listo · soporte |
| **Hoja de edición** | `EditSheet`: un botón que abre una Sheet lateral con formularios, para editar sin salir de la página (Editar evento, Jornadas, Agregar spots del catálogo). Cada formulario guarda por su cuenta y avisa con un toast; la hoja sigue abierta | con formularios · campo fijo con su porqué |
| **Tarjeta de spot** | Nombre, código, tipo, puntos | activa · inactiva · archivada · override de esta edición |
| **QR** | Código + nombre + código corto, listo para imprimir | normal · vista de impresión A4 |
| **Extracción** | Ganador de una tirada del sorteo | sorteando · ganador · anulada |
| **Selector de organización** | La org activa en el admin | una org · varias |
| **Shell del admin** | Barra lateral (organización arriba, secciones con ícono pixel, cuenta abajo con foto, nombre y mail) y barra superior con el botón de la barra, el título y las acciones de la pantalla. Una página que depende de otra (evento, sorteo, Hoja de QR, spot, alta) lleva migas en vez de título y de un link de volver: la sección como link y la página actual en tinta. En el celular queda solo el tramo de arriba, como «‹ Eventos». La barra colapsa a íconos (botón, borde o Ctrl/⌘ B) y lo recuerda en una cookie. En celular es un panel lateral que abre el mismo botón y se cierra al elegir una sección | sección actual (celda invertida) · con migas · colapsada (íconos con tooltip) · sin organización (marca) · varias organizaciones (menú con todas, la actual marcada) · sin foto (iniciales) · modo soporte (aviso sobre la página) |
| **Métrica** | Una cifra de la organización o del evento | con valor · en cero |
| **Filtros de eventos** | Buscador y fases con conteos, todo en la URL | fase actual · sin resultados |
| **Tarjeta de evento** | Cuándo y dónde, stands/visitantes/medallas, recorrido promedio, Estadísticas y Gestionar. Sin métricas reales todavía (antes de R3 y R5) muestra solo cuándo, dónde y Gestionar: nunca ceros inventados | finalizado · en curso · borrador (tira punteada) · recorrido 0 y parcial · sin métricas |

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
- En el admin, las tablas pasan a lista de tarjetas por debajo de 640 px. `DataTable` ya
  lo hace (cada celda lleva el nombre de su columna); las de la plataforma todavía se
  corren de costado.
- Sin hover como única forma de llegar a algo.
- Contemplar la red lenta: las mutaciones muestran el resultado optimista solo
  cuando revertirlo es seguro (nunca en el reclamo de medallas ni en el sorteo).

## Movimiento

- La celebración de la medalla es el único momento con movimiento protagonista.
  En el resto: transiciones cortas, menos de 200 ms, que acompañan el cambio de
  estado.
- La landing tiene su propia entrada, también en pasos y solo con `transform` y
  `opacity`: la consola sube a su lugar (400 ms) y las tarjetas de marca caen a su escalón al entrar en pantalla. El título
  y el botón no se animan.
- Con `prefers-reduced-motion`, la celebración se resuelve sin animación, y la
  landing aparece quieta y completa.

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
