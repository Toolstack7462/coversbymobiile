# Device management guide

How to add a phone brand, a range or a model. **No code, no developer, no deployment.** This is
the point of the metaobject design: your catalogue of devices changes constantly and must not be
gated on an engineer.

---

## The three levels

```
Marca (device_brand)         Apple
  └ Linea (device_family)      iPhone Pro
      └ Modello (device_model)   iPhone 16 Pro
```

A model must have both a brand and a family. Create them top-down.

---

## Adding a new brand

**Settings → Custom data → Metaobjects → Device brand → Add entry**

| Field | Enter |
|---|---|
| Nome | The brand as customers say it: `Nothing` |
| Logo | Upload the manufacturer's logo (see the note below) |
| Collezione | The brand's landing collection, if you have one. Optional. |
| Attivo | ✔ |
| Ordinamento | A number. Lower shows first. Leave gaps of 10 so you can insert later. |

Save. The brand now appears in the device finder and in "Acquista per marca" — no deploy.

> **Logos.** The theme ships no manufacturer logos, deliberately: a brand logo is protected trade
> dress and cannot be bundled with a theme. Upload logos you are entitled to use. If you leave it
> blank, the brand name is shown as text, which is always safe.

---

## Adding a family

**Metaobjects → Device family → Add entry**

| Field | Enter |
|---|---|
| Nome | `Galaxy S` |
| Marca | Pick the brand |
| Attivo | ✔ |
| Ordinamento | Newest ranges first is usually right |

Families are how customers narrow from "Samsung" (60 models) to "Galaxy S" (6). Without them the
finder becomes an unusable wall of models.

---

## Adding a model — the important one

**Metaobjects → Device model → Add entry**

| Field | Enter | Notes |
|---|---|---|
| Nome | `Galaxy S25 Ultra` | Exactly as customers say it. This text appears in "Compatibile con …". |
| Marca | Samsung | |
| Famiglia | Galaxy S | |
| Anno | `2025` | Optional |
| **Alias di ricerca** | `S25 Ultra, S 25 Ultra, SM-S938B, galaxy s25ultra` | **Comma-separated. See below.** |
| Immagine | Optional | |
| Collezione | The model's landing collection | Optional; falls back to search |
| Attivo | ✔ | |
| Ordinamento | `10` | Newest first |

### What to put in "Alias di ricerca"

The theme already handles spacing and punctuation automatically. It lowercases and strips
everything that is not a letter or digit, so **these already match without any alias**:

| Customer types | Matches |
|---|---|
| `Galaxy S25 Ultra` | ✔ |
| `S 25 Ultra` | ✔ |
| `s25ultra` | ✔ |
| `S25-Ultra` | ✔ |

Use aliases for things normalisation cannot reach:

- **Manufacturer part numbers** — `SM-S938B`, `A3084`
- **Common misspellings** — `Galassy S25`
- **Regional or carrier names** — where the same phone is sold under another name
- **Older marketing names** customers still use

### Hiding a model without deleting it

Uncheck **Attivo**. It disappears from the finder and the brand tree, but every product still
references it and nothing breaks. Deleting a model that products point at leaves those products
with a dangling reference — hide, do not delete.

---

## Connecting products to devices

On the product: **Metafields → `custom.compatible_devices`** → pick one or more device models.
Then set **`custom.compatibility_level`**:

| Level | Use when | Customer sees |
|---|---|---|
| `exact_fit` | Made for this exact model | Compatibilità esatta con {modello} |
| `compatible` | Works with it, not moulded for it | Compatibile con {modello} |
| `universal` | Fits anything with the right port | Accessorio universale — controlla connettore e potenza |
| `adapter_required` | Needs an adapter | Compatibile tramite adattatore |

### The one rule that matters most

**A universal product must be set to `universal` and left with no device list.**

If you set a universal charger to `exact_fit` and list every phone you sell, the store will tell
every customer it is an exact fit for their phone. It is not, and that is a false claim that
produces returns.

The theme protects against half of this — a product marked `universal` will *never* display as an
exact fit, whatever devices are listed. But it cannot detect a genuinely universal product that
you have mislabelled `exact_fit`. That one is on the data.

---

## Popular models in the finder

The finder shows "Modelli popolari" from the recently-selected devices in each customer's own
browser. There is no merchant setting for this, and no shared "popular" list — it is genuinely
per-customer.

---

## Checking your work

1. Open the storefront device finder.
2. Type a partial model name — results should filter as you type.
3. Pick a model. The header should show `Il mio dispositivo: …` with a lime edge.
4. Open a product you marked `exact_fit` for that model → green/lime "Compatibilità esatta".
5. Open a product for a *different* model → red mismatch warning **plus** a "Vedi prodotti
   compatibili" link. The customer should still be able to buy it.
6. Open a universal product → "Accessorio universale", **never** "esatta".

If step 6 shows "esatta", the product is mislabelled. Fix the level.

---

## Bulk work

Adding 50 models by hand is slow. Options:

| Approach | When |
|---|---|
| **Matrixify** (app) | Bulk metaobject import/export from CSV. The practical choice for a large catalogue. |
| **Admin API** | If you have development resource. Scopes needed: `write_metaobjects`, `read_metaobject_definitions`. |
| **By hand** | Fine for under ~30 models |

`data/device-models.csv` is a starter template with the right column shape.
