---
name: device-compatibility-architect
description: Device and accessory compatibility modelling for phone-accessory catalogues. Use when designing or changing metaobjects for device brand/family/model, compatibility metafields, the device finder, compatibility badges, device-filtered collections, or compatibility-aware cross-sell.
---

# Device Compatibility Architect

The commercial core of this store: a customer must never be left guessing whether an accessory
fits their phone, and the store must never claim a fit it cannot prove.

## Data model

**Metaobjects**

| Type | Fields |
|---|---|
| `device_brand` | name, handle, logo, active, sort_order |
| `device_family` | name, brand (ref), handle, active, sort_order |
| `device_model` | name, brand (ref), family (ref), model_year, aliases, image, active, sort_order |
| `product_family` | name, handle, description — groups one design sold for many devices |

**Product metafields** — `custom.compatible_devices` (`list.metaobject_reference` to
`device_model`) and `custom.compatibility_level` (single choice: `exact_fit`, `compatible`,
`universal`, `adapter_required`), plus `custom.compatibility_notes` and the accessory spec fields.

## Resolution — the only correct logic

| Condition | State |
|---|---|
| selected device in list AND level `exact_fit` | EXACT |
| selected device in list AND level `compatible` | COMPATIBLE |
| level `universal` | UNIVERSAL |
| selected device in list AND level `adapter_required` | ADAPTER |
| device selected AND list non-empty AND device not in list | MISMATCH |
| no device selected | render nothing |

**Invariants that must never break:**

1. `universal` **never** resolves to EXACT. A universal charger is not an exact fit for anything.
2. Compatibility is **never** inferred from collection membership, tags-as-truth, or title text.
   A product sitting in `/collections/cover-iphone-16-pro` proves nothing on its own.
3. MISMATCH **warns**, it does not block. Offer "Vedi prodotti compatibili" and let the customer
   proceed — they may be buying for someone else.
4. An empty `compatible_devices` list with no level set is **UNKNOWN**: render nothing rather than
   guessing. Silence is better than a false claim.

## Source of truth vs projection

The metaobject reference list is **authoritative**. The `device:<handle>` tag is a **derived
projection** that exists because storefront filtering and automated collections are far more
reliable on tags. The import pipeline regenerates tags from metaobjects. Never edit a device tag
by hand — it will be overwritten, and a divergence is a silent lying-compatibility bug.

## Product strategy per category

| Category | Strategy |
|---|---|
| Cases | Separate product per exact model (dimensions, images, stock all differ). Link via `custom.product_family`. |
| Screen protectors | One exact-fit product per model or genuine model group. |
| Chargers | Variants only for real choices: colour, plug, port configuration. |
| Cables | Variants for length, colour, pack size, connector. |
| Power banks | Variants for capacity or colour only where genuinely stocked separately. |

**Do not** make device model a variant option unless it is a genuine inventory-tracked SKU. A
40-model variant matrix is unmanageable in Admin and breaks Shopify option limits.

## Device finder

Flow: brand → family → exact model → category (or "show all compatible"). Must provide model
search, popular models, recently selected, back navigation, "Cambia dispositivo",
"Rimuovi dispositivo", a no-results state, and a path to browse everything without choosing a
device. Persist in `localStorage` for guests only. **Cross-device account sync is not achievable
theme-only — document it as an app requirement rather than implying it works.**

## Search tolerance

Match model aliases aggressively: `S24 Ultra`, `S 24 Ultra`, `Galaxy S24 Ultra`, `iPhone15Pro`,
`iPhone 15 Pro`. Normalise by lowercasing, stripping spaces and punctuation before comparison.
Store alternates in the `device_model.aliases` field.

## Cross-sell rule

Cross-sell must be **compatibility-aware**: case to matching screen protector for the same model,
charger to the correct cable, magnetic case to compatible magnetic charger. Never recommend an
incompatible product because it is popular.
