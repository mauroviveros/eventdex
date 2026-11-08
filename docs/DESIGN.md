---
name: Eventdex
description: Una pantalla LCD de cuatro tonos que toma el color de cada organización.
colors:
  ramp-0: "oklch(0.94 0.08 125)"
  ramp-1: "oklch(0.8 0.12 125)"
  ramp-2: "oklch(0.5 0.09 125)"
  ramp-3: "oklch(0.27 0.05 125)"
  danger: "oklch(0.44 0.21 27)"
  danger-dark: "oklch(0.7 0.19 27)"
  accent-red: "oklch(0.47 0.19 25)"
  accent-red-dark: "oklch(0.7 0.19 25)"
  accent-yellow: "oklch(0.5 0.11 85)"
  accent-yellow-dark: "oklch(0.86 0.15 95)"
typography:
  display-xl:
    fontFamily: "Jersey 10, ui-monospace, monospace"
    fontSize: "3.75rem"
    fontWeight: 400
    lineHeight: 1
  display:
    fontFamily: "Jersey 10, ui-monospace, monospace"
    fontSize: "2.5rem"
    fontWeight: 400
    lineHeight: 1
  headline:
    fontFamily: "Jersey 10, ui-monospace, monospace"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1
  label:
    fontFamily: "Jersey 10, ui-monospace, monospace"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1
  body:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
rounded:
  none: "0"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
components:
  button-primary:
    backgroundColor: "{colors.ramp-3}"
    textColor: "{colors.ramp-0}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.ramp-2}"
    textColor: "{colors.ramp-0}"
  button-secondary:
    backgroundColor: "{colors.ramp-0}"
    textColor: "{colors.ramp-3}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.ramp-1}"
    textColor: "{colors.ramp-3}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.ramp-0}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  button-danger-hover:
    backgroundColor: "{colors.ramp-3}"
    textColor: "{colors.ramp-0}"
  button-disabled:
    backgroundColor: "{colors.ramp-1}"
    textColor: "{colors.ramp-2}"
  field:
    backgroundColor: "{colors.ramp-0}"
    textColor: "{colors.ramp-3}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  form-message-success:
    backgroundColor: "{colors.ramp-1}"
    textColor: "{colors.ramp-3}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
  phase-badge-live:
    backgroundColor: "{colors.ramp-3}"
    textColor: "{colors.ramp-0}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "2px 8px"
  medal-tile:
    rounded: "{rounded.none}"
    size: "96px"
  panel:
    backgroundColor: "{colors.ramp-0}"
    textColor: "{colors.ramp-3}"
    rounded: "{rounded.none}"
    padding: "32px 24px"
  empty-state:
    backgroundColor: "{colors.ramp-0}"
    textColor: "{colors.ramp-3}"
    rounded: "{rounded.none}"
    padding: "32px 24px"
  marquee-tab:
    backgroundColor: "{colors.ramp-0}"
    textColor: "{colors.accent-yellow}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  marquee-title:
    backgroundColor: "{colors.ramp-0}"
    textColor: "{colors.accent-red}"
    typography: "{typography.display-xl}"
    rounded: "{rounded.none}"
    padding: "24px 40px"
  level-current:
    backgroundColor: "{colors.ramp-1}"
    textColor: "{colors.ramp-3}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "16px 20px"
  qr-code:
    backgroundColor: "{colors.ramp-0}"
    textColor: "{colors.ramp-3}"
    rounded: "{rounded.none}"
    width: "40mm"
---

# Eventdex — Diseño visual

`v0.2 · 2026-11-07` · Relacionados: [PRODUCT](./PRODUCT.md) · [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) · [RUTAS](./RUTAS.md)

> Este archivo lo genera `/impeccable document` a partir del código que ya
> está construido; no se escribe a mano. Decide **colores, tipografía y
> formas**. Cómo se comporta la interfaz (estados, voz, mobile,
> accesibilidad) lo decide [DESIGN_SYSTEM](./DESIGN_SYSTEM.md). Los tokens del
> frontmatter son normativos; la prosa explica dónde y por qué se usan. Fuente:
> `src/app/globals.css`, `src/domain/palette.ts` y los componentes que se ven
> en `/dev/componentes`.

## Overview

**Creative North Star: "La consola de bolsillo"**

