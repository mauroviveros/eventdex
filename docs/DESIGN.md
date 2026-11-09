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
  plate: "oklch(0.9424 0.0768 125)"
  plate-dark: "oklch(0.2992 0.048 125)"
typography:
  display-2xl:
    fontFamily: "Jersey 10, ui-monospace, monospace"
    fontSize: "5rem"
    fontWeight: 400
    lineHeight: 1
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
  title:
    fontFamily: "Press Start 2P, ui-monospace, monospace"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.25
  title-lg:
    fontFamily: "Press Start 2P, ui-monospace, monospace"
    fontSize: "2rem"
    fontWeight: 400
    lineHeight: 1.25
  numeral:
    fontFamily: "Press Start 2P, ui-monospace, monospace"
    fontSize: "2rem"
    fontWeight: 400
    lineHeight: 1
  lead:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.4
  body-lg:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.56
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
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
  "16": "64px"
  "24": "96px"
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
    backgroundColor: "{colors.plate}"
    textColor: "{colors.accent-yellow}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  marquee-title:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.accent-red}"
    typography: "{typography.title-lg}"
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
  console-a-button:
    backgroundColor: "{colors.accent-red}"
    textColor: "{colors.ramp-0}"
    typography: "{typography.display}"
    rounded: "{rounded.none}"
    size: "80px"
  console-a-button-hover:
    backgroundColor: "{colors.ramp-3}"
    textColor: "{colors.ramp-0}"
  console-medal-tile:
    rounded: "{rounded.none}"
    size: "144px"
---

# Eventdex — Diseño visual

`v0.4 · 2026-11-09` · Relacionados: [PRODUCT](./PRODUCT.md) · [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) · [RUTAS](./RUTAS.md)

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

Todo es plano (salvo las placas de la marquesina, abajo), cuadrado y en grilla
de píxeles: líneas de 2 px, esquinas a 90°,
paneles con doble filete como las cajas de diálogo de una consola. El
movimiento es por pasos, nunca suave: una medalla nueva se "revela" pasando por
los tonos en cuadros discretos. En la app pública del visitante la pantalla
suma lo que tenía el cartel de la vieja app: líneas de barrido sobre todo y dos
acentos de marquesina, rojo para el título del evento y amarillo para lo que se
lee de un vistazo. En las orgs sin skin, además, las placas se levantan del fondo
con una sombra dura. La landing es superficie propia de Eventdex: va con la rampa
verde arveja, sin líneas de barrido. Rechaza el default de la categoría: tarjetas blancas de SaaS
con acento azul y confeti, y el hero de evento con foto y botón.

**Key Characteristics:**
- Cuatro tonos de un solo matiz, usados como roles; el oscuro invierte la rampa y el papel siempre es claro.
- Fuera de la rampa, solo peligro (siempre con ícono) y, en la app pública, los dos acentos de marquesina (siempre sobre el fondo o la placa). La salvedad es el botón A rojo de la consola de la landing.
- Logos tal cual son, en gris solo mientras la medalla está pendiente; sprites de 12×12 cuando no hay logo.
- Jersey 10 en múltiplos de 10 px para títulos, contadores y códigos (sobre la marquesina de la app pública, Press Start 2P para títulos de página y contadores); Atkinson Hyperlegible Next para leer.
- Esquinas rectas, filetes de 2 px, sin sombras suaves; líneas de barrido como textura en la app pública; en la app pública de las orgs sin skin, placas levantadas con sombra dura.
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
  la app pública, para el título del evento en la placa del cartel y el `h1` de
  `/sorteo`. La única excepción es el relleno del botón A de la consola de la
  landing.
- **Amarillo de marquesina** (`accent-yellow`, y `accent-yellow-dark` en
  oscuro): solo en la app pública, para lo que se lee de un vistazo: la fecha
  (y el horario si hay una sola jornada) y el nombre de la sede en las pestañas
  del cartel, y el nombre del evento en `/sorteo`.

Los acentos son de matiz fijo, no de la marca: salen de `ACCENT` en
`palette.ts` y se usan con `text-accent-red` y `text-accent-yellow` (y
`bg-accent-red` solo en ese botón A). El rojo
queda cerca de `danger` a propósito (es el look de la v1); lo que los separa es
el ícono: peligro siempre lleva `AlertIcon`, un título nunca.

