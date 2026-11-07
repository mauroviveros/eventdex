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
---

# Eventdex — Diseño visual

`v0.1 · 2026-11-06` · Relacionados: [PRODUCT](./PRODUCT.md) · [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) · [RUTAS](./RUTAS.md)

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
los tonos en cuadros discretos. Rechaza el default de la categoría: tarjetas
blancas de SaaS con acento azul y confeti.

**Key Characteristics:**
- Cuatro tonos de un solo matiz, usados como roles; el oscuro invierte la rampa.
- Un solo color fuera de la rampa: el de peligro, siempre con ícono.
- Logos posterizados a los cuatro tonos; sprites de 12×12 cuando no hay logo.
- Jersey 10 en múltiplos de 10 px para títulos, contadores y códigos; Atkinson Hyperlegible Next para leer.
- Esquinas rectas, filetes de 2 px, sin sombras suaves.
- Movimiento en pasos (`steps(1, end)`), apagado con `prefers-reduced-motion`.

## Colors

Una rampa de cuatro tonos de un solo matiz (Eventdex: verde arveja, matiz 125),
más un rojo que solo significa "algo está mal".

### Primary
- **Tinta de cristal líquido** (`ramp-3`): el tono más oscuro. En claro es la
  tinta: texto, filetes de 2 px, botón primario, segmentos conseguidos del
  progreso, anillo de foco.

### Secondary
- **Verde secundario** (`ramp-2`): texto secundario (`text-muted-foreground`),
  bordes punteados de lo pendiente, hover del botón primario, scrollbar.

### Tertiary
- **Peligro** (`danger`, y `danger-dark` en modo oscuro): el único color fuera
  de la rampa. Errores de campo, botón destructivo, el estado bloqueado de la
  celebración.

### Neutral
- **Verde arveja pálido** (`ramp-0`): el fondo de la pantalla en claro, y el
  texto sobre tinta.
- **Verde relleno** (`ramp-1`): áreas rellenas; medalla pendiente o silueta,
  segmentos de la meta del sorteo, hover del botón secundario, opción
  seleccionada, estado deshabilitado.

### Paleta y roles
`--ramp-0..3` es la **paleta**, de más claro a más oscuro. `--lcd-0..3` son
**roles**, no colores: 0 fondo, 1 relleno, 2 secundario, 3 tinta. Los
componentes solo usan roles (`bg-lcd-*`, `text-lcd-*`, `border-lcd-*`, y los
alias `background`, `foreground`, `muted-foreground`, `fill`, `rule`,
`primary`). En claro los roles siguen la rampa en orden; en oscuro (el oliva de
la vieja app) se invierte: `--lcd-0` = `--ramp-3` y `--lcd-3` = `--ramp-0`. El
esquema lo elige `prefers-color-scheme`, y una `.ramp-scope` lo puede forzar
con `data-scheme="light"` o `data-scheme="dark"`. Toda capa que define
`--ramp-*` lleva la clase `.ramp-scope` para que los roles se resuelvan contra
su rampa.

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
  cada tono, así se distingue aunque la marca sea roja.

### Named Rules
**The Four Tones Rule.** Un componente se pinta solo con `--lcd-0..3`. Nunca
con `--ramp-*` directo (rompería el modo oscuro) ni con un color nuevo.

**The Brand Is A Hue Rule.** La marca de una organización aporta matiz y
saturación; la luminosidad la pone la rampa. Nunca se usa el hex de la marca
tal cual.

**The Danger Wears An Icon Rule.** `danger` es el único color fuera de la rampa
y siempre va con el ícono de alerta pixelado (`AlertIcon`, 8×8 en
`currentColor`); el color nunca carga el significado solo.

## Typography

**Display Font:** Jersey 10 (con ui-monospace, monospace), vía `--font-pixel` / `font-display`
**Body Font:** Atkinson Hyperlegible Next (con ui-sans-serif, system-ui, sans-serif), vía `--font-read` / `font-sans`

**Character:** una fuente de píxeles con 8/B, 5/S y 2/Z bien distintos para lo
que se escanea, y una hiperlegible para todo lo que se lee.

### Hierarchy
- **Display XL** (`text-px-4`, 60 px): el título de página desde `sm`.
- **Display** (`text-px-3`, 40 px): título de página en mobile, títulos de
  sección desde `sm`, contadores (progreso, cuenta regresiva), título de la
  celebración en `/s/[id]`.