Eventdex se ve como la pantalla LCD de cuatro tonos de una consola de mano,
como la vieja app de eventos. Cuatro tonos de un solo color hacen todo el
trabajo: fondo, relleno, secundario y tinta. Cada organización recibe su propia
rampa desde el color de su marca (un cambio de paleta, como en los juegos), así
que la marca manda y el contraste lo fija la luminosidad, nunca la suerte.

Todo es plano, cuadrado y en grilla de píxeles: líneas de 2 px, esquinas a 90°,
paneles con doble filete como las cajas de diálogo de una consola. El
movimiento es por pasos, nunca suave: una medalla nueva se "revela" pasando por
los tonos en cuadros discretos. En la app pública del visitante la pantalla
suma lo que tenía el cartel de la vieja app: líneas de barrido sobre todo y dos
acentos de marquesina, rojo para el título del evento y amarillo para lo que se
lee de un vistazo. Rechaza el default de la categoría: tarjetas blancas de SaaS
con acento azul y confeti, y el hero de evento con foto y botón.

**Key Characteristics:**
- Cuatro tonos de un solo matiz, usados como roles; el oscuro invierte la rampa y el papel siempre es claro.
- Fuera de la rampa, solo peligro (siempre con ícono) y, en la app pública, los dos acentos de marquesina (siempre sobre el fondo).
- Logos posterizados a los cuatro tonos; sprites de 12×12 cuando no hay logo.
- Jersey 10 en múltiplos de 10 px para títulos, contadores y códigos; Atkinson Hyperlegible Next para leer.
- Esquinas rectas, filetes de 2 px, sin sombras suaves; líneas de barrido como textura en la app pública.
- Movimiento en pasos (`steps(1, end)`), apagado con `prefers-reduced-motion`.

## Colors

Una rampa de cuatro tonos de un solo matiz (Eventdex: verde arveja, matiz 125),
un rojo que solo significa "algo está mal" y, en la app pública, dos acentos de
marquesina de matiz fijo.

### Primary
- **Tinta de cristal líquido** (`ramp-3`): el tono más oscuro. En claro es la
  tinta: texto, filetes de 2 px, botón primario, segmentos conseguidos del
  progreso, anillo de foco, módulos del QR.

### Secondary
- **Verde secundario** (`ramp-2`): texto secundario (`text-muted-foreground`),
  bordes punteados de lo pendiente y de los estados vacíos, pestañas del cartel,
  jornadas hechas, hover del botón primario, scrollbar.

### Tertiary
- **Peligro** (`danger`, y `danger-dark` en oscuro): errores de campo y de
  formulario, botón destructivo, el recuadro de confirmación de una acción que
  no se deshace, el estado bloqueado de la celebración.
- **Rojo de marquesina** (`accent-red`, y `accent-red-dark` en oscuro): solo en
  la app pública, y solo para el título del evento en la placa del cartel.
- **Amarillo de marquesina** (`accent-yellow`, y `accent-yellow-dark` en
  oscuro): solo en la app pública, para lo que se lee de un vistazo: la fecha
  (y el horario si hay una sola jornada) y el nombre de la sede en las pestañas
  del cartel.

Los acentos son de matiz fijo, no de la marca: salen de `ACCENT` en
`palette.ts` y se usan con `text-accent-red` y `text-accent-yellow`. El rojo
queda cerca de `danger` a propósito (es el look de la v1); lo que los separa es
el ícono: peligro siempre lleva `AlertIcon`, un título nunca.

### Neutral
- **Verde arveja pálido** (`ramp-0`): el fondo de la pantalla en claro, el
  texto sobre tinta y el fondo del QR (su zona de silencio).
- **Verde relleno** (`ramp-1`): áreas rellenas; medalla pendiente o silueta,
  segmentos de la meta del sorteo, hover del botón secundario, opción
  seleccionada, estado deshabilitado, mensaje de éxito de un formulario y la
  jornada encendida.

### Paleta y roles
`--ramp-0..3` es la **paleta**, de más claro a más oscuro. `--lcd-0..3` son
**roles**, no colores: 0 fondo, 1 relleno, 2 secundario, 3 tinta. Los
componentes solo usan roles (`bg-lcd-*`, `text-lcd-*`, `border-lcd-*`, y los
alias `background`, `foreground`, `muted-foreground`, `fill`, `rule`,
`primary`). En claro los roles siguen la rampa en orden; en oscuro (el oliva de
la vieja app) se invierte: `--lcd-0` = `--ramp-3` y `--lcd-3` = `--ramp-0`, y
`--danger`, `--accent-red`, `--accent-yellow` y `--scanline` pasan a su valor
oscuro. El esquema lo elige `prefers-color-scheme`, y una `.ramp-scope` lo
puede forzar con `data-scheme="light"` o `data-scheme="dark"`. Toda capa que
define `--ramp-*` lleva la clase `.ramp-scope` para que los roles se resuelvan
contra su rampa.