### Neutral
- **Verde arveja pálido** (`ramp-0`): el fondo de la pantalla en claro, el
  texto sobre tinta y el fondo del QR (su zona de silencio).
- **Verde relleno** (`ramp-1`): áreas rellenas; medalla pendiente o silueta,
  segmentos de la meta del sorteo, hover del botón secundario, opción
  seleccionada, estado deshabilitado, mensaje de éxito de un formulario y la
  jornada encendida.
- **Placa de marquesina** (`plate`, y `plate-dark` en oscuro): solo en la app
  pública sin skin. El fondo levantado apenas: pestañas y placa del cartel,
  casillas, barra de progreso, medalla conseguida, botón secundario, menú del
  visitante.

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

**Placa y marquesina.** La clase `.marquesina`
(`src/components/visitante/marquesina.ts`), que el layout de la app pública pone
en las orgs sin skin, prende cuatro tokens: `--plate` (el fondo con 4 % de blanco,
`color-mix` en oklch), `--plate-rule` y `--cell-rule` (`--ramp-2`, el mismo tono
medio en claro y en oscuro) y `--plate-cast` (el fondo al 72 % con negro). Afuera
de esa clase caen a lo plano: `--plate` = `--lcd-0`, `--plate-rule` = `--lcd-2`,
`--cell-rule` = `--lcd-3` y `--plate-cast` transparente, así que el admin, la
landing y los skins se ven igual que siempre.

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
  oscuro) ≥ 4.5:1. Sobre relleno o tinta no hay garantía. El botón A usa ese
  mismo par al revés: `--lcd-0` sobre el rojo;
- tinta, secundario, peligro y los dos acentos sobre la placa de su esquema
  ≥ 4.5:1. El 4 % de `PLATE_LIFT` es lo máximo que deja en AA al rojo oscuro y a
  peligro en los 36 matices.

### Skins por organización
Una org con skin (`src/skins/`) no pasa por `rampFromHex`: define a mano sus cuatro
tonos y acentos, y su test repite los pares de arriba. Redefine los roles, así que
los componentes no cambian. Sus reglas valen dentro de su `data-skin`, y las de esta
página para todo lo demás. **Burning Tower Fest** es el cartel: papel crema en claro
y negro en oscuro, un solo rojo para título, fecha y sede, Anton en mayúsculas en vez
de Jersey 10, recuadro de un filete de 4 px en vez del doble filete, y sin líneas de
barrido.

### Named Rules
**The Four Tones Rule.** Un componente se pinta solo con `--lcd-0..3`. Nunca
con `--ramp-*` directo (rompería el modo oscuro) ni con un color nuevo. Las
únicas excepciones son `danger` y los dos acentos de marquesina, y cada una
tiene su regla. `--plate` no es un quinto tono: es un paso derivado del fondo.
Junto con `--plate-rule`, `--cell-rule` y `--plate-cast` se define una sola vez
en `.marquesina`, y los componentes los usan por su nombre.

**The Brand Is A Hue Rule.** La marca de una organización aporta matiz y
saturación; la luminosidad la pone la rampa. Nunca se usa el hex de la marca
tal cual.

**The Danger Wears An Icon Rule.** `danger` significa "algo está mal" y siempre
va con el ícono de alerta pixelado (`AlertIcon`, 8×8 en `currentColor`); el
color nunca carga el significado solo.

**The Marquee Accent Rule.** Los acentos son de la app pública y van solo como
texto sobre el fondo (`--lcd-0`) o sobre la placa (`--plate`), nunca sobre
relleno ni sobre tinta: ahí no tienen contraste garantizado. Rojo solo para el título del evento; amarillo
solo para lo que se lee de un vistazo (fecha, sede). En `/sorteo`, el `h1` va en rojo y el nombre del evento en
amarillo. Un texto en rojo de
marquesina nunca lleva `AlertIcon`. La única excepción es la de The Red A Rule.

**The Red A Rule.** El botón A de la consola de la landing es la única
superficie rellena con un acento: `bg-accent-red` con `text-lcd-0`, y solo ese
botón. No habilita otros rellenos de acento ni lleva el amarillo a fondo.

