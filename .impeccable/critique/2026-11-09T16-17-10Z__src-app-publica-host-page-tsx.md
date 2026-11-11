---
target: app pública con la marquesina
total_score: 25
max_score: 36
na_heuristics: 7
p0_count: 0
p1_count: 3
target_identity: "file:/Users/mviveros/Development/eventdex/src/app/publica/[host]/page.tsx"
target_fingerprint: "sha256:a4c065200652040df77d4a49f29c881f8c3b50328c8a229b49360001fc67b861"
target_path: /Users/mviveros/Development/eventdex/src/app/publica/[host]/page.tsx
timestamp: 2026-11-09T16-17-10Z
slug: src-app-publica-host-page-tsx
---
Method: dual-agent (A: revisión de diseño · B: detector y navegador)

# Salud del diseño: app pública (25/36, 69 %, Aceptable)

| # | Heurística | Nota | Problema clave |
|---|---|---|---|
| 1 | Visibilidad del estado | 2 | "Ingresar con Google" no da ninguna señal al tocarlo |
| 2 | Lenguaje del usuario | 3 | Se cuela "spot" |
| 3 | Control y libertad | 3 | El menú de la cuenta no se cierra al tocar afuera |
| 4 | Consistencia | 3 | "Spot" y "stand"; la portada contradice a Mis medallas |
| 5 | Prevención de errores | 3 | Falta frenar el doble toque en Google |
| 6 | Reconocer antes que recordar | 2 | La portada no muestra lo que ya juntaste |
| 7 | Flexibilidad | n/a | El recorrido es un escaneo |
| 8 | Estética y minimalismo | 3 | "Te falta" repetido en cada medalla |
| 9 | Recuperación de errores | 3 | QR inválido cae en el 404 global, sin marca |
| 10 | Ayuda | 3 | La instrucción de escanear queda muy abajo |

## Especificidad
Hecha para este producto: cartel, jornadas como niveles y revelación de la medalla. Lo genérico es la grilla de medallas de la portada.
Detector: 0 en código; 63 en navegador (59 dentro de .marquesina: 52 sombra dura, falso positivo por decisión del dueño; 5 palabras sueltas reales y menores). Sin superposición disponible.

## Lo que funciona
- Jerarquía del cartel a 360 px; AA, mínimo 4,65:1.
- Cinco resultados del QR con texto propio y paso siguiente.
- La sombra se apaga al presionar: feedback táctil.

## Problemas prioritarios
- [P1] a. La portada le miente a quien ya juntó: state="pendiente" fijo. src/components/visitante/EventHome.tsx:215. Fix: leer las medallas de la sesión, dentro de Suspense. /impeccable harden
- [P1] b. La fuente ancha corta palabras: "Finaliza/do" a 360 px, títulos de hasta 5 líneas. src/components/visitante/Countdown.tsx:20, EventHome.tsx:87. Fix: "Finalizado" a text-title y hyphens: auto con overflow-wrap de respaldo. /impeccable typeset
- [P1] c. Google sin estado de carga: nadie activa pending. src/app/publica/[host]/ingresar/page.tsx:54. Fix: botón de cliente con useFormStatus. /impeccable harden
- [P2] d. La celebración no empuja al próximo stand. Celebration.tsx:108, Progress.tsx:25. /impeccable delight
- [P2] e. Instrucción bajo el pliegue y link de menos de 44 px. EventHome.tsx:105. /impeccable clarify

## Personas
- Jordan: "Ingresar" destacado cuando el camino es escanear; "Spot inactivo".
- Sam: medalla anunciada dos veces (Medal.tsx:32); aria-live nace con contenido (sin probar); casillas justas a 320 px.
- Casey: sin respuesta en Google; menú abierto al tocar afuera.
- Riley: 120 días deja "Minutos" sola; 110 stands = segmentos de 0,68 px; "de 1 medallas" (Progress.tsx:35).
- Visitante: "si entro al sorteo" no existe.

## Menores
- PRODUCT.md promete saber si entrás al sorteo; RUTAS.md decide "sin meta del sorteo".
- Placa en claro a 1,01:1 del fondo.
- Palabras sueltas al final de párrafo.

## Preguntas
- ¿Medir cuánto falta o cuánto llevás?
- Durante el evento, ¿abrir con el cartel o con tu colección?
- ¿El visitante necesita el código del stand?

Límites: catálogo con datos de ejemplo; portada real, ingresar, mis-medallas y sorteo por código; sin teléfono físico ni lector de pantalla.