**Impresión.** Con `@media print` todo vuelve a los roles claros (también los
acentos, peligro y la línea de barrido), aunque la pantalla esté en oscuro: el
fondo no se entinta y un QR nunca sale invertido.

### Cambio de paleta por organización
`rampFromHex(hex)` convierte el color de marca a OKLCH y se queda solo con el
**matiz** y la **saturación** (croma / 0.08, tope 1). La luminosidad de cada
tono es fija (0.94, 0.8, 0.5, 0.27) y el croma se recorta al gamut sRGB; un gris
da una rampa gris y un hex inválido vuelve a la rampa de Eventdex. Las garantías
están testeadas para los 36 matices de 10° en `palette.test.ts`:
- tinta sobre fondo ≥ 7:1; secundario sobre fondo ≥ 4.5:1; tinta sobre relleno
  ≥ 4.5:1;
- los mismos pares en oscuro (con la rampa invertida) cumplen lo mismo;
- peligro sobre el fondo de su esquema ≥ 4.5:1, y a distancia OKLab ≥ 0.1 de
  cada tono, así se distingue aunque la marca sea roja;
- cada acento sobre el fondo de su esquema (`ramp-0` en claro, `ramp-3` en
  oscuro) ≥ 4.5:1. Sobre relleno o tinta no hay garantía.

### Named Rules
**The Four Tones Rule.** Un componente se pinta solo con `--lcd-0..3`. Nunca
con `--ramp-*` directo (rompería el modo oscuro) ni con un color nuevo. Las
únicas excepciones son `danger` y los dos acentos de marquesina, y cada una
tiene su regla.

**The Brand Is A Hue Rule.** La marca de una organización aporta matiz y
saturación; la luminosidad la pone la rampa. Nunca se usa el hex de la marca
tal cual.

**The Danger Wears An Icon Rule.** `danger` significa "algo está mal" y siempre
va con el ícono de alerta pixelado (`AlertIcon`, 8×8 en `currentColor`); el
color nunca carga el significado solo.

**The Marquee Accent Rule.** Los acentos son de la app pública y van solo como
texto sobre el fondo (`--lcd-0`), nunca sobre relleno ni sobre tinta: ahí no
tienen contraste garantizado. Rojo solo para el título del evento; amarillo
solo para lo que se lee de un vistazo (fecha, sede). Un texto en rojo de
marquesina nunca lleva `AlertIcon`.

**The Paper Is Light Rule.** Lo impreso usa siempre los roles claros.

## Typography

**Display Font:** Jersey 10 (con ui-monospace, monospace), vía `--font-pixel` / `font-display`
**Body Font:** Atkinson Hyperlegible Next (con ui-sans-serif, system-ui, sans-serif), vía `--font-read` / `font-sans`

**Character:** una fuente de píxeles con 8/B, 5/S y 2/Z bien distintos para lo
que se escanea, y una hiperlegible para todo lo que se lee.

### Hierarchy
- **Display XL** (`text-px-4`, 60 px): el título de página desde `sm`; el
  título del evento en la placa del cartel.
- **Display** (`text-px-3`, 40 px): título de página en mobile, títulos de
  sección desde `sm`, contadores (progreso, cuenta regresiva), título de la
  celebración en `/s/[id]`, código del spot en la hoja de QR.
- **Headline** (`text-px-2`, 30 px): títulos de sección en mobile, códigos,
  nombre de la org en el encabezado público, nombre de cada jornada,
  "¡Entrás al sorteo!".
- **Label** (`text-px-1`, 20 px): botones, etiquetas de campo, insignias de
  fase, código del spot, unidades de la cuenta regresiva, pestañas del cartel,
  estado de la jornada ("Ahora", "Próxima", "Hecha").
- **Body** (16 px): todo lo que se lee; párrafos a `max-w-prose` (65ch).
- **Body small** (14 px): notas, pistas y errores de campo, nombre del spot
  bajo la medalla, dirección de la sede.

`h1`, `h2` y `h3` usan Jersey 10 con `text-wrap: balance`. Los números van con
`tabular-nums`.