**The Own Surface Rule.** La landing y su consola son superficie propia de
Eventdex: usan la rampa de `:root` y nunca llevan `.scanlines`. Una rampa de
marca solo aparece en una muestra con su propia `.ramp-scope`.

**The Paper Is Light Rule.** Lo impreso usa siempre los roles claros.

## Typography

**Display Font:** Jersey 10 (con ui-monospace, monospace), vía `--font-pixel` / `font-display`
**Wide Display Font:** Press Start 2P (con ui-monospace, monospace), la letra del cartel de la v1, vía `--wide-face` / `font-wide`; solo con `.marquesina`
**Body Font:** Atkinson Hyperlegible Next (con ui-sans-serif, system-ui, sans-serif), vía `--font-read` / `font-sans`

**Character:** una fuente de píxeles con 8/B, 5/S y 2/Z bien distintos para lo
que se escanea, y una hiperlegible para todo lo que se lee.

### Hierarchy
- **Title** (`font-wide`, `text-title` 24 px y `text-title-lg` 32 px desde `sm`,
  interlineado 1.25): el `h1` de las páginas de la app pública y el título del
  evento en la placa del cartel. Las pantallas de un solo mensaje (ingreso,
  error, celebración) se quedan en 24 px.
- **Numeral** (`font-wide`, `text-numeral` 32 px, interlineado 1): los números
  de la cuenta regresiva y del progreso, y los estados "En curso" y "Finalizado".
- **Display 2XL** (`text-px-5`, 80 px): solo el `h1` de la landing desde 1400 px
  de ancho.
- **Display XL** (`text-px-4`, 60 px): el título de página desde `sm`; fuera de
  la marquesina, el título del evento en la placa del cartel; en la landing, el `h1` por debajo
  de 1400 px, los títulos de sección y los numerales de los pasos.
- **Display** (`text-px-3`, 40 px): título de página en mobile, títulos de
  sección desde `sm`, código del spot en la hoja de QR; fuera de la marquesina,
  contadores (progreso, cuenta regresiva) y título de la celebración en
  `/s/[id]`; en la landing,
  los pasos rápidos, el título de cada paso, el estado de la consola y la A.
- **Headline** (`text-px-2`, 30 px): títulos de sección en mobile, códigos,
  nombre de la org en el encabezado público, nombre de cada jornada,
  "¡Entrás al sorteo!", "Arranca en".
- **Label** (`text-px-1`, 20 px): botones, etiquetas de campo, insignias de
  fase, código del spot, unidades de la cuenta regresiva, pestañas del cartel,
  estado de la jornada ("Ahora", "Próxima", "Hecha").
- **Lead** (20 px, Atkinson): solo en la landing, la bajada del hero y de las
  secciones de quién y prueba.
- **Body large** (18 px, Atkinson): solo en la landing, los textos de pasos,
  marca y contacto.
- **Body** (16 px): todo lo que se lee; párrafos a `max-w-prose` (65ch).
- **Body small** (14 px): notas, pistas y errores de campo, nombre del spot
  bajo la medalla, dirección de la sede.

`h1`, `h2` y `h3` usan Jersey 10 con `text-wrap: balance`. Los números van con
`tabular-nums`.

Sin `.marquesina`, `font-wide` y los tamaños `text-title`, `text-title-lg` y
`text-numeral` resuelven a Jersey 10 en 40, 60 y 40 px (en un skin, a la letra del
skin). Con ella, Press Start 2P corta las palabras largas
(`overflow-wrap: anywhere`) porque cada letra mide un em. Oraciones y resúmenes
siguen en Atkinson; pestañas, etiquetas, títulos de sección y unidades, en
Jersey 10.

### Named Rules
**The Ten Pixel Grid Rule.** Jersey 10 solo en `text-px-1..5` (20, 30, 40, 60 y
80 px), múltiplos de su grilla de 10 px, con interlineado 1, así los bordes
quedan nítidos. `text-px-5` es solo para el `h1` de la landing desde 1400 px.
Esta grilla es solo de Jersey 10: Press Start 2P va en la suya de 8 px (24 y 32
px). Nada de texto pixelado debajo de 20 px.

**The Read In Atkinson Rule.** Títulos, contadores y códigos van en Jersey 10
(títulos de página y contadores, en Press Start 2P sobre la marquesina de la app
pública); todo lo que hay que leer (oraciones, pistas, errores) va en Atkinson
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

