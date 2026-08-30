# ITALIAN TECH ATELIER — Theme Engineering Guide

Shopify **Online Store 2.0** theme for a mobile-phone-accessories retailer operating an online
store **and** a physical shop in Italy. Default storefront language **Italian**, secondary English.

This file is the contract. Read it before changing anything.

---

## 1. Platform decisions (non-negotiable)

| Decision | Ruling |
|---|---|
| Platform | Native Shopify OS 2.0. Liquid, JSON templates, sections, theme blocks, app blocks. |
| Frontend framework | **None.** No React, Vue, Svelte, Tailwind, jQuery, Alpine, htmx. Native custom elements only. |
| Checkout | **Shopify native checkout, never replaced.** No unsupported checkout DOM modification. |
| Admin | Shopify Admin + Shopify POS. **No custom ecommerce admin dashboard.** |
| Inventory | Shopify inventory by location. **No parallel inventory database, ever.** |
| Cart | Shopify Ajax Cart API + Section Rendering API. |
| Search | Shopify Predictive Search + Search & Discovery. |
| Filtering | Shopify Storefront Filtering (`collection.filters`). Never a bespoke filter engine. |
| Recommendations | Shopify Product Recommendations API. |
| Pickup | Shopify Locations + native in-store pickup. |
| Consent | Shopify Customer Privacy API. |
| Data | Metaobjects + metafields. Never unstructured description parsing. |
| Base | Shopify **Skeleton** (see `LICENSE.md` — Shopify licence, *not* MIT; permits theme development that interoperates with Shopify). Architecture and styling are original. |

**Do not rebuild what Shopify already handles securely.**

---

## 2. Live-theme safety

1. Work only against an **unpublished development theme**.
2. **Never** run `shopify theme publish`. Not with a flag, not "just to test".
3. Never overwrite, delete or push over a live theme.
4. Never commit credentials, tokens, store domains or customer data. `.env` is gitignored.
5. No destructive git operations (`reset --hard` on shared work, force-push, history rewrite).
6. Never buy, install or activate a paid theme or paid app without explicit merchant permission.
7. No merchant business fact is ever invented. Absent data stays a labelled placeholder.

---

## 3. Design tokens

Defined once in `snippets/theme-tokens.liquid`, consumed everywhere as CSS custom properties.
**Never hardcode a hex value in a section or snippet.**

```
--color-ink:            #0B1220   /* midnight navy   */
--color-primary:        #2457FF   /* cobalt          */
--color-primary-hover:  #1743D3
--color-accent:         #B9F227   /* volt lime       */
--color-background:     #F7F8F5   /* porcelain       */
--color-surface:        #FFFFFF
--color-text-secondary: #667085
--color-border:         #DDE3EA
--color-success:        #15845A
--color-danger:         #D92D20
--color-warning:        #B54708
```

### Colour distribution — enforced, not aspirational

Approximately 70% porcelain/white, 20% midnight navy, 8% cobalt, **2% volt lime**.

- **Cobalt** is the primary conversion action: add to cart, checkout, primary submit.
- **Lime** is device context **only**: selected device, verified compatibility, active device chip,
  small editorial accents. **Lime is never a generic button background.** If you are reaching for
  lime and the element is not about the customer's device, you have the wrong token.
- **Red** is genuine sale information, errors, destructive actions. Nothing else.
- **Green** is genuine availability and success. Nothing else.

Every text/background pair must pass **WCAG 2.2 AA** (4.5:1 body text, 3:1 large text and UI
boundaries). Note: lime `#B9F227` on white is roughly 1.5:1 — **it must never carry small text**.
Lime is a fill or a border behind `--color-ink` text only.

### Fill tokens vs text tokens

`--color-success` and `--color-danger` are the **fill** values from the brief. Measured by axe,
they fall just short of 4.5:1 as *text on a light surface* (4.40 and 4.22). Use the darker text
variants wherever the colour carries text:

```
--color-success-text: #147D56
--color-danger-text:  #D02B1F
--color-warning-text: #B54708
```

Brand token for fills, borders and icons. `-text` variant for text. Never the other way round.

### Spacing — 8-point system

`4, 8, 12, 16, 24, 32, 48, 64, 80, 96` exposed as `--space-1` through `--space-10`.
No arbitrary values.

