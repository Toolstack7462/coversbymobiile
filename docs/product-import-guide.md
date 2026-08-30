# Product import guide

Templates live in `data/`. Import in this order — compatibility references devices, devices
reference brands and families.

```
1. Brands + families      (metaobjects, by hand — there are few)
2. Device models          (data/device-models.csv)
3. Products               (data/products.example.csv shape)
4. Compatibility mapping  (data/compatibility-mapping.csv)
5. Derived tags           (generated from step 4)
6. Inventory by location
```

---

## 1–2. Devices

See `docs/device-management-guide.md`. For more than ~30 models, use **Matrixify** to import
`data/device-models.csv` as metaobject entries.

---

## 3. Products

**Products → Import** with a Shopify-standard CSV. `data/products.example.csv` shows the exact
column shape, including the multi-variant pattern.

### The multi-variant pattern

The second and later variants of a product repeat the `Handle` and leave the product-level
columns blank:

```csv
Handle,Title,...,Option1 Name,Option1 Value,Variant SKU,...
cover-x,Cover trasparente,...,Colore,Trasparente,COV-X-TR,...
cover-x,,,             ...,Colore,Blu notte,COV-X-BL,...
```

### Fields that matter for this theme

| Column | Why |
|---|---|
| `Handle` | The URL and the join key for every later step |
| `Type` | Feeds automated collections |
| `Tags` | `type:`, `device:`, `brand:`, `feature:` — see step 5 |
| `Variant SKU` | The join key for compatibility mapping |
| `Variant Inventory Tracker` | Must be `shopify` for stock, pickup and low-stock to work |
| `Variant Inventory Policy` | `deny` to stop overselling, `continue` for backorder |
| `Variant Compare At Price` | Sets a strikethrough — but **not** a percentage. See below. |
| `Image Alt Text` | Fill it. It is SEO and accessibility, and it is far cheaper to do at import. |

### Naming products so customers find them

Include the exact device name in the title of a device-specific product:

- ✅ `Cover trasparente antiurto per iPhone 16 Pro`
- ❌ `Cover trasparente antiurto` (relies entirely on metafields)

The first is what customers type into search.

---

## 4. Compatibility mapping

`data/compatibility-mapping.csv`:

```csv
product_handle,product_sku,device_brand,device_family,device_model,compatibility_level,compatibility_notes
```

Import with **Matrixify** (metafield columns) or the optional utility below.

**For universal products leave the brand/family/model columns empty** and set
`compatibility_level` to `universal`. A universal accessory has no device list, and the theme will
never claim an exact fit for it.

`compatibility_level` must be exactly one of: `exact_fit`, `compatible`, `universal`,
`adapter_required` — lowercase, no spaces. The theme matches on these strings.

---

## 5. Derived tags

The `device:<handle>` tag is a **projection** of `custom.compatible_devices`, used because
storefront filters and automated collections are far more reliable on tags.

**The metaobject is authoritative. The tag is generated.** Never maintain them independently — a
divergence means the filter shows a product whose compatibility panel then contradicts it.

Regenerate tags whenever compatibility changes, via Matrixify export → transform → import, or via
the utility below.

Conventions:

| Tag | From |
|---|---|
| `device:iphone-16-pro` | Each entry in `compatible_devices` |
| `brand:apple` | The model's brand |
| `type:case` | `custom.accessory_type` |
| `feature:magsafe` | `custom.magsafe_compatible = Sì` |

---

## 6. Inventory by location

**Settings → Locations** — at minimum an online/warehouse location and the retail shop.

Then **Products → Inventory**, set quantities per location. Pickup availability is derived by
Shopify from real stock at a location with pickup enabled. See `docs/pickup-pos-guide.md`.

---

## Optional: a scripted importer

**None is included in this repository, deliberately.** No Admin API credentials were available
and no live import was attempted.

If you build one, it must:

| Requirement | Why |
|---|---|
| Read credentials from **environment variables** only | Never a committed token. `.env` is gitignored; `.env.example` documents the shape. |
| Use a **custom app** scoped to `read_products`, `write_products`, `read_metaobjects`, `write_metaobjects`, `read_metaobject_definitions`, `write_metaobject_definitions` | Never a token with order, customer or payment scopes for an import job |
| **Validate before mutating** | Check every device handle resolves and every `compatibility_level` is one of the four valid values, *before* writing anything |
| Support **`--dry-run`** | Print what would change and exit |
| Produce an **error report** | A row-level CSV of what failed and why |
| **Never log secrets** | Not the token, not the shop domain, not customer data |
| **Never overwrite silently** | Report every field it changes |
| Respect **rate limits** | Back off on 429 |

`.env.example` in the repository root documents the expected variables.

---

## Verifying an import

1. Spot-check five products in Admin: metafields populated, category set, images attached.
2. Storefront: open a device-specific product → correct exact-fit message for that device.
3. Open a universal product → "Accessorio universale", **never** "esatta". If it says exact, the
   level is mislabelled.
4. Open a collection with filters → filter values appear and return sensible counts.
5. Search a model name and a model alias → both return results.
6. Check one product's spec table → only populated rows appear, no blanks and no "N/A".

---

## Common problems

| Symptom | Cause | Fix |
|---|---|---|
| Compatibility line missing | `compatibility_level` empty **and** no devices linked | Set at least one. Blank means unknown, and unknown deliberately renders nothing. |
| Universal product claims "esatta" | Level set to `exact_fit` | Set it to `universal` |
| Filters missing on a collection | Not enabled in Search & Discovery | Add the filter there — the theme renders whatever Shopify returns |
| Spec table empty | `custom.accessory_type` not set | Set it; it selects which rows apply |
| Discount percentage missing | `prior_price_30d` not set | Expected. See `docs/legal-review-checklist.md` |
| No pickup on the product page | Location has no stock, or pickup not enabled there | See `docs/pickup-pos-guide.md` |
| Stars not showing | No genuine review data | Expected. The theme never invents ratings. |
