---
name: shopify-theme-engineer
description: Shopify Online Store 2.0 Liquid theme engineering. Use when writing or reviewing sections, blocks, snippets, JSON templates, theme settings, metafield/metaobject access, Ajax Cart API, Section Rendering API, Predictive Search, storefront filtering, or in-store pickup. Enforces OS 2.0 conventions and blocks anti-patterns.
---

# Shopify Theme Engineer

Engineering rules for this theme. Read `CLAUDE.md` first — it overrides anything here.

## Architecture rules

- **JSON templates** for every page type that supports them. `.liquid` templates only for
  `gift_card` and where Shopify requires it.
- **Sections** own layout and settings. **Snippets** own reusable components. **Blocks** own
  repeatable merchant-configurable content.
- Every section that a merchant places needs `presets`. Every section that must not appear in
  header/footer groups needs `"disabled_on": { "groups": ["header", "footer"] }`.
- Use `{% doc %}` LiquidDoc on every snippet: `@param`, `@example`. Theme Check validates it.
- Component CSS goes in the file's `{% stylesheet %}` block — Shopify bundles them. Do not create
  one stylesheet per section in `assets/`.
- Component JS goes in `assets/<name>.js` as a native custom element, loaded `type="module"`.

## Liquid correctness

- `{%- liquid -%}` blocks for multi-statement logic; avoid tag soup.
- Guard every metafield access: `if product.metafields.custom.foo != blank`.
- Use `| default:` rather than nested `if` for fallbacks.
- Never `{{ }}` unescaped user or merchant HTML into an attribute. Use `| escape`.
- `| money` for currency, never manual formatting. `| t` for every visible string.
- Prefer `{% render %}` over `{% include %}` (deprecated). `render` gets an isolated scope —
  pass everything explicitly.
- Paginate with `{% paginate %}`; never rely on a JS-only list.

## Shopify APIs

| Need | Use | Never |
|---|---|---|
| Add/update/remove cart | `/cart/add.js`, `/cart/change.js` (Ajax Cart API) | custom cart backend |
| Re-render markup after a state change | Section Rendering API `?sections=` | innerHTML string building |
| Search suggestions | `/search/suggest.json` (Predictive Search) | third-party search unless documented |
| Related products | `/recommendations/products.json` | hand-rolled "you may also like" |
| Filters | `collection.filters` from Search & Discovery | bespoke filter engine |
| Pickup | `variant.store_availabilities` | invented availability text |

**Never** trust a client-supplied price, inventory count or discount. The server is authoritative;
the client only renders what Shopify returned.

## Filter and pagination rules

Filter state must live in the **URL query string**. Consequences that must hold:
browser back/forward works, a filtered view is shareable, and with JS disabled the page still
filters via a real `<form method="get">` submit. "Load more" must augment real pagination, never
replace it. No uncontrolled infinite scroll.

## Pickup and inventory

- Pickup availability is **variant-specific**, read from `variant.store_availabilities`.
- Never state "Ritiro oggi" because online stock exists. Only render what Shopify reports.
- Do not expose raw inventory quantities unless a setting explicitly enables it.
- Distinguish: online sellable, store-location stock, pickup available, unavailable, continue-selling.

## Anti-patterns that fail review

- Rebuilding checkout, cart totals, tax, shipping or discount logic in the theme.
- A parallel inventory or product database.
- Hardcoded Italian strings outside `locales/`.
- Hardcoded hex colours outside `snippets/theme-tokens.liquid`.
- `{% include %}`, inline `<style>` per section, or a JS framework.
- Reading compatibility from collection membership or product title text.
