---
version: 1
slug: "src-app-admin-app-layout-tsx"
primary_target: "src/app/admin/(app)/layout.tsx"
related_targets: ["src/components/admin/AdminShell.tsx"]
---

# Admin shell (app.eventdex.com)

Scope: the frame every admin and platform screen lives in, plus the event-dashboard pieces R2 will assemble. Mode: Operate. Inside the established LCD world (DESIGN.md); nothing in the world changes.

Audience: staff and owners preparing an event on a laptop, then running it from a phone; the developer on the platform. Job: always know which organization you are in, reach any section in one move, and find the primary action of the screen without looking for it.

Constraints: real data only on real screens (the dashboard waits for R2 data; its pieces live in /dev/componentes with labeled sample data); WCAG 2.2 AA; usable at 360 px; no JS needed for navigation.

## Direction contract

THESIS: the user-pinned structure of the previous admin (left rail with organization, sections and account; top bar with the page title and its one primary action; metrics, search with phase filters, event cards) rebuilt in the four-tone LCD world. Refuses the purple SaaS skin it came with.

OWN-WORLD: same tones, Jersey 10 and Atkinson as DESIGN.md. The rail is ground with a 2 px ink rule; the current section is a filled ink block with ground text. Metric tiles and event cards are 2 px ruled boxes, never shadows; figures in pixel type, labels in pixel type at 20 px. Phase filters are a segmented control of square cells with counts.

STORY: open the admin, see your organization at the top of the rail, the section you are in highlighted, and the primary action in the top bar's right corner.

FIRST VIEWPORT: desktop: 16 rem rail (org switcher on top, sections, account at the bottom), main column with a sticky top bar (page title left, primary action right) and the page below. Phone: the rail becomes a top block: org or brand with the account monogram at the end of the same row, then the sections in a scrolling row.

FORM: pinned by the user's screenshot of the previous admin. seed: none (form pinned by user; no roll). Signature: the active section reads as an inverted LCD cell, like a selected menu row on a handheld.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
