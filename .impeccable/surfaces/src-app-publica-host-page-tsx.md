---
version: 1
slug: "src-app-publica-host-page-tsx"
primary_target: "src/app/publica/[host]/page.tsx"
related_targets: ["src/app/publica/[host]/EventHome.tsx","src/app/publica/[host]/layout.tsx"]
---

# Portada pública del evento (dominio de la org)

Scope: `/` (evento activo) y `/eventos/[slug]` en la app del visitante, con la marca de la org. Mode: Persuade. Dentro del mundo LCD establecido (DESIGN.md); nada del mundo cambia.

Audience: el visitante, con el celular en una mano, a veces antes del evento (link compartido) y a veces en el predio. Job: entender en segundos qué evento es, cuándo y dónde, y que hay medallas para juntar. Action: hasta R5 (login y escaneo) es una instrucción, sin botón: escanear el QR de cada stand.

Constraints: solo datos reales (si no hay evento, estado vacío con la marca); la org protagoniza, Eventdex no se ve; 360 px primero; WCAG 2.2 AA; sigue el esquema del sistema; sin JS en el navegador.

## Direction contract

THESIS: el cartel de la vieja app (pestaña con la fecha, placa del título con doble filete, pestaña con la sede) abre la portada, y las jornadas se leen como los niveles de un juego. Rechaza el hero genérico de evento con foto y botón.

OWN-WORLD: tonos de la rampa de la org, Press Start 2P para título y números (la fuente del cartel de la v1), Jersey 10 y Atkinson como DESIGN.md, más dos acentos de marquesina pedidos por el usuario desde la v1: rojo para el título, amarillo para fecha y sede (ACCENT, AA sobre el fondo y la placa en las 36 rampas; nunca sobre relleno). Scanlines sobre toda la pantalla, como la v1. Placas apenas más claras que el fondo con sombra dura (`.marquesina`, 2026-11-09, desde una captura del banner viejo; los skins quedan planos). Pestañas en filete secundario detrás de la placa; la cuenta regresiva va en tres casillas sin segundos; la jornada encendida es una celda rellena de doble filete.

STORY: llegás, ves el cartel del evento con su cuenta regresiva; bajás y ves en qué jornada estás y las medallas que te faltan.

FIRST VIEWPORT: el cartel centrado en al menos 50 dvh: fecha (y horario si es una sola jornada), título y resumen en la placa, sede con dirección; debajo la cuenta regresiva y "N medallas para juntar" con link a la sección de medallas.

FORM: fusión elegida por el usuario de dos estructuras de la ronda: "cartel" (pedido por el usuario desde una captura de la v1) y "niveles" (dealt). seed:401f39cfe918e8f5 (surface roll, dealt 7, 6, 2; fusión del usuario). Signature: la jornada en curso encendida como nivel actual, con el bloque que parpadea.

FINISH: unreviewed is unfinished; this build ends with the finish review and its verdict, and DESIGN.md regenerated: the accents and the scanlines are a system change approved by the user.
