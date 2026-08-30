---
name: technical-seo
description: Technical and local SEO for Shopify storefronts. Use when writing meta tags, canonicals, structured data, breadcrumbs, collection/device landing pages, internal linking, or LocalBusiness data for a physical shop.
---

# Technical SEO

## Fundamentals

- Semantic HTML. One logical `<h1>`. Headings describe structure, not styling.
- Editable title and meta description per page; never auto-generate a description from body text.
- `<link rel="canonical">` on every page. Respect Shopify's canonical for filtered and paginated
  views — filtered collection URLs should not be indexed as duplicates.
- Open Graph and Twitter card tags. `robots` directives where a page must not be indexed.
- Do not fight Shopify's sitemap. Use native URL patterns.
- Descriptive `alt` on every meaningful image.
- Real internal linking: collection to related collection, product to device collection, guide to
  product. Orphan pages do not rank.

## Structured data — genuine data only

Emit: `Product` + `Offer`, `ProductGroup` where a design spans devices, `BreadcrumbList`,
`Organization`, `LocalBusiness`, `WebSite` + `SearchAction`. `FAQPage` only where eligible.

**Guard every block.** If the underlying field is blank, emit nothing. Specifically:

- `AggregateRating` **only** with genuine review data. Never fabricate a rating.
- `LocalBusiness` **only** when the merchant address, phone and hours settings are filled in.
- `Offer` price and availability come from Shopify, never from a hardcoded string.
- Do not duplicate schema Shopify or an approved review app already outputs — duplicate
  conflicting blocks are worse than none.

Invalid or invented structured data risks a manual action. Honesty here is also self-interest.

## Collection and device pages

Use Shopify-native handles: `/collections/cover`, `/collections/cover-iphone-16-pro`,
`/collections/caricatori-usb-c`, `/collections/accessori-samsung-galaxy-s25`, `/collections/offerte`.

A device-specific collection page may exist **only** when all three are true:

1. it has genuinely compatible products in stock or reliably restocked,
2. it has unique introductory content, not a templated sentence with the model swapped,
3. there is real search or customer value.

**Do not mass-generate thousands of thin device pages.** That is the single fastest way to get an
accessory store classified as low-value. If a model has three compatible products, it belongs as a
filter, not a landing page.

## Content

Concise and useful. No keyword stuffing. Collection intros should help someone choose, not repeat
the category name six times. Editorial guides worth writing: how to choose a USB-C charger, which
power bank to pick, how to find a compatible case, MagSafe vs Qi vs Qi2, how to protect a screen.
Write few and write them properly — do not mass-generate thin articles.

## Local SEO

The physical shop is a ranking and trust asset. Maintain **consistent NAP** (name, address, phone)
across the store page, footer, structured data, Google Business Profile and social profiles. An
inconsistent phone number across sources measurably weakens local ranking.

Generate `LocalBusiness` only from verified merchant settings. **Never fabricate** awards, customer
counts, years in business, review scores or services. If opening hours are not configured, render
nothing rather than a plausible guess — a wrong opening time sends a real person to a closed door.
