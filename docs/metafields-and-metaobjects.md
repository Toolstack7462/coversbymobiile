# Metafields and metaobjects

Exact definitions to create in **Shopify Admin → Settings → Custom data**. Create metaobjects
first: several product metafields reference them.

A field that does not exist simply renders nothing — the theme degrades quietly. But
compatibility depends on `compatible_devices` and `compatibility_level`, so those two are not
optional if the device features are to work.

---

## 1. Metaobjects

### `device_brand`

Settings → Custom data → Metaobjects → Add definition. Name: **Device brand**, type:
`device_brand`. Enable **"Storefronts"** access so Liquid can read it.

| Field name | Key | Type | Notes |
|---|---|---|---|
| Nome | `name` | Single line text | "Apple", "Samsung" |
| Logo | `logo` | File (image) | Merchant-uploaded. The theme ships no manufacturer logos — trade dress cannot be bundled with a theme. |
| Collezione | `collection` | Collection reference | Landing collection for the brand. Optional; falls back to a search URL. |
| Attivo | `active` | True or false | Uncheck to hide without deleting |
| Ordinamento | `sort_order` | Integer | Ascending |

The handle comes from Shopify (`system.handle`) — do not add a separate handle field.

### `device_family`

| Field name | Key | Type | Notes |
|---|---|---|---|
| Nome | `name` | Single line text | "iPhone Pro", "Galaxy S" |
| Marca | `brand` | Metaobject reference → `device_brand` | Required |
| Attivo | `active` | True or false | |
| Ordinamento | `sort_order` | Integer | |

### `device_model`

The one that matters most.

| Field name | Key | Type | Notes |
|---|---|---|---|
| Nome | `name` | Single line text | Exactly as customers say it: "iPhone 16 Pro Max" |
| Marca | `brand` | Metaobject reference → `device_brand` | Required |
| Famiglia | `family` | Metaobject reference → `device_family` | Required |
| Anno | `model_year` | Integer | Optional; useful for sorting |
| Alias di ricerca | `aliases` | Single line text | **Comma-separated.** e.g. `S25 Ultra, S 25 Ultra, SM-S938B, galaxy s25ultra` |
| Immagine | `image` | File (image) | Optional |
| Collezione | `collection` | Collection reference | The model's landing collection. Optional; falls back to search. |
| Attivo | `active` | True or false | |
| Ordinamento | `sort_order` | Integer | |

**`aliases` is what makes search forgiving.** The theme normalises by lowercasing and stripping
every non-alphanumeric character, so `S 25 Ultra`, `s25ultra` and `S25-Ultra` already match one
another. Use `aliases` for genuinely different strings: manufacturer part numbers, common
misspellings, regional names.

### `product_family`

Groups one physical design sold as separate products for different exact devices.

| Field name | Key | Type |
|---|---|---|
| Nome | `name` | Single line text |
| Descrizione | `description` | Multi-line text |

---

## 2. Product metafields — namespace `custom`

### Compatibility (required for the device features)

| Key | Type | Storefront filter? | Notes |
|---|---|---|---|
| `compatible_devices` | **List of metaobject references** → `device_model` | Enable if your plan supports it | The authoritative record |
| `compatibility_level` | Single line text, **choices**: `exact_fit`, `compatible`, `universal`, `adapter_required` | Yes | Use the exact lowercase values — the theme matches on them |
| `compatibility_notes` | Multi-line text | No | Free text shown under the panel |
| `product_family` | Metaobject reference → `product_family` | No | |

### Classification

| Key | Type | Notes |
|---|---|---|
| `accessory_type` | Single line text, **choices**: `case`, `screen_protector`, `charger`, `cable`, `powerbank`, `audio`, `car_mount`, `smartwatch`, `tablet` | **Drives the category-specific spec table and the comparison rows.** Use these exact values. |

### A deliberate typing decision: Sì/No specs are TEXT, not boolean

Fields such as `gan`, `usb_pd`, `magsafe_compatible` are **single line text with choices `Sì` /
`No`**, not true/false metafields.

Two reasons, both practical:

1. **Liquid treats `false` as blank.** A `false` boolean is indistinguishable from an unset field
   in a `!= blank` check, so "GaN: No" could never be displayed — only silently omitted. "No" is
   genuinely useful information on a spec sheet.
2. **The displayed value is already correct Italian.** A boolean would render `true`, needing a
   translation layer for no benefit.

Flags that are *never displayed as text* (`is_new`, `is_bestseller`) remain true/false booleans,
because there the "unset means no" collapse is exactly what we want.

### Specifications