La landing usa `max-w-5xl` (el hero llega a 90rem), margen lateral de 16 px (32
px desde `sm`) y 64 px de aire vertical por sección (96 px desde `sm`). Las
secciones se separan con un filete de 2 px o con un cambio de fondo entre
`--lcd-0`, `--lcd-1` y `--lcd-3`.

## Elevation & Depth

Plano. No hay sombras suaves ni capas que flotan: la profundidad se marca con
filetes de 2 px en tinta y con el relleno (`--lcd-1`) para lo seleccionado,
encendido o pendiente. La salvedad es la marquesina de la app pública sin skin,
donde las placas se levantan del fondo con una sombra dura, sin difuminar. Fuera
de ella, la única `box-shadow` del sistema es la del panel, y es un filete
interno, no una sombra.

### Shadow Vocabulary
- **Doble filete del panel** (`box-shadow: inset 0 0 0 2px var(--lcd-0), inset 0 0 0 4px var(--lcd-3)`,
  sobre un borde de 2 px en tinta): la caja de diálogo de consola. Se usa en la
  pantalla de celebración, en la placa del título del cartel y en la jornada
  encendida (ahí sobre relleno).
- **Sombra dura de la marquesina** (`shadow-plate`, `box-shadow: 4px 4px 0 var(--plate-cast)`):
  solo se ve en la app pública sin skin; afuera `--plate-cast` es transparente.
  La llevan las pestañas del cartel, las casillas de la cuenta regresiva, la
  barra de progreso, la medalla conseguida, los botones (menos al presionarlos o
  deshabilitados), el menú del visitante, el link de ingreso y los eventos sin
  elegir en Mis medallas.
- **Panel sobre la marquesina** (`box-shadow: inset 0 0 0 2px var(--lcd-3), 4px 4px 0 var(--plate-cast)`,
  sobre un borde de 2 px en `--plate-rule` y con relleno `--plate`): reemplaza
  al doble filete en todo `.panel` de la marquesina. La jornada encendida
  conserva su relleno.
- **Líneas de barrido** (`repeating-linear-gradient(0deg, transparent 0 2px, var(--scanline) 2px 4px)`,
  en un `::after` fijo sobre toda la pantalla, sin eventos de puntero): una
  línea de 2 px cada 4 px. `--scanline` es negro al 3 % en claro y al 8 % en
  oscuro; es negro y no tinta porque oscurece el fondo en los dos esquemas y con
  cualquier marca. Con el 3 %, el secundario sigue ≥ 4.6:1 sobre la fila
  rayada en los 36 matices. Hoy solo la usa la app pública (`.scanlines`); la
landing no la lleva.

### Named Rules
**The Flat Screen Rule.** Una pantalla LCD no tiene sombras. La jerarquía sale
de filetes, relleno y tamaño de letra; nunca de `box-shadow` difuso. La única
salvedad es la sombra dura de la marquesina (`shadow-plate`): 4 px, sin
difuminar, solo en la app pública sin skin. El admin, la landing y los skins
siguen planos.

**The Texture Not A Color Rule.** Las líneas de barrido son textura de
pantalla, no un quinto color: no cargan significado, no se usan para marcar
nada y nunca se imprimen.

## Shapes

Todo es cuadrado: radio 0 en todos lados. Los bordes son de 2 px. Un borde
**sólido** en tinta marca lo presente o activo; un borde sólido en secundario
marca lo que ya pasó (fase "Finalizado", jornada hecha) o, fuera de la
marquesina, una pestaña del cartel. Sobre la marquesina, las pestañas van en
`--plate-rule` y las casillas (cuenta regresiva, barra de progreso) en
`--cell-rule`, los dos en `--ramp-2`. Un borde **punteado** en secundario marca lo pendiente, apagado o en
borrador (medalla pendiente o inactiva, fase "Borrador", jornada por venir,
estado vacío; "Sin fecha" usa punteado en tinta). En papel, el punteado es la
línea de corte de cada tarjeta de QR. Los sprites, los íconos pixelados y el QR
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
- **Secondary:** `--plate` con borde y texto en tinta; hover rellena con `--lcd-1`.
- **Danger:** `danger` con texto en fondo; hover pasa a tinta.
- **Hover / Focus / Active:** cambio de color en 100 ms; al presionar baja 2 px
  (`translate-y-0.5`); el foco es el anillo global. En la marquesina llevan la
  sombra dura, que se apaga al presionar.