### Named Rules
**The Ten Pixel Grid Rule.** Jersey 10 solo en `text-px-1..4` (20, 30, 40 y 60
px), múltiplos de su grilla de 10 px, con interlineado 1, así los bordes quedan
nítidos. Nada de texto pixelado debajo de 20 px.

**The Read In Atkinson Rule.** Títulos, contadores y códigos van en Jersey 10;
todo lo que hay que leer (oraciones, pistas, errores) va en Atkinson
Hyperlegible Next.

## Layout

Mobile primero (360 px). Contenido centrado con `max-w-6xl` en el admin y
`max-w-3xl` en la app pública, margen lateral de 16 px (24 px desde `sm`). Las
secciones se separan por 48 px y dentro de cada una el ritmo es 24 px; los
grupos chicos usan 4, 8 o 12 px. Cada sección abre con su título cerrado por un
filete de 2 px abajo. Las grillas pasan a dos columnas en `md` y a tres en `xl`;
las pantallas de edición del admin ponen el formulario en una columna de 28rem
desde `xl`. Todo objetivo táctil mide al menos 44 px (`min-h-11`). La medalla es
una casilla de 96 px en una figura de 128 px de ancho.

En la app pública, el cartel abre la portada centrado en al menos media
pantalla (`50dvh`), con 32 px entre el cartel y la cuenta regresiva. La hoja de
QR se mide en milímetros para el A4 (márgenes de 10 mm, tarjetas con 5 mm de
aire y QR de 40 mm), en tres columnas al imprimir.

## Elevation & Depth

Plano. No hay sombras suaves ni capas que flotan: la profundidad se marca con
filetes de 2 px en tinta y con el relleno (`--lcd-1`) para lo seleccionado,
encendido o pendiente. La única `box-shadow` del sistema es la del panel, y es
un filete interno, no una sombra.

### Shadow Vocabulary
- **Doble filete del panel** (`box-shadow: inset 0 0 0 2px var(--lcd-0), inset 0 0 0 4px var(--lcd-3)`,
  sobre un borde de 2 px en tinta): la caja de diálogo de consola. Se usa en la
  pantalla de celebración, en la placa del título del cartel y en la jornada
  encendida (ahí sobre relleno).
- **Líneas de barrido** (`repeating-linear-gradient(0deg, transparent 0 2px, var(--scanline) 2px 4px)`,
  en un `::after` fijo sobre toda la pantalla, sin eventos de puntero): una
  línea de 2 px cada 4 px. `--scanline` es negro al 3 % en claro y al 8 % en
  oscuro; es negro y no tinta porque oscurece el fondo en los dos esquemas y con
  cualquier marca. Con el 3 %, el secundario sigue ≥ 4.6:1 sobre la fila
  rayada en los 36 matices. Hoy solo la usa la app pública (`.scanlines`).

### Named Rules
**The Flat Screen Rule.** Una pantalla LCD no tiene sombras. La jerarquía sale
de filetes, relleno y tamaño de letra; nunca de `box-shadow` difuso.

**The Texture Not A Color Rule.** Las líneas de barrido son textura de
pantalla, no un quinto color: no cargan significado, no se usan para marcar
nada y nunca se imprimen.

## Shapes

Todo es cuadrado: radio 0 en todos lados. Los bordes son de 2 px. Un borde
**sólido** en tinta marca lo presente o activo; un borde sólido en secundario
marca lo que ya pasó (fase "Finalizado", jornada hecha) o una pestaña del
cartel; un borde **punteado** en secundario marca lo pendiente, apagado o en
borrador (medalla pendiente o inactiva, fase "Borrador", jornada por venir,
estado vacío; "Sin fecha" usa punteado en tinta). En papel, el punteado es la
línea de corte de cada tarjeta de QR. Los sprites, el ícono de alerta y el QR
se dibujan con `shape-rendering: crispEdges`.

**The Square Corner Rule.** Sin `border-radius`, sin excepciones.

**The Dashed Means Not Yet Rule.** El borde punteado es el lenguaje de lo que
todavía no está (y, impreso, de por dónde cortar); no se usa como decoración.

## Components

### Buttons
Tipo consola: bloque sólido, letra pixelada, se hunde al tocarlo.
- **Shape:** esquinas rectas (0), borde de 2 px, alto mínimo 44 px, 16 px a los
  lados, Jersey 10 a 20 px.
