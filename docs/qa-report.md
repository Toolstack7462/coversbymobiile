# QA report

Every number here is real command output. Where something could not be tested, this report says
so rather than implying coverage that does not exist.

Reproduce with `npm run verify`.

---

## Scope — what could and could not be tested

**There is no authenticated Shopify store in this project.** That boundary is absolute and shapes
everything below.

| Testable here | Requires a live store |
|---|---|
| Liquid syntax, schema, translation keys (Theme Check) | Liquid *rendering* with real data |
| Component CSS at 8 breakpoints | Live cart Ajax against `/cart/add.js` |
| Keyboard operation, focus order, focus trap | Predictive search results |
| axe-core WCAG violations | Storefront filter output from Search & Discovery |
| Horizontal overflow, target sizes | Variant-aware pickup availability |
| JS/CSS byte budgets | Checkout, payments, POS |
| JS syntax and formatting | Structured-data validation in Google's tools |

The right column is covered by the 64-step merchant verification script in
`docs/launch-checklist.md`. **None of it is claimed as passing here.**

---

## 1. Shopify Theme Check

```
$ npx shopify theme check
110 files inspected with no offenses found.
```

**PASS** — 0 errors, 0 warnings. Config: `theme-check:recommended` (`.theme-check.yml`).

Notable defects Theme Check caught during development, all fixed:

| Finding | Reality |
|---|---|
| `UnsupportedDocTag` | `{% doc %}` is **snippet-only**; four sections were using it. Converted to `{% comment %}`. |
| `TranslationKeyExists` | Dynamically built keys (`'consent.category_' \| append: category`) cannot be statically verified. Written out explicitly. |
| `ValidScopedCSSClass` × 20 | Classes used in one file but defined in another file's scoped `{% stylesheet %}`. Genuinely shared primitives moved to `critical.css`. |
| `ValidSchemaTranslations` | Schema `t:` keys must exist in the **schema** locale namespace, not the storefront one. |
| `UndefinedObject` | `hellip` is not a Liquid object — the pagination ellipsis branch was dead. |
| `OrphanedSnippet` | Detected a genuinely unused snippet inherited from the starter. |

---

## 2. Prettier — and the JS syntax gate

```
$ npx prettier --check "assets/**/*.{js,css}" "tests/**/*.{js,mjs}" "*.js"
All matched files use Prettier code style!
```

**PASS.**

**Prettier is also the JavaScript syntax gate.** It exits **2** on a parse error, verified
deliberately with a probe file. This is not incidental — it caught a genuine runtime-breaking
bug that no other check would have found:

> `assets/device-context.js` and `assets/compare.js` each used `#private` methods inside an
> **object literal**. Private names are only legal inside a `class` body, so both files would
> have thrown a `SyntaxError` on load, disabling the entire device-compatibility system and the
> comparison feature. The Playwright suite did not catch it because the harness exercises CSS,
> not module loading.

Both were rewritten to use module-scoped functions.

---

## 3. Asset budgets

```
$ node tests/budgets.mjs

JavaScript
     3.0 KB  assets/device-context.js
     2.7 KB  assets/product.js
     2.5 KB  assets/cart.js
     ...16 files
  ─────────
    19.5 KB  TOTAL  (budget 30.0 KB)

CSS
     6.4 KB  assets/critical.css
    11.2 KB  scoped {% stylesheet %} blocks
  ─────────
    17.1 KB  TOTAL  (budget 45.0 KB)

Fonts (not budgeted, subset + unicode-range)
   169.2 KB  4 files

All budgets within limits.
```

**PASS** — JS at 65% of budget, CSS at 38%.

CSS is measured as `critical.css` **plus every scoped `{% stylesheet %}` block**, because Shopify
concatenates those into one stylesheet the customer downloads. Measuring `critical.css` alone
would understate the real cost by roughly two-thirds.

The gate itself was hardened after review: it originally used `String.match` without the `/g`
flag (counting only the first stylesheet block per file) and did not walk `blocks/`.

---

## 4. Playwright

```
$ npx playwright test
98 passed (1.2m)
```

**PASS** across four engine/device projects, `it-IT` locale, `Europe/Rome`:

| Project | Engine | Covers |
|---|---|---|
| `desktop-chrome` | Chromium | Full suite including axe |
| `desktop-firefox` | Gecko | `<progress>` and `appearance` render differently here |
| `desktop-safari` | WebKit | `:has()`, `aspect-ratio`, scroll-snap — and the only engine iOS can use |
| `mobile-safari` | WebKit (iPhone 14) | Touch viewport, safe areas |