- **Pending:** tres bloques de 6 px que parpadean en turno (cada 333 ms) y la
  etiqueta pasa a "Publicando…".
- **Disabled:** relleno con borde y texto en secundario, sin sombra.
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
- **Background:** `--lcd-0` (`--plate` sobre la marquesina).
- **Shadow Strategy:** el doble filete del panel; sobre la marquesina, su variante con filete interno en tinta y sombra dura (ver Elevation & Depth).
- **Border:** 2 px en tinta (`--plate-rule` sobre la marquesina); separadores internos con `border-t-2`.
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
Casilla de 96 px con borde de 2 px; adentro, el logo original del spot, entero, o,
si no tiene, el sprite de 12×12 de su tipo (stand, atracción, sponsor,
actividad) a 6 px por píxel. Debajo: código en Jersey 10, nombre a 14 px y
estado en Jersey 10. Cuatro estados:
- **Conseguida:** a todo tono (logo a color real), borde sólido en tinta,
  relleno `--plate` y sombra dura.
- **Pendiente:** silueta en relleno (logo en gris, al 50 %), borde punteado en
  secundario.
- **Nueva:** fondo relleno y la revelación en pasos.
- **Inactiva:** silueta tramada: el sprite pierde un píxel de cada dos y el
  logo lleva una máscara de damero de 4 px, así el fondo se ve a través.

**Logos tal cual.** El logo es el arte de quien lo subió: no pasa por la rampa ni
se invierte en oscuro, y se ajusta sin recortarse. El único tratamiento es el gris
de la medalla que falta conseguir; ganarla le devuelve el color.

**Revelación (el movimiento firma).** Una medalla nueva pasa de relleno a
secundario a tinta en 900 ms con `steps(1, end)`, en tres cuadros (0, 34 %, 67
%); el logo hace lo mismo, de gris a color. Nada se interpola.

### Cartel del evento (app pública)
La marquesina de la vieja app, en tres piezas apiladas y centradas. Si el evento
tiene banner, va arriba, tal cual se subió, con borde de 2 px en tinta y hasta el
70 % del alto de la pantalla; lo escrito en la imagen no reemplaza a las piezas:
- **Pestaña de fecha:** borde de 2 px en `--plate-rule` sin el lado de abajo,
  fondo `--plate`, sombra dura, 8 × 16 px de padding; un reloj pixelado de 8×8
  (`ClockIcon`) a 24 px en secundario y la fecha (y el horario si hay una sola
  jornada) en Jersey 10 a 20 px en amarillo de marquesina. Se mete 2 px debajo
  de la placa.
- **Placa del título:** un panel a todo el ancho de la columna y montado encima
  de las dos pestañas, 24 px de padding (40 px a los lados desde `sm`), el título
  en Press Start 2P en rojo de marquesina y el resumen en Atkinson a
  `max-w-prose`.
- **Pestaña de sede:** la misma pestaña colgada abajo (sin el lado de arriba),
  12 × 16 px de padding y el texto alineado a la izquierda; el nombre en amarillo
  a 20 px y la dirección a 14 px en tinta.

Debajo van la cuenta regresiva y un link en Jersey 10 a 20 px a las medallas.
Encima de todo, el encabezado de la app pública: el monograma de la org (sus
iniciales en un cuadrado de tinta de 40 px) y su nombre a 30 px, cerrado por un
filete de 2 px en tinta. Eventdex no aparece. El desplegable del menú del
visitante y el link "Ingresar" van en `--plate` con borde de 2 px en tinta y
sombra dura.

### Jornadas como niveles (app pública)
Una lista de celdas de 16 × 20 px de padding, 12 px entre sí, con el nombre de
la jornada a 30 px y su fecha y horario en Atkinson:
- **Encendida** (la que está en curso o, si no hay, la próxima): celda rellena
  con el doble filete del panel. A la derecha, "Ahora" con un bloque de 12 px
  que parpadea si está en curso, o "Próxima" sin bloque.
- **Hecha:** borde sólido en secundario y texto secundario.
- **Por venir:** borde punteado en secundario.