- **Headline** (`text-px-2`, 30 px): títulos de sección en mobile, códigos,
  "¡Entrás al sorteo!".
- **Label** (`text-px-1`, 20 px): botones, etiquetas de campo, insignias de
  fase, código del spot, unidades de la cuenta regresiva.
- **Body** (16 px): todo lo que se lee; párrafos a `max-w-prose` (65ch).
- **Body small** (14 px): notas, pistas y errores de campo, nombre del spot
  bajo la medalla.

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

Mobile primero (360 px). Contenido centrado con `max-w-6xl`, margen lateral de
16 px (24 px desde `sm`). Las secciones se separan por 48 px y dentro de cada
una el ritmo es 24 px; los grupos chicos usan 4, 8 o 12 px. Cada sección abre
con su título y una nota, cerrados por un filete de 2 px abajo. Las grillas
pasan a dos columnas en `md` y a tres en `xl`. Todo objetivo táctil mide al
menos 44 px (`min-h-11`). La medalla es una casilla de 96 px en una figura de
128 px de ancho.

## Elevation & Depth

Plano. No hay sombras suaves ni capas que flotan: la profundidad se marca con
filetes de 2 px en tinta y con el relleno (`--lcd-1`) para lo seleccionado o
pendiente. La única `box-shadow` del sistema es la del panel, y es un filete
interno, no una sombra.

### Shadow Vocabulary
- **Doble filete del panel** (`box-shadow: inset 0 0 0 2px var(--lcd-0), inset 0 0 0 4px var(--lcd-3)`,
  sobre un borde de 2 px en tinta): la caja de diálogo de consola. Se usa en la
  pantalla de celebración.

### Named Rules
**The Flat Screen Rule.** Una pantalla LCD no tiene sombras. La jerarquía sale
de filetes, relleno y tamaño de letra; nunca de `box-shadow` difuso.

## Shapes

Todo es cuadrado: radio 0 en todos lados. Los bordes son de 2 px. Un borde
**sólido** en tinta marca lo presente o activo; un borde **punteado** en
secundario marca lo pendiente, apagado o en borrador (medalla pendiente o
inactiva, fase "Borrador"; "Sin fecha" usa punteado en tinta). Los sprites y el
ícono de alerta se dibujan con `shape-rendering: crispEdges`, un `<rect>` por
píxel.

**The Square Corner Rule.** Sin `border-radius`, sin excepciones.

**The Dashed Means Not Yet Rule.** El borde punteado es el lenguaje de lo que
todavía no está; no se usa como decoración.

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

### Inputs / Fields
- **Style:** borde de 2 px en tinta, fondo `--lcd-0`, radio 0, alto mínimo 44
  px, 12 px a los lados, texto a 16 px en Atkinson; placeholder en secundario.
  La etiqueta va arriba en Jersey 10 a 20 px.
- **Focus:** el anillo global (2 px en tinta, 2 px de separación).
- **Error / Disabled:** error = borde `danger` y mensaje en `danger` a 14 px con
  `AlertIcon`; deshabilitado = relleno con borde y texto en secundario.

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

### Progreso
Barra segmentada: un segmento por spot, en un marco de 2 px con 2 px de
separación. Conseguidos en tinta, los que faltan para la meta en relleno, el
resto vacío. Encima, el contador a 40 px y "de N medallas" a 20 px.

### Cuenta regresiva
Casillas de 2 px en tinta con el número a 40 px (dos dígitos, `tabular-nums`) y
la unidad a 20 px en secundario.

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
- **Do** usar Jersey 10 solo en `text-px-1..4` (20/30/40/60 px).
- **Do** usar bordes de 2 px: sólidos para lo presente, punteados para lo pendiente.
- **Do** animar en pasos (`steps(1, end)`): la revelación de 900 ms y el parpadeo de 1 s para lo que está en vivo.
- **Do** mostrar el sprite de 12×12 del tipo de spot cuando no hay logo.

### Don't:
- **Don't** usar `border-radius` ni sombras suaves.
- **Don't** usar texto pixelado debajo de 20 px ni en tamaños fuera de la grilla de 10 px.
- **Don't** agregar un color fuera de la rampa salvo `danger`, ni usar el hex de la marca tal cual.
- **Don't** mostrar un logo sin pasarlo por los filtros LCD.
- **Don't** interpolar movimiento (easing suave); y todo se apaga con `prefers-reduced-motion`: la medalla nueva aparece revelada y nada parpadea.
- **Don't** volver a tarjetas blancas de SaaS con acento azul y confeti.