axe runs on Chromium only: it is engine-independent for the rules asserted, and running it three
times would triple the suite for no additional signal.

| Suite | Asserts |
|---|---|
| `responsive.spec.js` | No horizontal overflow at 360/390/430/768/1024/1280/1440/1920 on 2 pages (16 tests per engine); no element exceeds viewport; grid is 2/3/4 columns; long Italian device names wrap rather than clip; every interactive target ≥ 44px high |
| `a11y.spec.js` | axe-core `wcag2a/2aa/21a/21aa/22aa` — zero critical or serious violations at 1280px **and** 390px; brand-palette contrast; every form control has an accessible name; no status conveyed by colour alone |
| `keyboard.spec.js` | Skip link is first in focus order and becomes visible; every interactive element has a visible focus indicator; one tab stop per product card; `<details>` operable by Enter; `scroll-margin` present for WCAG 2.2 *Focus Not Obscured* |

**A cross-browser finding worth recording.** The skip-link test originally pressed Tab and
asserted focus landed on it. That passed on Chromium and Firefox and **failed on WebKit** — because
Safari does not move focus to links on Tab unless the user enables full keyboard access. The
theme was correct; the test was asserting a browser preference rather than the theme's contract.
It now asserts what we actually own: the skip link is the **first focusable element in DOM order**
and becomes visible when focused. Engine-independent, and still a real assertion.

### The harness is honest about itself

`tests/build-harness.mjs` compiles the theme's **real** CSS — design tokens extracted from
`theme-tokens.liquid` with Liquid defaults resolved, plus `critical.css`, plus every scoped
stylesheet block — and renders the actual component markup with deliberately awkward fixtures
(the longest realistic Italian strings and longest device names, because that is where layouts
break).

It genuinely exercises CSS, responsive behaviour and accessibility. **It does not exercise Liquid
rendering.** The QA report does not pretend otherwise.

---

## 5. Defects found and fixed by the test suite

The suite failed on first run. Every failure was a real defect, not a flaky test.

### WCAG contrast — two genuine failures in the specified palette

axe-core measured, on the real compiled CSS:

| Pair | Measured | Required |
|---|---|---|
| `--color-success` `#15845A` on porcelain | **4.40** | 4.5 |
| `--color-danger` `#D92D20` on its own tint `#FDECEA` | **4.22** | 4.5 |

The brief specified those hex values. They are correct as **fills** (white on `#D92D20` measures
4.83) but fall just short as **text on a light surface**.

**Resolution:** the specified palette was left unchanged, and darker text variants were added —
`--color-success-text: #147D56` and `--color-danger-text: #D02B1F`, both clearing 4.5:1 on
porcelain, white and their own tint. Brand tokens for fills; `-text` variants where the colour
carries text. Every text usage across 14 files was repointed.

### Target size

Filter chips measured 36px against the theme's 44px minimum. The cause was instructive: `.chip`
was defined in **both** `critical.css` (44px, correct) and `facets.liquid` (36px, stale), and the
duplicate won the cascade. Duplicate removed.

The device strip's "Cambia dispositivo" link had no `min-height` at all — fixed.

One test assertion was itself wrong and was corrected rather than worked around: a checkbox
wrapped in a label is activated by clicking the **label**, so the label is the real target. The
test now measures the label for wrapped inputs.

---

## 6. Specialist audits

Two read-only audit agents reviewed the finished theme. Findings were reported, not applied by
the agents — the lead applied every fix, so no two writers touched the same file.

### Security and code review

