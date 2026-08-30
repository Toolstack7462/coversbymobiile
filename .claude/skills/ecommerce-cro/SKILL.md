---
name: ecommerce-cro
description: Ethical ecommerce conversion-rate optimisation for product cards, collection pages, product detail pages, cart and checkout entry. Use when designing or reviewing commercial surfaces, badges, pricing display, urgency, cross-sell or empty states. Enforces honest merchandising.
---

# Ecommerce CRO — honest conversion

Conversion work here raises clarity, never pressure. Every technique below is legitimate because
it helps a customer decide faster, not because it manipulates them.

## The conversion hierarchy for an accessory store

The customer's blocking question is almost never price — it is **"does this fit my phone?"**.
Resolve that first, everywhere. A product card without a compatibility line is an unfinished card.

Product card order: image, badge (max 2), brand, title, **compatibility line**, rating (only if
real), price, prior price if legitimate, swatches, availability/pickup, wishlist, quick add.

PDP: put the compatibility panel **adjacent to the buy button**, not in a tab below the fold.

## Badges

Maximum **two** per card. Priority: genuine sale, then new, then bestseller. A badge must be
backed by data — "bestseller" requires actual merchandising or sales logic, not a merchant whim
applied to everything.

## Quick add

Only when **no meaningful choice remains**. If a product has a real colour or length choice, quick
add opens a selection interface. **Never silently add an arbitrary default variant** — it produces
returns and erodes trust.

## Free shipping progress

Render only when the threshold is configured, applies to the customer's market, and the wording is
accurate. A progress bar toward a threshold that does not apply is a lie with a nice animation.

## Cross-sell

**One** restrained, relevant cross-sell in cart. Compatibility-aware. Never auto-add a product to
the cart. Never pre-tick an add-on.

## Empty and error states are conversion surfaces

Every one gets a useful next action:

| State | Next action |
|---|---|
| No search results | spelling suggestion, related categories, device finder, WhatsApp help |
| No products for device | show universal alternatives, offer to change device |
| Empty cart | popular categories, device finder, continue shopping |
| Out-of-stock variant | other variants, pickup check, notify option if configured |
| Unavailable pickup | shipping option, other locations, estimated restock only if configured |

Never leave a blank page.

## Categorically forbidden

Fake countdowns. Fake stock counts. "17 people are viewing this." Fabricated review counts or
stars. Invented compare-at prices. Percentage savings computed from data you do not have.
Pressure copy inventing a deadline. Newsletter popup on entry. Interstitials that obstruct the
first product view.

These are prohibited on ethical grounds and because EU consumer-protection and price-indication
rules treat several of them as unfair commercial practices. Do not implement them even if asked
to "just for the demo" — a demo pattern becomes a production pattern.

## Measure honestly

Prepare analytics events (`view_item`, `add_to_cart`, `select_device`, `pickup_selected`, …) but
never log personal data into them, and never fire non-essential analytics before consent.
