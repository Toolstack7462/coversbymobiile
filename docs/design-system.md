# Design system — Italian Tech Atelier

Art direction: **premium, modern, European, technically credible, warm enough for a local
retailer.** The test for any decision here is whether it would look right in a real Italian shop
window — not whether it looks like a theme demo.

Tokens live in `snippets/theme-tokens.liquid`. **That is the only file in the theme permitted to
contain a literal colour value**, enforced by the write guard in
`.claude/hooks/check-theme-file.mjs`.

---

## Validation against `ui-ux-pro-max`

The installed `ui-ux-pro-max` skill was consulted for the design system and the visual audit.

**Corroborated** — these were already enforced and the skill independently ranks them CRITICAL/HIGH:

| Rule | Our implementation | Verified by |
|---|---|---|
| Touch target ≥ 44×44px | `--target-min: 44px`, 48px control height | `tests/responsive.spec.js` (asserted) |
| Contrast ≥ 4.5:1 body text | See the palette audit below | `tests/a11y.spec.js` (axe, asserted) |
| Visible focus rings, never removed | `:focus-visible` 2px cobalt outline | `tests/keyboard.spec.js` (asserted) |
| Darker text on light backgrounds | `--color-success-text`, `--color-danger-text` | axe |
| SVG icons, never emoji | `snippets/icon.liquid`, one 24px stroke system | Design review |
| `prefers-reduced-motion` respected | All durations collapse to 0ms | `critical.css` |
| Tabular figures for prices | `.tabular` on every price and order figure | Design review |

**Rejected, deliberately.** The skill's generic recommendation for "premium e-commerce" was the
**Liquid Glass** style (translucency, animated blur, chromatic aberration). Not adopted, for three
reasons — two of which the skill states itself:

1. It rates that style **Performance: Moderate-Poor** and flags **text contrast** risk. This
   theme has a hard 30 KB JS / 45 KB CSS budget and a 2.5s LCP target.
2. Glassmorphism is explicitly prohibited by the project brief.
3. `backdrop-filter` over a product photograph makes price and compatibility text unreliable to
   read — the two things a customer most needs.

Its default palette (black + gold) and font pairing (Rubik/Nunito Sans) were likewise not adopted:
the brief specifies the palette, and Manrope/Inter is the specified pairing. The skill's own
typography data independently lists Inter under "premium, precision, high-end utility", which
supports the choice.

---

## Colour

### Tokens

| Token | Value | Role |
|---|---|---|
| `--color-ink` | `#0B1220` | Midnight navy. Structural ink: utility bar, footer, strong type. |
| `--color-primary` | `#2457FF` | Cobalt. **The single conversion colour.** |
| `--color-primary-hover` | `#1743D3` | |
| `--color-accent` | `#B9F227` | Volt lime. **Device context only.** |
| `--color-background` | `#F7F8F5` | Porcelain — warm off-white, not stark |
| `--color-surface` | `#FFFFFF` | Cards, header, inputs |
| `--color-text-secondary` | `#667085` | |
| `--color-border` | `#DDE3EA` | The hairline that carries every card |
| `--color-success` | `#15845A` | Genuine availability (fills, icons, borders) |
| `--color-danger` | `#D92D20` | Genuine sale, errors, destructive (fills) |
| `--color-warning` | `#B54708` | |

### Distribution: 70 / 20 / 8 / 2

Approximately 70% porcelain and white, 20% midnight navy, 8% cobalt, **2% volt lime**.

The lime rule is the one that matters and the one most likely to erode:

> **Lime appears only where the interface is talking about the customer's device.**
> Selected device, verified compatibility, the active device chip, small editorial accents.
> If you are reaching for lime and the element is not about the customer's phone, you have the
> wrong token.

This rule erodes quietly, and it did: the design-system audit found **three violations** —
newsletter success text in two places (lime standing in for green because `--color-success`
measures only 3.99:1 on the navy footer) and, worst, the **default-address card** wearing the
device-context treatment. All three were fixed: white on navy (18.72:1) with the existing
check icon for the success states, and a cobalt tint for the address. A separate finding removed
three `outline-color: var(--color-accent)` focus overrides that had no accessibility
justification — cobalt on navy measures 3.46:1 and already clears the 3:1 UI threshold.