| Severity | Finding | Status |
|---|---|---|
| HIGH | **`prior_price_30d` type mismatch.** A Money metafield (major units) was compared against integer cents, so the 30-day reference percentage **could never render** — the theme's entire price-compliance feature silently never fired. | Fixed: normalised to cents |
| HIGH | **Cart page controls inert.** Quantity and remove were bound only inside `<cart-drawer>`; the `/cart` page renders the same markup outside it, leaving **no way to change or remove a line item** with JS enabled. | Fixed: delegated from `document` |
| HIGH | **14× filter-precedence bug.** `{{ x \| default: 'key' \| t }}` pipes left-to-right, so a merchant's own heading was passed to `t` and rendered `Translation missing: it.<their text>`. | Fixed: 13 inline sites + 1 assign |
| HIGH | **Map embed XSS.** A free-text setting interpolated unescaped into an attribute and assigned to `iframe.src`; a `javascript:` value would execute in the storefront origin. | Fixed: `type: url`, escaped, https-verified at assignment, sandboxed |
| MEDIUM | **7× `t:` then formatter.** `'price.from' \| t: price: x \| money` applies `money` to the finished sentence, not the value — broken "from" prices, free-shipping amounts, dates and the copyright line. | Fixed: format first, then interpolate |
| MEDIUM | **Three fabricated claims shipped in the default preset** ("Spedizione in tutta Italia", "Ritiro in negozio", "Pagamenti sicuri") — contradicting the section's own stated rule and CLAUDE.md §2. | Fixed: preset ships empty |
| MEDIUM | **Zero-result filter left previous products on screen** beside a count of zero, because the empty state had no swap target. | Fixed: wrapper spans both branches |
| MEDIUM | **Duplicate sort listeners** accumulated on every render (N interactions → N+1 fetches). | Fixed: `dataset.bound` guard |
| MEDIUM | **Inventory quantities published** into page source for every variant, unused by any JS. | Fixed: removed from the variant map |
| MEDIUM | **Consent gate documented but not implemented** in `store-map.js` — the "second gate" was dead code. | Fixed: consent genuinely checked |
| MEDIUM | `url_encode` applied to a whole URL concatenation, percent-encoding the path and producing 404s. | Fixed |
| LOW | `show_wishlist: false` ignored (`false == blank` is true in Liquid); sticky price included a visually-hidden label; unescaped customer address values; dead `formatMoney` export. | All fixed |

**Verified clean:** no secrets, tokens or store domains anywhere; zero `innerHTML`/`eval`/
`document.write`; every fetched-HTML path uses `DOMParser` + node insertion; all structured data
and `js-context` values use `| json`; the client never computes a price, total, discount or
availability; checkout untouched; no analytics or tracking script of any kind; no PII in storage;
`package.json` has **no** runtime dependencies.

### Performance and design-system audit

| Severity | Finding | Status |
|---|---|---|
| HIGH | **Two `fetchpriority="high"` images on every template** — the header logo competed with the real LCP element site-wide. | Fixed: logo stays eager, priority removed |
| HIGH | **`sizes` over-declared by ~33% on the LCP element.** The product card's default assumed a full-width grid, but collection and search render it inside a 260px sidebar layout, pushing the browser to a larger candidate than needed. | Fixed: accurate `sizes` passed |
| HIGH | **Device strip injected ~52px above `<main>` after load** — a full-width shift for exactly the returning customer this store is built around. | Fixed: pre-paint flag |
| MEDIUM | Compatibility badge reveal grew every card in the grid. | Fixed: line reserved via the same flag |
| MEDIUM | Deferred sections expanded from zero height. | Fixed: recently-viewed now deferred like recommendations |
| **HARD FAIL** | **Lime used outside device context in 3 places** — newsletter success (×2) and, worst, the default-address card wearing the device-context treatment. | Fixed: white on navy (18.72:1), cobalt tint for the address |
| MEDIUM | Focus ring overridden to lime in 3 files with no accessibility justification (cobalt on navy measures 3.46:1, clearing the 3:1 threshold). | Fixed: overrides removed |
| MEDIUM | Four shared components defined **twice**, two already drifted. | **Fixed:** all four duplicates removed (`.qty`, `.empty-state`, `.accordion`, `.rte`); one genuine local refinement kept. CSS dropped 17.6 → 17.1 KB. |
| MEDIUM | Four off-scale type sizes, including a `calc()` that scaled font-size without its line-height. | Fixed |
| LOW | Eager hint could vanish entirely if the first block had no image; one fixed-width image; brand logo rendered at two different ratios; dead tokens; arbitrary 1/2/3/5px spacing. | Fixed. Sub-grid padding now uses a named `--space-half` token; three dead tokens and one no-op custom property removed. |

**Verified clean:** zero hardcoded hex in `sections/` or `snippets/`; `critical.css` contains no
literal colours at all; one button component, one card, one icon system (45 icons, shared
viewBox); **zero emoji** anywhere; every image declares `width` and `height`; no framework, no
carousel or animation library, no third-party runtime imports; radii genuinely non-uniform; one
gradient in the whole theme (since deleted with its dead code); no glassmorphism, no
`backdrop-filter`, no neon.

### An i18n violation both audits surfaced

`product-specs.liquid`, `compare-data.liquid` and `product-safety.liquid` hardcoded ~50 Italian
labels in Liquid — a direct breach of CLAUDE.md §10, and it meant an English-locale visitor saw an
Italian spec table.