### Progreso
Barra segmentada: un segmento por spot, en un marco de 2 px en tinta
con relleno `--plate`, sombra dura y 2 px de separación. Conseguidos en tinta,
los que faltan para la meta en relleno, el resto vacío. Encima, el contador en
Numeral y "de N medallas" a 20 px.

### Cuenta regresiva
Siempre tres casillas (Días, Horas, Minutos) bajo un "Arranca en" en Jersey 10 a
30 px. Cada casilla lleva borde de 2 px en `--cell-rule`, relleno `--plate`,
sombra dura y 12 px de padding, con el número en Numeral (dos dígitos,
`tabular-nums`) y la unidad a 20 px en secundario. En curso y finalizado son una
sola casilla igual, con el estado en Title y una línea en secundario.

### Código QR
Un único `path` SVG en `currentColor` (tinta) sobre `--lcd-0`, con
`crispEdges`, corrección de errores media y la zona de silencio de cuatro
módulos dibujada adentro, así no se puede recortar. En la hoja de QR va en una
tarjeta de borde punteado (la línea de corte) con el código a 40 px y el nombre
del spot debajo.

### Consola de la landing
Superficie propia de Eventdex, jugable. Carcasa plana en `--lcd-0` con borde de
2 px en tinta y sin lado de abajo; la pantalla va enmarcada en secundario y
tiene su propio borde de 2 px en tinta.
- **Casilla de medalla:** 144 px con borde de 2 px y el sprite a 9 px por
  píxel. Conseguida = sólido en tinta; pendiente = punteado en secundario con
  silueta; nueva = fondo relleno y la revelación en pasos.
- **Hilera de colección:** cinco casillas de 32 px (40 px desde `sm`), con el
  mismo código de borde.
- **Cruceta:** brazos de 48 px en tinta con el cheurón de 8×8 en `--lcd-0`;
  hover pasa a secundario.
- **Botón A:** 80 px, relleno en rojo de marquesina, la A en Jersey 10 a 40 px
  en `--lcd-0`, borde de 2 px en tinta; hover pasa a tinta y el foco es el
  anillo global. Es la excepción de The Red A Rule.

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
- **Do** poner los acentos de marquesina solo como texto sobre `--lcd-0` o `--plate` en la app pública: rojo para el título del evento y el `h1` de `/sorteo`, amarillo para fecha, sede y el nombre del evento en `/sorteo`.
- **Do** usar la rampa de Eventdex en la landing y su consola.
- **Do** usar Jersey 10 solo en `text-px-1..5` (20/30/40/60/80 px), con `text-px-5` solo en el `h1` de la landing desde 1400 px.
- **Do** usar bordes de 2 px: sólidos para lo presente, punteados para lo pendiente.
- **Do** animar en pasos (`steps(1, end)`): la revelación de 900 ms y el parpadeo de 1 s para lo que está en vivo.
- **Do** mostrar el sprite de 12×12 del tipo de spot cuando no hay logo.
- **Do** dejar que la impresión vuelva a los roles claros y apague las líneas de barrido.

### Don't:
- **Don't** usar `border-radius` ni sombras suaves, ni dejar que la sombra dura de la marquesina se vea fuera de la app pública sin skin.
- **Don't** usar texto pixelado debajo de 20 px, ni Jersey 10 fuera de su grilla de 10 px, ni Press Start 2P fuera de la suya de 8 px.
- **Don't** agregar un color fuera de la rampa más allá de `danger` y los dos acentos de marquesina, ni usar el hex de la marca tal cual.
- **Don't** poner un acento sobre relleno (`--lcd-1`) o tinta, ni usarlo para avisar un error: eso es `danger` con su ícono.
- **Don't** rellenar con un acento nada más que el botón A de la consola de la landing, ni llevar el amarillo a fondo.
- **Don't** poner `.scanlines` en la landing.
- **Don't** usar las líneas de barrido para marcar nada ni subir su opacidad: son textura.
- **Don't** alterar un logo fuera del gris de la medalla pendiente, ni recortarlo.
- **Don't** interpolar movimiento (easing suave); y todo se apaga con `prefers-reduced-motion`: la medalla nueva aparece revelada y nada parpadea.
- **Don't** volver a tarjetas blancas de SaaS con acento azul y confeti.