Check this rule on every review. `grep -rn "color-accent" sections/ snippets/` should return only
device-context surfaces.

Lime `#B9F227` measures ~1.5:1 on white. It is a **fill or an edge behind `--color-ink` text**,
never a text colour and never a general button background.

### Contrast audit — measured, not assumed

Run by axe-core in `tests/a11y.spec.js`. Every pair below is asserted on every test run.

| Pair | Ratio | Verdict |
|---|---|---|
| ink `#0B1220` on porcelain | **17.56** | Pass |
| white on ink | **18.72** | Pass |
| secondary `#667085` on porcelain | **4.67** | Pass |
| cobalt `#2457FF` on white | **5.41** | Pass |
| white on cobalt | **5.41** | Pass |
| ink on lime `#B9F227` | **14.08** | Pass (this is why lime is a fill) |
| ink on lime surface `#F2FBD9` | **17.45** | Pass |
| white on danger `#D92D20` | **4.83** | Pass (danger as a fill is fine) |

**Two genuine failures were found and fixed.** The palette as specified is correct for *fills*
but fell just short for *text on a light surface*:

| Pair | Measured | Required |
|---|---|---|
| success `#15845A` on porcelain | **4.40** | 4.5 |
| danger `#D92D20` on its own tint `#FDECEA` | **4.22** | 4.5 |

Rather than alter the brief's specified palette, dedicated **text variants** were added:

```
--color-success-text: #147D56;   /* 4.81 porcelain · 5.12 white · 4.53 own tint */
--color-danger-text:  #D02B1F;   /* 4.87 porcelain · 5.19 white · 4.54 own tint */
--color-warning-text: #B54708;   /* already passing at 5.09 / 5.43 / 4.95 */
```

**Rule: brand tokens for fills, borders and icons; `-text` variants wherever the colour carries
text.** The originally specified values remain in use and unchanged for their correct purpose.

### Semantic discipline

| Colour | Permitted use | Never |
|---|---|---|
| Cobalt | Primary conversion action | Decoration |
| Lime | Device context | A general button |
| Red | Genuine sale, errors, destructive | "Urgency" |
| Green | Genuine availability, success | Decoration |

---

## Typography

**Manrope** (600/700/800) headings · **Inter** (400/500/600/700) body and UI. Both SIL OFL 1.1,
self-hosted as WOFF2 with Latin and Latin-Extended subsets.

Manrope's slightly geometric, slightly humanist forms read as technical without being cold, which
is the tone the brief asks for: expert but warm. Inter is the most legible UI face at small sizes
in dense product grids — exactly where this store lives.

| Role | Desktop | Mobile | Notes |
|---|---|---|---|
| Display | 48/56 | 34/40 | Manrope 800, −0.03em |
| H1 | 40/48 | 30/36 | Manrope 700, −0.02em |
| H2 | 32/40 | 26/32 | |
| H3 | 24/32 | 24/32 | |
| Body | 16/24 | 16/24 | 16px minimum — below it iOS auto-zooms on focus |
| Small UI | 14/20 | 14/20 | |
| Caption | 12/16 | 12/16 | Never body copy |
| Price | 24/30 | 20/26 | Manrope 700 + `tabular-nums` |

Sizes interpolate with `clamp()` between the mobile and desktop values from the scale — no
invented intermediate steps.

Prices and order figures use `font-variant-numeric: tabular-nums` so columns align and a price
does not reflow as digits change.

**Do not add weights.** Every additional weight is another font file on the critical path.

---

## Spacing, layout, radii

**8-point system**: `--space-1` … `--space-10` = 4, 8, 12, 16, 24, 32, 48, 64, 80, 96. No
arbitrary values.

Max content width 1440px. Gutters 32 desktop / 24 tablet / 16 mobile.

### Radii are deliberately non-uniform

| Element | Radius |
|---|---|
| Button, input | 10px |
| Card | 12–14px |
| Large editorial surface | 18px |
| Status chip | pill |
| **Device-context notch** | **2px** (one corner only) |