Fixed properly rather than patched: a `specs` and `safety` namespace was added to both locales
(48 new keys, parity maintained), and `snippets/spec-label.liquid` resolves a row key to a label
through a `case` of **static** translation keys — because dynamic keys defeat Theme Check's
`TranslationKeyExists` and would fail silently in front of a customer.

---

## 7. Localisation

```
it keys: 428    en keys: 428    missing in en: 0    extra in en: 0
```

**PASS.** Italian is the default (`it.default.json`); English is complete with exact key parity.
Schema locales (`it.default.schema.json`, `en.schema.json`) cover every `t:` key used in section
schemas — verified by Theme Check.

Product titles, descriptions, collection copy and metafield values are **merchant content** and
need Shopify Translate & Adapt. See `docs/app-stack.md`.

---

## 8. Accessibility summary

| Check | Result |
|---|---|
| axe-core, WCAG 2.0/2.1/2.2 A + AA | **0 critical, 0 serious** at 1280px and 390px |
| Contrast | All pairs ≥ 4.5:1 for text after the fix above; lime is fill-only |
| Keyboard | Skip link first; visible focus everywhere; focus trap + Escape + focus return in drawers; one tab stop per card |
| Target size | All ≥ 44×44px (theme rule, stricter than WCAG 2.2's 24px) |
| Focus Not Obscured (2.2) | `scroll-margin-block` on every interactive element |
| Status cues | Never colour alone — every state pairs an icon with text |
| Motion | `prefers-reduced-motion` collapses all durations to 0 |
| Semantics | Native `<details>` accordions, real radios, real forms, real pagination |

**Not tested, and not claimed:** manual screen-reader testing (NVDA/JAWS/VoiceOver), 200% zoom
reflow on real browsers, and real assistive-technology announcement order. Automated tooling
catches roughly a third of WCAG issues. An independent audit is listed in
`docs/legal-review-checklist.md` §6 — the European Accessibility Act applies to e-commerce from
28 June 2025.

---

## 9. Performance summary

| Metric | Status |
|---|---|
| Theme JS | **19.5 KB gzipped** / 30 KB budget — measured |
| Theme CSS | **17.1 KB gzipped** / 45 KB budget — measured |
| LCP / INP / CLS | **Not measured.** No Lighthouse run, no field data. |

**No Core Web Vitals number in this report is a real-user result, because none was collected.**
What exists is structural: exactly one eager high-priority image per template, accurate `srcset`
and `sizes`, `width`/`height` on all 23 images, `aspect-ratio` on every media box, inline tokens
and fonts (no round-trip), two font preloads, `font-display: swap`, no render-blocking script, no
framework, debounced and abort-controlled search, and a variant map deliberately narrowed to
three fields.

Measure the real thing after launch via Shopify Web Performance or CrUX — see
`docs/launch-checklist.md` §62–64.

---

## 10. Tooling that does not exist in this installation

Checked, not assumed:

- **`/verify` and `/debug` are not installed.** They were not used and are not claimed. The
  equivalent is `npm run verify`.
- No Shopify MCP server and no Playwright MCP server.
- `claude-in-chrome` exists but is unusable without a live preview URL.

`/code-review` and `/security-review` are available; the security and code review above was
performed to that standard by a dedicated read-only audit agent, with findings applied by the
lead.

---

## 11. Honest limitations

1. **No flow touching a live store has been executed.** Cart, search, filters, pickup, checkout
   and POS are built to Shopify's documented APIs and reviewed, but not run. 64 steps in
   `docs/launch-checklist.md`.
2. **Lab only, no field data.** No Lighthouse run either.
3. **The harness tests CSS and behaviour, not Liquid rendering.** Liquid correctness rests on
   Theme Check plus review.
4. **No real-device testing.** Chromium, Gecko and WebKit are all exercised, including an
   iPhone 14 viewport, but emulation does not catch real safe-area behaviour, true touch
   accuracy or iOS Safari's actual scroll physics. Steps 58-61 of the launch checklist cover it.
5. **No screen-reader testing.**
6. **No visual regression baseline.** Screenshots are captured on failure only; a baseline should
   be established from the first real store preview.
7. **Structured data has not been validated in Google's tools** — it needs real rendered pages.
8. **Legal text does not exist.** Deliberately: the theme ships templates, not policies.
9. **No merchant data.** Every placeholder is empty by design, so several sections currently
   render nothing — which is the intended behaviour, not a defect.
10. **The theme is unpublished and has never been pushed.** No store was authenticated.
