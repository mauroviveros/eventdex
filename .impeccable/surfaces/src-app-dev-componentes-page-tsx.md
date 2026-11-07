---
version: 1
slug: "src-app-dev-componentes-page-tsx"
primary_target: "src/app/dev/componentes/page.tsx"
related_targets: []
---

# /dev/componentes

Scope: development-only catalog of the visitor components (medal, progress, celebration, countdown, phase) plus base primitives (button, field, panel), each in all its states, with a live palette swap and a light/dark switch. Mode: Operate. It is the first surface of a new world and the source DESIGN.md is documented from.

Audience: the team building Eventdex (and the agents). Job: see every component state under the Eventdex palette and under an organization palette, in both schemes, before using it in a real screen. Constraints: synthetic demo data and logos, labeled as such; 404 in production; WCAG 2.2 AA; 360 px first.

## Direction contract

THESIS: Eventdex looks like a four-tone handheld LCD, the way the old event app did. Every organization gets its own four-tone ramp from its brand hue (a palette swap), so the brand leads and contrast is fixed by lightness, never by luck. Refuses the category default: white SaaS cards with a blue accent and confetti.

OWN-WORLD: Four tones of one hue (Eventdex: pea green) as roles: ground, fill, secondary, ink. Light follows the ramp; dark (the old app's olive) reverses it, chosen by the system setting. Square corners, 2 px rules, double-ruled dialog panels. Spot logos are posterized into the four tones; authored 12×12 sprites stand in when a spot has no logo. Jersey 10 for titles, counters and codes at multiples of 10 px; Atkinson Hyperlegible Next for everything read. Only danger leaves the ramp, with an icon.

STORY: the team sees each component state, flips palette and scheme, and trusts that any brand color stays legible.

FIRST VIEWPORT: a top bar with the scheme switch and the palette switcher (radio groups); below it the page title, the four-tone ramp strip and the medal row: logo and sprite medals at 96 px tiles in their four states, the "nueva" one replaying on demand.

FORM: user-pinned retro handheld world (green, the old event app's look); the dealt hand was set aside for it. seed: seed:27f9cb171b98d471. Signature move: a claimed medal develops through the tones in stepped frames, logo and sprite alike.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