| Key | Type | Applies to | Displayed as |
|---|---|---|---|
| `material` | Single line text | all | Materiale |
| `colour_family` | Single line text | case | Colore |
| `dimensions` | Single line text | all | Dimensioni |
| `weight_g` | Integer | all | Peso (` g` appended) |
| `warranty_information` | Multi-line text | all | Garanzia |
| `connector_input` | Single line text | charger, cable, powerbank | Ingresso / Connettore A |
| `connector_output` | Single line text | charger, cable | Uscite / Connettore B |
| `wattage_w` | Integer | charger, cable, powerbank | ` W` appended |
| `output_per_port` | Single line text | charger | Potenza per porta |
| `port_count` | Integer | charger, powerbank | Numero di porte |
| `plug_type` | Single line text | charger | Tipo di spina |
| `usb_pd` | Text (Sì/No) | charger | USB Power Delivery |
| `pps_supported` | Text (Sì/No) | charger | PPS |
| `gan` | Text (Sì/No) | charger | Tecnologia GaN |
| `cable_included` | Text (Sì/No) | charger | Cavo incluso |
| `cable_length` | Single line text | cable | Lunghezza |
| `data_speed` | Single line text | cable | Velocità dati — **only if verified** |
| `certification` | Single line text | cable, all | Certificazioni dichiarate — **only if verified** |
| `pack_quantity` | Integer | cable | Quantità per confezione |
| `capacity_mah` | Integer | powerbank | ` mAh` appended |
| `rated_capacity_mah` | Integer | powerbank | Capacità nominale |
| `wireless_charging` | Text (Sì/No) | powerbank, case | Ricarica wireless |
| `qi2_certified` | Text (Sì/No) | powerbank | **Only if genuinely certified** |
| `magsafe_compatible` | Text (Sì/No) | powerbank, case | Compatibilità magnetica |
| `passthrough` | Text (Sì/No) | powerbank | Ricarica pass-through |
| `protection_level` | Single line text | case | Livello di protezione |
| `raised_camera_edge` | Text (Sì/No) | case | Bordo rialzato fotocamera |
| `hardness` | Single line text | screen_protector | **Only if supplied by the manufacturer** |
| `privacy_filter` | Text (Sì/No) | screen_protector | Filtro privacy |
| `anti_glare` | Text (Sì/No) | screen_protector | Antiriflesso |
| `edge_coverage` | Single line text | screen_protector | Copertura |
| `installation_kit` | Single line text | screen_protector | Kit di applicazione |
| `fingerprint_sensor_notes` | Single line text | screen_protector | Sensore di impronte |
| `in_the_box` | Rich text | all | Contenuto della confezione |

### Price integrity

| Key | Type | Notes |
|---|---|---|
| `prior_price_30d` | **Money** | The lowest price applied in the preceding 30 days. **A percentage discount is displayed only when this is set.** |
| `prior_price_reference_date` | Date | When that reference was established |

Shopify's `compare_at_price` alone renders a strikethrough with **no** percentage. See
`docs/legal-review-checklist.md`.

### Merchandising flags

| Key | Type | Notes |
|---|---|---|
| `is_new` | True or false | Shows the "Novità" badge |
| `is_bestseller` | True or false | Shows "Più venduto". A merchandising claim — set it deliberately, never by default. |

### Product safety (EU GPSR)

All optional; the whole safety block is absent unless at least one is filled.

| Key | Type |
|---|---|
| `manufacturer_name` | Single line text |
| `manufacturer_address` | Multi-line text |
| `manufacturer_contact` | Single line text |
| `eu_responsible_person` | Single line text |
| `eu_responsible_address` | Multi-line text |
| `eu_responsible_contact` | Single line text |
| `product_identifier` | Single line text |
| `safety_warnings` | Rich text |
| `usage_limitations` | Single line text |
| `battery_notes` | Multi-line text |
| `disposal_notes` | Multi-line text |
| `manual_url` | URL |
| `safety_document_url` | URL |

**The theme never draws a CE badge.** `certification` is displayed as the merchant's own recorded
text, because a compliance mark rendered from an unverified flag is a false claim.

### Reviews (written by your reviews app)

| Key | Type | Notes |
|---|---|---|
| `reviews.rating` | Rating | Standard Shopify convention |
| `reviews.rating_count` | Integer | Stars render **only** when both exist and count > 0 |

---

## 3. Enabling storefront filters

Search & Discovery → Filters → Add filter. Add only what is relevant per category:

| Category | Filters to enable |
|---|---|
| All | Availability, Price, Vendor, `compatibility_level` |
| Chargers | `connector_output`, `port_count`, `wattage_w`, `usb_pd`, `pps_supported`, `gan`, `cable_included` |
| Cables | `connector_input`, `connector_output`, `cable_length`, `wattage_w`, `pack_quantity` |
| Power banks | `capacity_mah`, `wattage_w`, `port_count`, `wireless_charging`, `qi2_certified`, `magsafe_compatible` |
| Cases | `material`, `colour_family`, `protection_level`, `magsafe_compatible` |
| Screen protectors | `material`, `privacy_filter`, `anti_glare`, `installation_kit` |

The theme renders whatever `collection.filters` returns, so **irrelevant filters never appear**
without a line of conditional code — that is a configuration decision, exactly where it belongs.
