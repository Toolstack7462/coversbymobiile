# CSV templates

Three templates. Import them in this order — compatibility references devices, and devices
reference brands and families.

| File | Imported via | Purpose |
|---|---|---|
| `device-models.csv` | Metaobject entries (Admin or Matrixify) | The device catalogue |
| `products.example.csv` | Shopify Admin → Products → Import | Product shape reference, including the multi-variant row pattern |
| `compatibility-mapping.csv` | Metafield import (Matrixify) or the optional utility | Links products to device models |

## Notes that save time

- **`products.example.csv` is a SHAPE reference, not seed data.** The rows use `example.com`
  image URLs that will fail on import. Replace every value with real merchant data.
- **Multi-variant rows:** the second and subsequent variants of a product repeat the `Handle`
  and leave the product-level columns empty. See the two `cover-trasparente-…` rows.
- **`compatibility_level` must be one of** `exact_fit`, `compatible`, `universal`,
  `adapter_required` — exactly these lowercase strings. The theme matches on them.
- **Leave brand/family/model empty for a universal product.** A universal accessory has no
  device list, and the theme will never claim an exact fit for it.
- **Tags starting `device:`, `brand:`, `type:` or `feature:` are GENERATED**, derived from the
  metaobject links. Do not hand-maintain them in parallel — see
  `docs/device-compatibility-model.md`.

Full procedure: `docs/product-import-guide.md`.
