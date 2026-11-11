---
target: la landing completa
total_score: 22
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
target_identity: "file:/Users/mviveros/Development/eventdex/src/app/landing/page.tsx"
target_fingerprint: "sha256:6d1d4006586ed9f069b32d973e8a53ae63b73605f400a0507f3644c40456e285"
target_path: /Users/mviveros/Development/eventdex/src/app/landing/page.tsx
timestamp: 2026-11-11T21-23-12Z
slug: src-app-landing-page-tsx
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | 5 de 5 changes nothing in the console |
| 2 | Match System / Real World | 3 | D-pad to "walk", A to "scan" is game logic; only the "Escanear" caption bridges it |
| 3 | User Control and Freedom | 3 | No demo reset; mailto is the only exit |
| 4 | Consistency and Standards | 2 | Four arrows for two actions; "Cargá los stands" vs "Cargá el evento"; step 3 switches person |
| 5 | Error Prevention | 3 | mailto with no mail client fails silently |
| 6 | Recognition Rather Than Recall | 3 | Proof numbers are 1000+ px behind the ask |
| 7 | Flexibility and Efficiency | n/a | One-action landing |
| 8 | Aesthetic and Minimalist Design | 3 | 194 px blank console chin; hollow side columns at 1440 |
| 9 | Error Recovery | 2 | "Esta ya la tenías" as first response gives no next step |
| 10 | Help and Documentation | n/a | Landing |
| **Total** | | **22/32** | **Acceptable (69 %)** |

## Design Specificity Verdict

Hero is specific to this product (playable handheld with the product's own state vocabulary). Everything below is a well-typeset document: numbered list, paragraph, table, three swatches, mailto. Nothing real from the organizer's side is shown (QR sheet, raffle, closing data).

Detector: 3 advisory `design-system-color` findings at src/app/landing/page.tsx:80-82, all false positives (synthetic BRANDS inputs to rampFromHex). In-page detector: no anti-patterns, no overlay drawn.

Measured: no horizontal overflow at 1440/1024/360; all text pairs pass AA in light and dark (min 4.99:1 dark); no text under 14 px; single h1, no skipped levels; reduced motion disables boot/tick-in/drop-in; no console errors. Assessment A's claim that the CTA focus ring is 1.55:1 was checked and rejected: ring is ink, 8.15:1 on lcd-1.

## Overall Impression

The console is the page's argument and is wasted: it loads with the reward already given, the first press returns a refusal, and it never reaches the raffle. The closing ask is the weakest beat. Biggest opportunity: make the demo end at "entrás al sorteo".

## What's Working

- The console explains the mechanic better than any sentence, and is genuinely accessible (named buttons, live region, 48/80 px targets).
- Honest, restrained proof: named events, real table, "Marcas de ejemplo", a lead that respects the evidence rule.
- System discipline: square corners, 2 px rules, stepped motion, AA contrast in both schemes.

## Priority Issues

- **[P1] Demo gives away its reward, punishes the first press, never reaches the raffle.** Loads on "¡Medalla nueva!" 3 de 5; A returns "Esta ya la tenías"; 5 de 5 is silent. Fix: start on an unclaimed stand; one visible prompt in the empty chin ("Tocá A para escanear"); at 5 de 5 status becomes "¡Entrás al sorteo!". Command: /impeccable onboard
- **[P1] The ask is under-built and unreassured.** Only conversion is a 107x44 "Escribinos"; on mobile it appears before any reason and not again for ~4600 px; the close offers a personal Gmail and nothing else. Fix: repeat the CTA at the end of the proof band; add what to include (fecha, sede, cantidad de stands) and prefill the mailto body; replace the Gmail with a domain address before launch. Command: /impeccable clarify
- **[P2] Hero mixes visitor and organizer and breaks between widths.** Quick steps exist only ≥1280 and outrank the lead; console controls sit below the fold at 1024 and 360 (200 px below at 360); side columns hollow at 1440. Fix: remove quick steps from the hero or drop them to 30 px; console beside text at 1024–1279; smaller h1 on mobile. Command: /impeccable layout
- **[P2] Organizer payoff is told, not shown.** The data benefit is a clause in a paragraph; steps promise an A4 sheet and auditable raffle with no artefact; mobile h2 at 60 px takes up to 300 px. Fix: real product pieces beside the steps; turn "Para quien organiza" into "what you get at closing"; h2 40 px on mobile. Command: /impeccable bolder
- **[P2] Focus order at 1440 visits the console before the CTA above it (WCAG 2.4.3).** "Escribinos" is duplicated in the DOM per breakpoint. Fix: a single CTA placed with grid. Command: /impeccable layout

## Persona Red Flags

- Jordan: nothing says the console is interactive; presses A, reads "Esta ya la tenías"; Up equals Left.
- Riley: 5 de 5 does nothing, no reset; arrow keys don't drive the d-pad; console buttons lack a pressed state; "1649" lacks the es-AR thousands separator.
- Casey: A button 220 px below the fold at 360; proof h2 runs five lines.
- Municipal/expo organizer: proof is a card shop and a fest with no bridge to a 60-stand fair; no answer on cost, lead time or visitor data; "una hoja A4 por evento" reads as one sheet; a nameless Gmail reads as a hobby project.

## Minor Observations

- "Eventdex" in the hero is a plain paragraph; no header landmark; hero section has no accessible name.
- All three brand sprites are the same stand and share the name "Medalla de ejemplo".
- "anular no la borra" is jargon.
- Hover on A removes the page's only red.
- In dark mode emphasis moves from the proof band to the brand band.
- Full-page captures show brand cards at opacity 0 until scrolled (view-timeline).
- The persisted surface brief describes a different page and is stale.

## Questions to Consider

- If the pitch is "collect them and enter the raffle", why does the only interactive object end one step before the raffle?
- Would the page convert better if the console's last screen were the organizer's closing report?
- Is 2.56 medals per person a number to hide behind totals, or the most honest headline available?
