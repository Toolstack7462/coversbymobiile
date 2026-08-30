# Catalogue data model

How products, collections and inventory are organised. Complements
`docs/metafields-and-metaobjects.md` (field definitions) and
`docs/device-compatibility-model.md` (fit logic).

## Principles

1. **Shopify is the only database.** Products, variants, inventory, locations, orders and
   customers live in Shopify. The theme adds no parallel store of any of them.
2. **Structured data over prose.** A specification belongs in a metafield, not in a paragraph of
   the description. Descriptions cannot be filtered, compared or checked.
3. **The catalogue is merchandised in Admin, not in code.** Which filters appear, which products
   are complementary, what counts as a bestseller — all configuration.

## Product types and their shape

| `accessory_type` | Products | Variants | Compatibility level |
|---|---|---|---|
| `case` | One per exact device model | Colour | `exact_fit` |
| `screen_protector` | One per model or genuine group | Pack size, finish | `exact_fit` |
| `charger` | One per SKU | Colour, plug type | `universal` |
| `cable` | One per SKU | Length, colour, pack | `compatible` (by connector) or `universal` |
| `powerbank` | One per SKU | Capacity, colour | `universal` |
| `audio` | One per SKU | Colour | `universal` or `compatible` |
| `car_mount` | One per SKU | Colour, mount type | `universal` |
| `smartwatch` | One per SKU / watch model | Size, colour | `exact_fit` |
| `tablet` | One per tablet model | Colour | `exact_fit` |

## Collections

### Manual vs automated

| Collection kind | Type | Rule |
|---|---|---|
| Category (`cover`, `caricatori`) | Automated | Product type or tag equals the category |
| Category × device (`cover-iphone-16-pro`) | Automated | Product type = Cover **AND** tag = `device:iphone-16-pro` |
| Attribute (`caricatori-usb-c`) | Automated | Tag contains `usb-c` |
| Offerte | Automated | Compare-at price is greater than price |
| Nuovi arrivi | Automated | Tag `nuovo`, or sort by newest |
| Bestsellers | Manual or automated + best-selling sort | Never a theme-side guess |
| Brand (`accessori-apple`) | Automated | Tag = `brand:apple` |

Automated collections work on **tags**, which is why the import pipeline derives a
`device:<handle>` tag from the metaobject list. The metaobject remains authoritative; the tag is
its projection.

### The rule for device landing pages

A `collection.device` page may exist only when **all three** hold:

1. it has genuinely compatible products, in stock or reliably restocked,
2. it has unique introductory content — not a template sentence with the model swapped,
3. there is real search or customer demand for it.

Otherwise the model is a **filter**, not a page. Mass-generating one thin page per model is the
fastest route to having an accessory store classified as low-value.

## Tag conventions

Tags are structured and generated. Never hand-edit a generated tag.

| Prefix | Purpose | Generated from |
|---|---|---|
| `device:` | Compatibility projection | `custom.compatible_devices` |
| `brand:` | Device brand | The model's brand |
| `type:` | Accessory type | `custom.accessory_type` |
| `feature:` | Filterable feature | e.g. `feature:magsafe`, `feature:gan` |

Free-text merchant tags without a prefix are fine and are never touched by the pipeline.

## Inventory

**Shopify inventory by location. There is no parallel inventory anywhere in this theme.**

| Concept | Source |
|---|---|
| Online sellable | Variant inventory at the online location(s) |
| Store stock | Variant inventory at the retail location |
| Pickup available | `variant.store_availabilities` — Shopify derives this from real stock at a location with pickup enabled |
| Unavailable | `variant.available == false` |
| Continue selling / preorder | `inventory_policy == 'continue'` |

Rules the theme enforces:

- Inventory is **variant-specific**. A black case can be on the shelf while the blue one is not.
- The client never determines availability. `assets/product.js` re-renders stock and pickup from
  the server after a variant change rather than computing them.
- Exact quantities are hidden unless `show_inventory_quantity` is explicitly enabled.
- Low stock requires **both** the merchant setting **and** real tracked inventory at or below the
  threshold, on a non-oversellable variant.

## Product media

| Position | Content |
|---|---|
| 1 | Clean packshot, square, consistent scale — this is the LCP image |
| 2 | Alternative angle |
| 3 | In use / lifestyle |
| 4 | Dimensions |
| 5 | Feature graphic |
| 6 | Package contents |
| 7 | Compatibility graphic |
| 8 | Safety or instruction visual, where useful |

- 1:1 primary ratio with consistent internal padding, so a small cable and a large power bank sit
  at a comparable optical scale.
- Never bake pricing or temporary promotional text into a product image — it cannot be
  translated, cannot be read by a screen reader, and goes stale.
- Alt text describes the product, never the filename.

## Bundles

Use **Shopify Bundles** (or another inventory-aware solution) so a bundle goes out of stock when
any component does.

| Bundle | Components |
|---|---|
| Protezione completa | Cover + vetro protettivo (same model) |
| Kit essenziale | Cover + vetro + caricatore + cavo |
| Kit auto | Supporto auto + caricatore auto + cavo |

The theme never fabricates bundle inventory, never computes a combined price, and never invents a
saving. A bundle saving is displayed only where the bundle product carries a legitimate
compare-at price, under the same rule as every other price.
