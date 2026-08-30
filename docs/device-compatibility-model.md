# Device compatibility model

The commercial core of the store. Everything here exists to answer one question honestly:
**does this accessory fit my phone?**

## The single source of behaviour

| Condition | State | Italian shown |
|---|---|---|
| selected device ∈ `compatible_devices` AND level `exact_fit` | **EXACT** | Compatibilità esatta con {device} |
| selected device ∈ list AND level `compatible` | **COMPATIBLE** | Compatibile con {device} |
| level `universal` (regardless of the list) | **UNIVERSAL** | Accessorio universale — controlla connettore e potenza |
| selected device ∈ list AND level `adapter_required` | **ADAPTER** | Compatibile tramite adattatore |
| device selected, list non-empty, device ∉ list | **MISMATCH** | Questo prodotto non risulta compatibile… |
| no device selected | *render nothing* | — |
| level set but list empty | *render nothing* | Incomplete data — say nothing |

Implemented once, in `resolveCompatibility()` in `assets/device-context.js`. It is exported
specifically so it can be unit-tested. **Change it and you change what the store claims about
fit** — treat it as commercial copy, not plumbing.

## Four invariants that must never break

1. **`universal` NEVER resolves to EXACT.** A universal 65W charger is not an exact fit for an
   iPhone 16 Pro. This is checked first in the function, before the device is even considered.
2. **Compatibility is never inferred.** Not from collection membership, not from tags-as-truth,
   not from the product title, not from the description. A product sitting in
   `/collections/cover-iphone-16-pro` proves nothing on its own — a merchant can add anything to
   a collection.
3. **MISMATCH warns, it never blocks.** The customer may be buying for someone else. Show the
   warning, offer "Vedi prodotti compatibili", let them proceed.
4. **Unknown means silent.** No level and no device list renders nothing at all. Silence is
   always better than a false claim.

## Why resolution happens in the browser

Shopify serves fully cached pages. If the selected device were resolved on the server, visitor
A's phone would be baked into the HTML served to visitor B.

So the split is:

- **Server** emits the product's compatibility *facts* as data attributes:
  `data-level="exact_fit" data-devices="iphone-16-pro,iphone-16-pro-max"`
- **Client** (`<compat-badge>`) reads the device from `localStorage` and resolves.

The server still renders a meaningful default for the device-independent case (`universal`), so
the component is useful with JavaScript disabled and there is no layout shift when JS upgrades it.

**Consequence to state honestly:** device selection is per-browser. There is no cross-device
account sync, and the UI never implies one. Adding it would require a customer-account app or a
custom app with a datastore — see `docs/app-stack.md`.

## Source of truth vs projection

```
custom.compatible_devices   ← AUTHORITATIVE (metaobject references)
        │
        │  import pipeline derives
        ▼
product tag  device:iphone-16-pro   ← PROJECTION (for filters + automated collections)
```

**The metaobject list wins.** Tags exist because storefront filtering and automated collections
are far more reliable on tags than on metaobject references, and because automated collection
rules can act on them.

Tags are **generated**, never hand-maintained in parallel. If the two ever disagree, regenerate
the tag from the metaobject. A silent divergence here is a lying-compatibility bug: the filter
would show a product the compatibility panel then contradicts.

## Product-vs-variant strategy

| Category | Strategy | Why |
|---|---|---|
| **Cases** | One product per exact model | Dimensions, images and stock all genuinely differ. Link designs with `custom.product_family`. |
| **Screen protectors** | One product per model or genuine model group | Same reason; groups only where the cut is truly identical |
| **Chargers** | Variants for real choices only: colour, plug type, port configuration | Never a variant per phone — a charger is not model-specific |
| **Cables** | Variants for length, colour, pack size, connector | Within Shopify's option limits |
| **Power banks** | Variants for capacity or colour where separately stocked | |

**Never make device model a variant option** unless it is a genuine inventory-tracked SKU. A
40-model variant matrix is unmanageable in Admin, breaks Shopify's option limits, and makes the
variant picker unusable.

## Worked examples

### A case for one phone
```
compatible_devices  = [iPhone 16 Pro]
compatibility_level = exact_fit
accessory_type      = case
derived tag         = device:iphone-16-pro
```
Customer with an iPhone 16 Pro → EXACT (lime, notched panel).
Customer with a Galaxy S25 Ultra → MISMATCH + link to their own collection.

### A universal GaN charger
```
compatible_devices  = []            (or a broad list; it makes no difference)
compatibility_level = universal
accessory_type      = charger
```
**Every** customer → UNIVERSAL: "controlla connettore e potenza". Never EXACT, for anyone.
This is the case that most often gets misrepresented in accessory stores, and the one invariant
above exists to prevent it.

### A USB-C to Lightning cable for an older iPhone
```
compatible_devices  = [iPhone 14, iPhone 13, iPhone 12]
compatibility_level = compatible
```
iPhone 13 → COMPATIBLE. iPhone 16 (USB-C) → MISMATCH, correctly: this cable does not fit it.

### A 3.5mm adapter
```
compatible_devices  = [iPhone 16, iPhone 16 Pro]
compatibility_level = adapter_required
```
→ ADAPTER: amber, "Compatibile tramite adattatore". Honest about the extra step.

## Search tolerance

Customers type model names inconsistently. `normalise()` in `assets/device-finder.js` lowercases
and strips every non-alphanumeric character, so these already collapse to one another:

| Typed | Normalised |
|---|---|
| `Galaxy S24 Ultra` | `galaxys24ultra` |
| `S 24 Ultra` | `s24ultra` |
| `s24ultra` | `s24ultra` |
| `iPhone15Pro` | `iphone15pro` |
| `iPhone 15 Pro` | `iphone15pro` |

Matching is substring-based across the model name, its brand, and every entry in `aliases`. Use
`aliases` for strings normalisation cannot reach: manufacturer part numbers (`SM-S938B`), common
misspellings, regional names.

`normaliseQuery()` in `assets/predictive-search.js` does the complementary job for site search —
it also sends a space-separated variant so Shopify's own prefix matching can work on
`iphone 15 pro` when the customer typed `iphone15pro`.

## Compatibility-aware cross-selling

Recommendations must respect fit. Configure complementary products in Shopify Search & Discovery:

| From | Recommend | Never |
|---|---|---|
| Case for iPhone 16 Pro | Screen protector for iPhone 16 Pro | A screen protector for a different model |
| USB-C charger | USB-C cable | A Lightning cable |
| MagSafe case | Magnetic charger, magnetic car mount | A non-magnetic mount |
| Power bank | The right cable for the customer's phone | An incompatible connector |

Recommending a popular product that does not fit is worse than recommending nothing: it produces
a return, a refund and a lost customer.