- **Primary:** tinta con texto en fondo; hover pasa a secundario.
- **Secondary:** fondo con borde y texto en tinta; hover rellena con `--lcd-1`.
- **Danger:** `danger` con texto en fondo; hover pasa a tinta.
- **Hover / Focus / Active:** cambio de color en 100 ms; al presionar baja 2 px
  (`translate-y-0.5`); el foco es el anillo global.
- **Pending:** tres bloques de 6 px que parpadean en turno (cada 333 ms) y la
  etiqueta pasa a "Publicando…".
- **Disabled:** relleno con borde y texto en secundario.
- **Botón de acción** (`ActionButton`): un formulario de un solo botón, con su
  error abajo. Si lo que hace no se deshace, el primer toque abre un recuadro
  con borde de 2 px en `danger` y 12 px de aire: la consecuencia, el botón de
  peligro (que recibe el foco) y "Cancelar" en secundario.

### Chips (insignia de fase)
- **Style:** borde de 2 px, 2 px × 8 px de padding, Jersey 10 a 20 px.
- **State:** Borrador = punteado secundario; Próximo = relleno; En curso =
  tinta con un bloque de 8 px que parpadea; Finalizado = borde y texto
  secundarios; Sin fecha = punteado en tinta.

### Cards / Containers
- **Corner Style:** rectas (0).
- **Background:** `--lcd-0`.
- **Shadow Strategy:** solo el doble filete del panel (ver Elevation & Depth).
- **Border:** 2 px en tinta; separadores internos con `border-t-2`.
- **Internal Padding:** 32 px arriba y abajo, 24 px a los lados.
- **Estado vacío:** la misma caja con borde punteado en secundario, un título
  a 30 px y el texto que dice qué falta y qué hacer.

### Inputs / Fields
- **Style:** borde de 2 px en tinta, fondo `--lcd-0`, radio 0, alto mínimo 44
  px, 12 px a los lados, texto a 16 px en Atkinson; placeholder en secundario.
  La etiqueta va arriba en Jersey 10 a 20 px. El `select` nativo
  (`SelectField`) usa el mismo marco.
- **Focus:** el anillo global (2 px en tinta, 2 px de separación).
- **Error / Disabled:** error = borde `danger` y mensaje en `danger` a 14 px con
  `AlertIcon`; pista en secundario a 14 px; deshabilitado = relleno con borde y
  texto en secundario.
- **Mensaje del formulario** (`FormMessage`): arriba de los campos. Error =
  texto en `danger` con `AlertIcon`; éxito = recuadro relleno con borde de 2 px
  en tinta, 12 × 16 px de padding.

### Medalla (signature)
Casilla de 96 px con borde de 2 px; adentro, el logo del spot posterizado o,
si no tiene, el sprite de 12×12 de su tipo (stand, atracción, sponsor,
actividad) a 6 px por píxel. Debajo: código en Jersey 10, nombre a 14 px y
estado en Jersey 10. Cuatro estados:
- **Conseguida:** a todo tono, borde sólido en tinta.
- **Pendiente:** silueta en relleno (logo en el filtro desvaído), borde
  punteado en secundario.
- **Nueva:** fondo relleno y la revelación en pasos.
- **Inactiva:** silueta tramada: el sprite pierde un píxel de cada dos y el
  logo lleva una máscara de damero de 4 px, así el fondo se ve a través.

**Logos posterizados.** `LcdFilters` renderiza filtros SVG que pasan la imagen a
luminancia y la cuantizan en cuatro bandas mapeadas a **roles**: lo más claro
(el fondo del logo) cae en el fondo, lo más oscuro en la tinta. Hay tres
intensidades (lleno, medio, desvaído) y un juego invertido para oscuro;
`globals.css` elige cuál vía `--logo-full`, `--logo-mid` y `--logo-faded`, así
el logo se invierte con el resto de la pantalla. Se renderizan una vez dentro de
la `.ramp-scope` que define la rampa.

**Revelación (el movimiento firma).** Una medalla nueva pasa de relleno a
secundario a tinta en 900 ms con `steps(1, end)`, en tres cuadros (0, 34 %, 67
%); el logo hace lo mismo pasando por desvaído, medio y lleno. Nada se
interpola.

### Cartel del evento (app pública)
La marquesina de la vieja app, en tres piezas apiladas y centradas:
- **Pestaña de fecha:** borde de 2 px en secundario sin el lado de abajo, fondo
  `--lcd-0`, 8 × 16 px de padding; la fecha (y el horario si hay una sola
  jornada) en Jersey 10 a 20 px en amarillo de marquesina. Se monta 2 px sobre
  la placa, así su filete se funde con el de arriba de la placa.
