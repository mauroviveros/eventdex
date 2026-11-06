# Product

`v0.1 · 2026-11-06` · Relacionados: [PROYECTO](./PROYECTO.md) · [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) · [DESIGN](./DESIGN.md) · [RUTAS](./RUTAS.md)

> Decide sobre producto y textos. Los encabezados siguen el esquema de impeccable
> (`/impeccable` lee este archivo por el symlink de la raíz); el contenido va en
> castellano.

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegado: la propuesta y la decisión viven en [ARQUITECTURA](./ARQUITECTURA.md). Hosting confirmado en Vercel, base y auth en Supabase.

## Users

Hay cuatro superficies, cada una con su usuario:

- **Visitante** (principal). Va a una expo, una feria o un evento municipal. Está parado o caminando, con el celular en una mano, con poca señal, con sol o con la luz baja de un pabellón. Llega escaneando un QR o desde un link que compartió la organización. Lo que quiere hacer: sumar la medalla del stand que tiene enfrente, ver cuánto le falta y saber si entra en el sorteo. No instala nada y no lee instrucciones.
- **Staff de la organización.** Carga y opera el evento: sede, jornadas, spots, QR para imprimir y, al cierre, el sorteo. Prepara todo en la notebook días antes y el día del evento lo resuelve desde el celular, apurado.
- **Owner de la organización.** Lo mismo que el staff, y además maneja el equipo, la marca y el dominio. Es quien le compra el servicio a Eventdex.
- **Developer (plataforma).** Da de alta organizaciones y dominios, registra la facturación a mano y da soporte. Usa la herramienta pocas veces, pero con mucho poder, así que tiene que ser inequívoca.

La landing de eventdex.com le habla a quien todavía no es cliente: productoras, municipios y organizadores de expos.

## Product Purpose

Eventdex hace que el visitante **recorra todo el evento** y no solo los tres stands de la entrada, y le devuelve a la organización un dato que hoy no tiene: quién pasó por dónde.

Es éxito cuando:
- un visitante saca su primera medalla en menos de 30 segundos desde que escanea, login incluido;
- el staff deja un evento listo para imprimir los QR en una tarde, sin ayuda;
- el sorteo se hace en vivo, en un par de toques, y nadie puede discutir el resultado.

## Positioning

Es una **mecánica de colección** atada al espacio físico: cada medalla prueba que estuviste parado frente a ese stand. No es una app de agenda, ni de ticketing, ni de networking. Además, cada organización lo publica en **su dominio y con su marca**, así que para el visitante es la app de la expo, no la de Eventdex.

## Operating Context

- El visitante entra desde la cámara nativa del celular al escanear un QR impreso, o desde un link. Se usa de pie, de a ratos, entre stand y stand, y muchas veces con mala conectividad.
- Los QR se imprimen (A4, stickers, banners) y quedan pegados durante todo el evento: una URL impresa no puede cambiar.
- El staff prepara en desktop y opera en mobile. El sorteo suele hacerse en un escenario, a veces proyectado.
- Un mismo predio puede repetirse año tras año con los mismos stands: el catálogo de spots se reutiliza entre ediciones.

## Capabilities and Constraints

- Multi-tenant por hostname: cada organización tiene uno o más dominios contra un solo deployment.
- El login del visitante es con Google. Si hace falta otro método está **sin decidir** (ver [PROYECTO](./PROYECTO.md#preguntas-abiertas)).
- Escanear dos veces el mismo QR no suma dos medallas.
- La fase del evento (próximo, en curso, finalizado) se calcula desde las jornadas.
- Queda fuera de alcance: venta de entradas, pagos online, multi-idioma, app nativa y panel del expositor.
- Vocabulario: en la interfaz se dice **medalla**; en el código, `claim`. El resto del glosario está en [PROYECTO](./PROYECTO.md#glosario).

## Brand Commitments

- Nombre: **Eventdex**.
- Idioma: castellano rioplatense con **voseo** ("escaneá", "te faltan 3", "entrás al sorteo"). Nada de "usted", ni del "tú" neutro, ni de anglicismos cuando hay palabra propia.
- Voz con el visitante: cercana, breve y celebratoria cuando consigue algo, sin infantilizar. Una idea por pantalla.
- Voz con el staff y el owner: clara, directa y operativa. Dice qué pasó y qué hacer, sin chistes.
- Voz en la plataforma: precisa y sin ambigüedad. Las acciones destructivas dicen exactamente a qué afectan.
- Los errores nunca culpan al usuario y siempre ofrecen el paso siguiente.
- La marca de cada organización (logo y colores en `organizations.brand`) manda en la app pública. Eventdex se ve en la landing, el admin y la plataforma.

## Evidence on Hand

- Hay eventos reales de la v1 y la v2 con datos de visitantes y medallas, a migrar al final ([ROADMAP](./ROADMAP.md)).
- No hay testimonios, casos de éxito, métricas publicables ni clientes nombrables confirmados: **no se inventan** en la landing.

## Product Principles

1. **La primera medalla es lo único que importa en el primer minuto.** Todo lo que se interponga entre el escaneo y la medalla sobra o se pospone.
2. **El dato real manda.** No se muestran pantallas con datos inventados; si no hay datos, se muestra un estado vacío útil.
3. **La organización es la protagonista frente a su público.** Eventdex es la infraestructura, no la marca que ve el visitante.
4. **Lo impreso es permanente.** Las URLs y los códigos que van en papel no cambian nunca.
5. **El sorteo tiene que ser auditable.** Cada extracción queda registrada; anular no borra.

## Accessibility & Inclusion

- WCAG 2.2 AA en todas las superficies: contraste, foco visible, áreas táctiles de 24×24 px como mínimo (44×44 en las acciones principales del visitante) y navegación por teclado completa en el admin.
- La app del visitante se diseña primero para 360 px de ancho, uso con una mano, sol directo y conexión lenta.
- El color de marca de cada organización no puede romper el contraste: si lo rompe, se ajusta o se usa un color de respaldo.
- Se respeta `prefers-reduced-motion`; las celebraciones no dependen solo de la animación.
- Lenguaje llano: nada de jerga técnica para el visitante.
