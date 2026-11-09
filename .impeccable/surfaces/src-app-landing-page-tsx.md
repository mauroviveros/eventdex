---
version: 1
slug: "src-app-landing-page-tsx"
primary_target: "src/app/landing/page.tsx"
related_targets: []
---

# Landing de Eventdex

Scope: `/` de la landing (`src/app/landing/page.tsx`). Mode: Persuade. Dentro del mundo LCD establecido (DESIGN.md), con la rampa propia de Eventdex.

Audience: productoras, municipios y organizadores de expos que todavía no son clientes. Job: entender en segundos la mecánica y creerla. Action: escribir por mail. Proof: datos reales de Lo de Charly TCG, autorizados por el dueño del producto: 4 eventos, 644 visitantes, 1649 medallas.

Constraints: sin datos inventados, testimonios ni clientes fuera de los confirmados; voseo; 360 px primero; WCAG 2.2 AA; Lighthouse mobile; sin JS salvo lo que ya traigan los componentes; la mecánica de juntar medallas para llegar a una final se toma de los juegos de colección sin nombrar ni imitar ninguna franquicia.

Unresolved: el mail real de contacto (hoy CONTACT_EMAIL es un relleno).

## Direction contract

THESIS: el evento es una ruta de juego: cada stand es una medalla y juntarlas lleva a la gran final, el sorteo. Rechaza el hero de título, subtítulo y botón sobre una fila de tarjetas iguales.

OWN-WORLD: rampa verde de Eventdex, Jersey 10 y Atkinson, filetes de 2 px, esquinas rectas, líneas de barrido, Medal y Sprite reales, título en rojo de marquesina.

STORY: entendés la ruta y la meta; ves cómo se prepara y cómo se juega con piezas reales del producto; ves que ya se jugó con números reales; escribís.

FIRST VIEWPORT: cabecera con Eventdex y Escribinos; título rojo en dos líneas, "Cada stand, una medalla. Todas, a la gran final."; ruta en S de ocho medallas, tres ganadas, unida por línea punteada; a la derecha la puerta oscura del sorteo final con el contacto.

FORM: "El camino", pedido por el usuario sobre la mecánica de juntar medallas para llegar a una final, compuesto dentro de una ronda de estructuras. seed:72a14d0c34b63f07 (reroll 1; concepto fijado por el usuario, que reemplaza a la mano sorteada). Signature: la tercera medalla se revela por pasos al cargar.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