### Containers

Max content width **1440px**. Gutters: desktop 32, tablet 24, mobile 16.

### Radii

Button and input `10px`, card `12-14px`, large editorial surface `18px`, status chip pill.
**Do not round every section.** Flat edges are part of the art direction.

### Elevation

Subtle **borders** for cards. Shadows only for floating drawers, menus and elevated dialogs.

### Motion

`140-220ms`. Always honour `prefers-reduced-motion: reduce`. No decorative or random animation.

---

## 4. Typography

Headings **Manrope** (600/700/800), body and UI **Inter** (400/500/600/700). Latin Extended for
Italian. `font-display: swap`. WOFF2 when self-hosted. Preload only genuinely critical faces.
**Do not add weights that are not on this list.**

| Role | Desktop | Mobile |
|---|---|---|
| Display | 48/56 | 34/40 |
| H1 | 40/48 | 30/36 |
| H2 | 32/40 | 26/32 |
| H3 | 24/32 | 24/32 |
| Body | 16/24 | 16/24 |
| Small UI | 14/20 | 14/20 |
| Caption | 12/16 | 12/16 |
| Price | 24/30 | 20/26 |

Prices and order data use `font-variant-numeric: tabular-nums`.

---

## 5. Component conventions

- One component is one snippet in `snippets/`, documented with a `{% doc %}` LiquidDoc block
  declaring every `@param`.
- Component CSS lives in that file's `{% stylesheet %}` block. Shopify bundles these
  automatically. Only tokens, reset and layout primitives go in `assets/critical.css`.
- Component JS is a **native custom element** in its own `assets/*.js`, registered once,
  loaded as `type="module"` and deferred.
- Every interactive component must work **without JavaScript**: real forms, real `<a href>`
  pagination, real `<details>` accordions. JS is enhancement, never the only path.
- Accordions use native `<details>/<summary>`. Do not write an accordion in JS.
- One SVG icon system via `snippets/icon.liquid`. **Emoji are never interface icons.**
- Minimum interactive target **44x44px**. Minimum button and input height **48px**.
- Product imagery is **1:1** primary ratio with consistent internal padding.

---

## 6. Product data conventions

**Metaobjects:** `device_brand`, `device_family`, `device_model`, `product_family`.

**Compatibility is data, never inference.** It is read from
`product.metafields.custom.compatible_devices` and `product.metafields.custom.compatibility_level`.
It is **never** derived from collection membership, tags-as-truth, product title or description text.

### Compatibility resolution — the single source of behaviour

| Condition | State | Italian label |
|---|---|---|
| device in list, level `exact_fit` | EXACT | Compatibilita esatta con {device} |
| device in list, level `compatible` | COMPATIBLE | Compatibile con {device} |
| level `universal` | UNIVERSAL | Accessorio universale - controlla connettore e potenza |
| device in list, level `adapter_required` | ADAPTER | Compatibile tramite adattatore |
| device selected, list non-empty, device NOT in list | MISMATCH | Questo prodotto non risulta compatibile... |
| no device selected | *render nothing* | — |

**`universal` never upgrades to EXACT**, whatever else is set. A MISMATCH warns and offers
"Vedi prodotti compatibili" — it **never blocks navigation or purchase**.

### Source of truth vs projection

The **metaobject reference list is authoritative.** The `device:<handle>` product tag is a
*derived projection* used for storefront filtering and automated collections. Tags are generated
by the import pipeline, never hand-maintained independently. If the two disagree, the metaobject
wins and the tag is regenerated.

### Device persistence

Selected device lives in `localStorage` under `ita.device`. It is resolved **client-side** because
Shopify full-page caching would otherwise serve one visitor's device to the next. The server emits
compatibility data as JSON; the client renders the badge. Guest-only — **cross-device account sync
is not possible theme-only and must never be claimed.**

---

## 7. Price and claim integrity

Never fabricate: compare-at prices, percentage savings, bestseller status, stock urgency, purchase
counts, review counts, countdowns, "customers viewing" numbers.

- A **percentage saving renders only** when `custom.prior_price_30d` is populated.
- `compare_at_price` alone renders a strikethrough with **no percentage claim** — it is not by
  itself proof of a compliant prior price under EU price-indication rules.
