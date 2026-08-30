---
name: visual-qa
description: Browser, responsive and visual regression QA using Playwright. Use when writing or running responsive screenshot tests, keyboard traversal tests, axe-core accessibility scans, or budget assertions for a Shopify theme.
---

# Visual QA

## What can and cannot be tested locally

This project has **no authenticated store**. Be precise about the difference:

| Testable locally | Requires a real store |
|---|---|
| Component CSS and layout at every breakpoint | Live cart Ajax against `/cart/add.js` |
| Keyboard traversal, focus trap, Escape, focus return | Predictive search results |
| axe-core violations | Storefront filter output from Search & Discovery |
| JS/CSS byte budgets | Variant-aware pickup availability |
| Liquid syntax and schema (Theme Check) | Checkout, payments, POS |

**Never report an untested flow as passing.** Anything in the right column goes into the merchant
verification script with explicit steps, not into the QA report as a result.

## Harness approach

Components render into a static harness page that loads the **real** `critical.css` and the
**real** JS modules with fixture data. This genuinely exercises the CSS and the custom elements.
It does not exercise Liquid rendering — Theme Check and code review cover that. State this
limitation in the QA report.

## Required breakpoints

`360, 390, 430, 768, 1024, 1280, 1440` plus a large desktop width. Test intent, not just width:

- Do device names stay legible, or truncate mid-model?
- Do prices wrap badly?
- Are filters usable on a 360px screen?
- Is search still prominent on mobile?
- Do sticky bars overlap the cart drawer or the cookie banner?
- Does long Italian text overflow? (Italian runs 15-25% longer than English.)

Product grid: 2 columns mobile, 2-3 tablet, 4 desktop, 4-5 only when cards stay readable.

**Do not simply shrink the desktop layout.** Mobile is the primary commerce surface here.

## Test suites

| File | Asserts |
|---|---|
| `responsive.spec.js` | screenshots at every breakpoint, no horizontal overflow |
| `keyboard.spec.js` | tab order, focus visible, focus trap, Escape, focus return |
| `a11y.spec.js` | axe-core, zero critical or serious violations |
| `budgets.mjs` | gzipped JS 30 KB, CSS 45 KB — hard fail |

## Overflow detection

Horizontal overflow is the most common responsive defect and the easiest to assert:
compare `document.documentElement.scrollWidth` against `clientWidth` at every breakpoint. Any
excess fails. Also check each wide element (tables, filter rows, spec grids) scrolls inside its own
container rather than pushing the page.

## Reporting

Report actual output — command, exit status, counts. If a test did not run, say it did not run.
A QA report that claims coverage it does not have is worse than no QA report.