- **Placa del título:** un panel de doble filete, 24 px de padding (40 px a los
  lados desde `sm`), el título a 40 px (60 px desde `sm`) en rojo de marquesina
  y el resumen en Atkinson a `max-w-prose`.
- **Pestaña de sede:** la misma pestaña colgada abajo (sin el lado de arriba),
  12 × 16 px de padding; el nombre en amarillo a 20 px y la dirección a 14 px en
  tinta.

Debajo van la cuenta regresiva y un link en Jersey 10 a 20 px a las medallas.
Encima de todo, el encabezado de la app pública: el monograma de la org (sus
iniciales en un cuadrado de tinta de 40 px) y su nombre a 30 px, cerrado por un
filete de 2 px en tinta. Eventdex no aparece.

### Jornadas como niveles (app pública)
Una lista de celdas de 16 × 20 px de padding, 12 px entre sí, con el nombre de
la jornada a 30 px y su fecha y horario en Atkinson:
- **Encendida** (la que está en curso o, si no hay, la próxima): celda rellena
  con el doble filete del panel. A la derecha, "Ahora" con un bloque de 12 px
  que parpadea si está en curso, o "Próxima" sin bloque.
- **Hecha:** borde sólido en secundario y texto secundario.
- **Por venir:** borde punteado en secundario.

### Progreso
Barra segmentada: un segmento por spot, en un marco de 2 px con 2 px de
separación. Conseguidos en tinta, los que faltan para la meta en relleno, el
resto vacío. Encima, el contador a 40 px y "de N medallas" a 20 px.

### Cuenta regresiva
Casillas de 2 px en tinta con el número a 40 px (dos dígitos, `tabular-nums`) y
la unidad a 20 px en secundario. En curso y finalizado muestran el estado a 40
px y una línea en secundario.

### Código QR
Un único `path` SVG en `currentColor` (tinta) sobre `--lcd-0`, con
`crispEdges`, corrección de errores media y la zona de silencio de cuatro
módulos dibujada adentro, así no se puede recortar. En la hoja de QR va en una
tarjeta de borde punteado (la línea de corte) con el código a 40 px y el nombre
del spot debajo.

### Superficies del navegador
Tematizadas con los roles: selección en tinta con texto en fondo; foco con
`outline` de 2 px en tinta y 2 px de separación; scrollbar en secundario sobre
fondo; `caret-color` y `accent-color` en tinta; `color-scheme` sigue al
esquema; sin resaltado de tap. Los links subrayan con 2 px de grosor y 0.2em de
separación.

## Do's and Don'ts

### Do:
- **Do** pintar con los roles `--lcd-0..3` y dejar que el esquema los resuelva.
- **Do** derivar la paleta de una organización con `rampFromHex`, y poner la clase `.ramp-scope` en toda capa que defina `--ramp-*`.
- **Do** acompañar `danger` con `AlertIcon`.
- **Do** poner los acentos de marquesina solo como texto sobre `--lcd-0` en la app pública: rojo para el título del evento, amarillo para fecha y sede.
- **Do** usar Jersey 10 solo en `text-px-1..4` (20/30/40/60 px).
- **Do** usar bordes de 2 px: sólidos para lo presente, punteados para lo pendiente.
- **Do** animar en pasos (`steps(1, end)`): la revelación de 900 ms y el parpadeo de 1 s para lo que está en vivo.
- **Do** mostrar el sprite de 12×12 del tipo de spot cuando no hay logo.
- **Do** dejar que la impresión vuelva a los roles claros y apague las líneas de barrido.

### Don't:
- **Don't** usar `border-radius` ni sombras suaves.
- **Don't** usar texto pixelado debajo de 20 px ni en tamaños fuera de la grilla de 10 px.
- **Don't** agregar un color fuera de la rampa más allá de `danger` y los dos acentos de marquesina, ni usar el hex de la marca tal cual.
- **Don't** poner un acento sobre relleno (`--lcd-1`) o tinta, ni usarlo para avisar un error: eso es `danger` con su ícono.
- **Don't** usar las líneas de barrido para marcar nada ni subir su opacidad: son textura.
- **Don't** mostrar un logo sin pasarlo por los filtros LCD.
- **Don't** interpolar movimiento (easing suave); y todo se apaga con `prefers-reduced-motion`: la medalla nueva aparece revelada y nada parpadea.
- **Don't** volver a tarjetas blancas de SaaS con acento azul y confeti.