- Low-stock messaging requires real inventory **and** a configured threshold.
- Ratings render only from genuine review data. No stars on a product with no reviews.
- `AggregateRating` and `LocalBusiness` structured data render **only** when the underlying fields
  are non-blank. Guard every schema block.
- Never display a CE or certification badge unless product data verifies it.

---

## 8. Accessibility rules (WCAG 2.2 AA)

- Skip link, semantic landmarks, one logical `<h1>`, no heading level skipped.
- Visible focus on every interactive element. Never `outline: none` without a replacement.
- Dialogs and drawers: focus trap, Escape to close, focus returns to the trigger.
- Status changes announced via a polite live region (cart updates, filter results, device change).
- Status is **never colour alone** — pair with an icon or text.
- Label every form control. Validation messages are specific and programmatically associated.
- Colour swatches carry text alternatives; they are `<input type="radio">` plus `<label>`,
  not `<div>` elements.
- Sticky header, cookie banner and sticky add-to-cart must **never obscure a focused element**
  (use `scroll-margin-block` on focus targets).
- **Do not add ARIA where native HTML already works.** A `<button>` beats `role="button"`.

---

## 9. Performance budgets (hard, test-enforced)

| Budget | Limit |
|---|---|
| Theme-owned JS | **30 KB gzipped total** |
| Theme-owned CSS | **45 KB gzipped total** |
| LCP (p75) | 2.5 s or better |
| INP (p75) | 200 ms or better |
| CLS (p75) | 0.1 or better |

- `srcset`, `sizes` and explicit `width`/`height` on every image. Reserve every media box.
- `loading="eager"` plus `fetchpriority="high"` on the **one** true LCP image. Everything else lazy.
- No autoplay hero video. No animation libraries. No carousel unless it earns its place.
- Never dump all variants into JSON when a subset will do.
- `npm run budgets` fails if JS or CSS exceeds budget. CSS is measured as `critical.css` PLUS
  every scoped `{% stylesheet %}` block, because Shopify concatenates them into one download.

---

## 10. Localisation

- Italian is default: `locales/it.default.json`. English secondary: `locales/en.json`.
- **Every** merchant-visible string is a translation key. No hardcoded Italian in Liquid.
- Never concatenate translated fragments into a sentence — it breaks grammar in Italian.
  Use one key with interpolation: `"compat_exact": "Compatibilita esatta con {{ device }}"`.
- **Translation keys must be STATIC.** `'specs.' | append: key | t` defeats Theme Check's
  `TranslationKeyExists` and fails silently in front of a customer. Use a `case` of literal keys
  (see `snippets/spec-label.liquid`).
- **Filter order matters twice over.** `x | default: 'key' | t` passes the merchant's own text to
  `t`; `'key' | t: n: v | money` formats the finished sentence. Resolve fallbacks and format
  values BEFORE interpolating.
- Use `money`, `date` and localisation filters. Never format currency by hand.
- Test long Italian labels — Italian runs roughly 15-25% longer than English and *will* overflow.
- Generated legal text is a placeholder pending Italian professional review. Say so, in the file.

---

## 11. Testing commands

```bash
npm run check         # Shopify Theme Check (Liquid correctness)
npm run format:check  # Prettier - ALSO the JS syntax gate: it exits 2 on a parse error
npm run budgets       # Hard JS/CSS gzipped budget assertions
npm test              # Playwright: responsive, keyboard, axe-core a11y
npm run verify        # All of the above, in order
npm run dev           # shopify theme dev - requires YOUR auth; never auto-publishes
```

---

## 12. Prohibited patterns

Generic dropshipping styling, excessive gradients, glassmorphism, pill-shaped everything, giant
empty heroes, neon/gaming aesthetics, random animation, heavy shadows, cheap icons, emoji as
icons, fake urgency, fake scarcity, fake reviews, fake countdowns, misleading discounts,
autoplay mobile background video, newsletter popup on entry, unnecessary carousels, hidden
navigation, overly rounded cards, AI-looking imagery, copied competitor assets, code, layouts,
colours, logos or photography, lorem ipsum in merchant-visible content, endless scroll without
real pagination, inventing merchant data.
