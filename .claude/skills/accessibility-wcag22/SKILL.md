---
name: accessibility-wcag22
description: WCAG 2.2 AA accessibility for ecommerce interfaces. Use when building or auditing navigation, mega menus, drawers, dialogs, filters, forms, swatches, carousels, sticky bars or status messaging, and when running axe/keyboard audits.
---

# Accessibility — WCAG 2.2 AA

Target is **WCAG 2.2 Level AA**. Beyond ethics and law (EU Accessibility Act applies to
ecommerce), an accessible storefront is a faster, clearer storefront for everyone.

## Rule zero

**Do not add ARIA where native HTML already works.** `<button>` beats `role="button"`.
`<details>` beats a JS accordion with `aria-expanded`. `<nav>` beats `role="navigation"`.
Bad ARIA is worse than no ARIA.

## Structure

- One skip link to `#main-content`, visible on focus.
- Landmarks: `<header>`, `<nav>`, `<main id="main-content">`, `<footer>`, `<aside>`.
- One logical `<h1>` per page. Never skip a heading level for styling.
- Lists of products are real lists (`<ul><li>`), so screen readers announce the count.

## Keyboard

Everything operable by keyboard alone, in a logical order.

| Component | Required behaviour |
|---|---|
| Mega menu | arrow keys within, Escape closes and returns focus to the trigger, no keyboard trap |
| Drawer / dialog | focus moves in, **focus trapped**, Escape closes, focus returns to trigger, background `inert` |
| Filters | operable and submittable without JS; result count announced |
| Carousel | previous/next are real buttons, slides reachable, auto-advance off or pausable |
| Sticky add-to-cart | reachable in tab order, does not obscure the focused element |

Visible focus on **every** interactive element. Never `outline: none` without a stronger
replacement. WCAG 2.2 adds *Focus Not Obscured* — sticky headers, cookie banners and sticky
purchase bars must not cover the focused control. Use `scroll-margin-block` on focus targets.

## Target size

WCAG 2.2 *Target Size (Minimum)* is 24x24 CSS px. This theme holds a stricter **44x44px** minimum
for all interactive targets, and **48px** minimum height for buttons and inputs.

## Forms

Every control has a programmatically associated `<label>`. Placeholder is never the only label.
Errors are specific ("Inserisci un indirizzo email valido", not "Errore"), associated via
`aria-describedby`, and announced. Do not rely on colour alone to mark an invalid field.

## Colour and status

Contrast: 4.5:1 body text, 3:1 large text and UI component boundaries. **Status is never colour
alone** — pair every state with an icon or text. In this theme specifically, lime `#B9F227` on
white is about 1.5:1 and must never carry small text.

## Dynamic content

Cart updates, filter result counts, device changes and validation results go through a polite
live region (`aria-live="polite"`). Do not use `assertive` for routine updates. Loading states
must be announced, not just spun.

## Media

Meaningful images get descriptive alt text; decorative images get `alt=""`. Product images
describe the product, not the filename. Never leave alt text auto-generated or empty on a
product image.

## Motion

Honour `prefers-reduced-motion: reduce` — drop transforms and transitions, keep opacity changes
minimal. No parallax, no auto-advancing carousel for reduced-motion users.

## Audit method

1. Keyboard-only pass over every flow: menu, search, filters, PDP, cart, dialogs.
2. `axe-core` via Playwright on each template — zero critical/serious violations.
3. Lighthouse accessibility.
4. Manual screen-reader-oriented check of announcements and focus order.
5. 200% zoom and 320px reflow with no horizontal scroll and no content loss.

Report violations with the failing selector and the specific success criterion.