Uniform rounding is the single clearest signal of a template. The mix is a signature — and the
2px notch is *the* signature (below).

---

## The device-context signature

The theme's one distinctive visual device. Anything tagged to the customer's phone gets:

```css
.surface--device {
  border-radius: 12px 12px 12px 2px;      /* asymmetric notch, bottom-left */
  border-inline-start: 3px solid var(--color-accent);
}
```

An asymmetric notch plus a lime edge. Used on the header device strip, the compatibility panel in
its EXACT state, the collection device note, and the mobile menu's finder entry — and nowhere
else. It makes "this is about *your* phone" legible at a glance without a word of explanation,
and it is not a shape any template ships with.

---

## Elevation and motion

**Cards are carried by a 1px hairline border, not a shadow.** Shadows are reserved for things
that genuinely float:

| Token | Use |
|---|---|
| `--shadow-menu` | Mega menu, predictive search panel |
| `--shadow-drawer` | Cart drawer, mobile menu |
| `--shadow-dialog` | Consent panel |

Motion: 140ms / 180ms / 220ms with `cubic-bezier(0.2, 0, 0.13, 1)`. Every duration collapses to
`0ms` under `prefers-reduced-motion: reduce`. Nothing animates decoratively.

---

## Components

All in `snippets/`, each with a `{% doc %}` block declaring its parameters.

| Component | File | Note |
|---|---|---|
| Buttons | `critical.css` | primary / secondary / ink / ghost, 48px min height |
| Icon button | `critical.css` | 44×44, always with a visually-hidden label |
| Icons | `icon.liquid` | One 24px stroke-1.6 system. **Never emoji.** |
| Inputs, select, textarea | `critical.css` | 48px, inline SVG chevron (no icon font) |
| Colour swatches | `product-swatches.liquid`, `variant-picker.liquid` | Real radios on PDP; hit area expanded to 44px via `::after` |
| Compatibility badge | `compat-badge.liquid` | Five states, each with its own icon |
| Price | `price.liquid` | Percentage gated on a real prior price |
| Product card | `product-card.liquid` | One tab stop per card |
| Stock status | `stock-status.liquid` | Icon + text, never colour alone |
| Pickup status | `pickup-status.liquid` | Variant-specific, from Shopify |
| Badges | `product-badges.liquid` | Max 2, priority sale > new > bestseller |
| Breadcrumbs | `breadcrumbs.liquid` | Emits BreadcrumbList schema |
| Filter chips | `critical.css` `.chip` | 44px min height |
| Drawer | `cart-drawer.liquid`, `mobile-menu.liquid` | Focus trap, Escape, focus return |
| Accordion | `critical.css` `.accordion` | Native `<details>` — **no JavaScript** |
| Alerts / validation | `critical.css` `.field__error` | `aria-describedby`, specific messages |
| Skeleton | `critical.css` `.skeleton` | Hidden under reduced motion |
| Empty states | `critical.css` `.empty-state` | Always carries a next action |
| Pagination | `pagination.liquid` | Real links + optional load-more |
| Store card | `store-page.liquid` | NAP consistent with schema |

### Shared vs scoped CSS

Component CSS lives in each file's `{% stylesheet %}` block, which Shopify bundles. A class used
by **more than one** file lives in `critical.css` instead — Theme Check's `ValidScopedCSSClass`
enforces this, and it is also simply correct: a duplicated definition drifts. (One did: `.chip`
was defined in both places and the stale 36px copy won the cascade, breaking the target-size
rule until the duplicate was removed.)

---

## Prohibited

Generic dropshipping styling · gradients as decoration · glassmorphism · uniform pill rounding ·
full-viewport empty heroes · neon/gaming aesthetics · random animation · heavy shadows · cheap or
mixed icon sets · **emoji as interface icons** · fake urgency, scarcity, reviews, countdowns or
discounts · autoplay mobile video · newsletter popup on entry · unnecessary carousels · hidden
navigation · AI-looking imagery · copied competitor assets · lorem ipsum in merchant-visible
content.
