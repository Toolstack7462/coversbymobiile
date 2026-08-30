---
name: core-web-vitals
description: Core Web Vitals performance engineering for Shopify themes. Use when adding images, fonts, scripts or sections, when auditing LCP/INP/CLS, or when enforcing the theme JS and CSS budgets.
---

# Core Web Vitals

Targets at the **75th percentile**: LCP 2.5s or better, INP 200ms or better, CLS 0.1 or better.

Hard theme budgets: **30 KB gzipped JS**, **45 KB gzipped CSS**. `npm run budgets` enforces both.

## LCP

The LCP element on a collection or product page is almost always the first product image or the
hero. Exactly **one** image per page gets `loading="eager"` plus `fetchpriority="high"`. Everything
else is `loading="lazy"`.

- Always `image_url: width: N` with a real `srcset` and an accurate `sizes` that matches the CSS.
- Shopify serves WebP/AVIF automatically through `image_url` — do not hand-roll `<picture>`.
- Preload only genuinely critical resources. Preloading everything is the same as preloading
  nothing, and it steals bandwidth from the LCP image.
- Inline critical CSS for above-the-fold; defer the rest.

## CLS

Every media box is reserved before it loads: explicit `width` and `height` attributes, or an
`aspect-ratio` on the container. This is non-negotiable for product grids.

Other CLS sources to avoid: banners injected above content after load, fonts swapping to a
metrically different fallback, dynamically inserted cart notices that push layout, badges that
appear after a JS check. Reserve space or render server-side.

Font swap: use `font-display: swap` with a fallback stack whose metrics are close, and adjust with
`size-adjust` if a visible reflow remains.

## INP

INP is dominated by main-thread work during interaction.

- No framework. Native custom elements, small modules, `type="module"` and deferred.
- Never parse a large JSON blob on load. Do not dump every variant into the page when the
  selected variant plus option map will do.
- Debounce predictive search (roughly 200-300ms) and abort superseded `fetch` calls.
- Use the Section Rendering API to re-render markup server-side instead of building DOM strings.
- Keep event handlers cheap; move non-urgent work behind `requestIdleCallback`.
- Do not attach scroll or resize listeners without throttling.

## Things that quietly destroy the budget

Animation libraries. Carousel libraries. Multiple sliders on one page. Duplicated analytics.
Autoplay hero video. Icon fonts. Unneeded app scripts. Loading all four font weights when two are
used. Every one of these is prohibited or must be justified in writing.

## App scripts

App scripts are usually the largest performance liability in a Shopify theme, and they are outside
theme control. Before recommending any app, document its storefront script weight and likely
effect on INP. Never install two apps that solve the same problem.

## Measurement

- `npm run budgets` for the hard byte budgets (fails the build).
- Lighthouse for lab LCP/CLS/TBT.
- Real-user CWV must come from Shopify Web Performance reporting or CrUX once live — lab numbers
  are indicative only. **Do not report a lab score as a field result.**

Never optimise a score by damaging usability: removing focus styles, stripping alt text, blocking
images or deferring content the customer needs is not a performance win.
