---
target: org dashboard
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/mviveros/Development/eventdex/src/app/panel/(app)/[org]/(panel)/page.tsx"
target_fingerprint: "sha256:4c3582e4035122b29465dc056bcd41aa26907cf687942bcb8ead979c90f784cf"
target_path: /Users/mviveros/Development/eventdex/src/app/panel/(app)/[org]/(panel)/page.tsx
timestamp: 2026-11-12T23-15-59Z
slug: src-app-panel-app-org-panel-page-tsx
---
⚠️ DEGRADED: single-context (la sesión no lanza sub-agentes sin pedido explícito)

Health 25/40 (Aceptable). Specificity: mundo LCD propio y consistente; la estructura (métricas arriba, filtros, grilla de tarjetas iguales) es la de cualquier SaaS. Detector: 0 hallazgos (CLI y overlay).

P1 El día del evento no tiene atajo: el evento en curso o el próximo pesa igual que un borrador viejo; orden sin criterio.
P1 Las métricas de arriba no deciden nada: "5 eventos / 2 visitantes / 3 medallas sumando cada evento" ocupan el primer viewport (en el celular, todo).
P1 Los borradores no dicen qué les falta para publicar.
P2 Eventos del mismo nombre son indistinguibles (dos "Expo Local", dos "Expo Primavera"): falta la edición.
P2 Repetición pesada: cada tarjeta tiene su botón Gestionar a todo el ancho + ⋮; 5 tarjetas = 10 controles grandes iguales.
P3 Título duplicado (TopBar "Eventos" + h1 con el nombre de la org, que ya está en la barra lateral).
