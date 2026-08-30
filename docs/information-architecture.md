# Information architecture

## The two shoppers

This catalogue has two entry mindsets, and the IA treats them as equals rather than making one
subordinate to the other.

| Shopper | Opening thought | Entry point |
|---|---|---|
| **Category-first** | "I need a charger." | Main navigation, category cards, search |
| **Device-first** | "I have an iPhone 16 Pro. What fits it?" | Device finder, device collections, search by model |

A third route — **search-first** — cuts across both and is the most common on mobile, which is
why the search field is one of the most prominent controls in the header rather than an icon.

Both paths must reach any product in a small number of steps, and the physical shop must be
reachable from anywhere.

## Primary navigation

Per the brief. Each top-level item maps to a collection handle.

| Label | Handle | Notes |
|---|---|---|
| Cover | `/collections/cover` | Largest category; device-filtered heavily |
| Protezione schermo | `/collections/protezione-schermo` | "vetro" and "pellicola" are search synonyms |
| Caricatori | `/collections/caricatori` | Wattage/PD/GaN filters matter most here |
| Cavi | `/collections/cavi` | Connector-from / connector-to / length |
| Power Bank | `/collections/power-bank` | Capacity, Qi2, magnetic |
| MagSafe e magnetici | `/collections/magsafe` | Cross-category; a genuine Italian shopping grouping |
| Audio | `/collections/audio` | "auricolari", "cuffie" |
| Supporti Auto | `/collections/supporti-auto` | |
| Smartwatch | `/collections/smartwatch` | |
| Accessori Tablet | `/collections/accessori-tablet` | |
| Offerte | `/collections/offerte` | Only genuinely reduced products |
| Nuovi Arrivi | `/collections/nuovi-arrivi` | |
| Trova per Dispositivo | `/pages/trova-dispositivo` | The device-first door |

### Mega menu structure

For a category with children, the panel shows: sub-categories as column headings, popular models
or types beneath, and **at most one** merchandising image (a `promo` block matched to that exact
menu item). Navigation first — the image is optional and never displaces links.

## Device taxonomy

Three metaobject levels, all merchant-editable with no code change:

```
device_brand      Apple, Samsung, Xiaomi, Google Pixel, OPPO, OnePlus, Motorola, Huawei, Nothing
  └ device_family     iPhone, iPhone Pro, Galaxy S, Galaxy A, Redmi Note, Pixel …
      └ device_model      iPhone 16 Pro, Galaxy S25 Ultra, Pixel 9 Pro XL …
```

Adding a brand is a data entry task, not a deployment. That is a hard requirement from the brief
and is why the finder and the "shop by brand" section both read from metaobjects.

## URL structure

Shopify-native patterns only. No invented routing.

| Purpose | Pattern | Example |
|---|---|---|
| Category | `/collections/<handle>` | `/collections/cover` |
| Category × device | `/collections/<category>-<model>` | `/collections/cover-iphone-16-pro` |
| Category × attribute | `/collections/<category>-<attribute>` | `/collections/caricatori-usb-c` |
| Brand accessories | `/collections/accessori-<brand>-<model>` | `/collections/accessori-samsung-galaxy-s25` |
| Product | `/products/<handle>` | |
| Filtered view | `?filter.p.m.custom.<key>=<value>` | Shopify storefront filtering, `noindex, follow` |
| Sorted view | `?sort_by=` | `noindex, follow` |
| Search | `/search?q=` | `noindex, follow` |

**Device landing pages are earned, not generated.** A `collection.device` page may exist only
when it has genuinely compatible products, unique introductory content, and real search value.
Mass-generating a page per model is the fastest way to have an accessory store classified as
low-value. Where a model does not clear that bar, it is a filter, not a page.

## Utility navigation

Present in the header utility bar (desktop), mobile menu and footer:

- Il nostro negozio → `/pages/negozio`
- Ritiro in negozio → `/pages/ritiro-in-negozio`
- Assistenza → `/pages/assistenza`
- Contatti → `/pages/contatti`
- Traccia ordine → Shopify order status / `/account`
- Account → `/account` (optional; guest checkout always available)
- Wishlist → `/pages/preferiti`
- Language/market selector → Shopify Markets form (add when a second market is enabled)

## Footer groups

| Group | Contents |
|---|---|
| **Acquista** | Main categories, Offerte, Nuovi arrivi, Trova per dispositivo |
| **Assistenza** | Contatti, Spedizioni, Resi e recesso, Garanzia legale, FAQ, Traccia ordine |
| **Negozio** | Il nostro negozio, Ritiro in negozio, Orari, Indicazioni |
| **Informazioni legali** | Privacy, Cookie, Termini, Note legali, Sicurezza prodotto, Accessibilità |
| **Social** | Only the profiles actually configured in theme settings |
| **Newsletter** | Native Shopify customer form |

The footer also carries the NAP block (name, address, phone) and the legal identifiers (P.IVA,
REA) — the same values the `LocalBusiness` structured data reads, so they can never disagree.

## Mobile navigation

- **Header:** compact logo, menu button, account, cart — then a full-width search field below
  the icon row. Search is not hidden behind an icon.
- **Bottom bar:** Home, Shop, Dispositivo, Preferiti, Carrello. It hides itself on the product
  template, where the sticky add-to-cart bar occupies the same space — two stacked fixed bars
  would obscure content and violate WCAG 2.2 *Focus Not Obscured*.
- **Drawer:** device finder pinned at the top (fastest route to a relevant product on mobile),
  then the category tree as nested `<details>`, then utility links.

## Device context as a persistent layer

Once a device is selected it becomes ambient rather than a mode the customer can get lost in:

- a chip in the header on every page,
- a note on collection pages,
- the compatibility line on every product card,
- the compatibility panel beside the buy button.

It is always removable in one click, and browsing without a device is always available
("Vedi tutti i prodotti senza selezionare un dispositivo"). The device never becomes a trap.

## Search

Search spans product title, SKU, vendor, product type, accessory type, device names and aliases,
connector, wattage and relevant metafields — configured in Shopify Search & Discovery.

Italian synonyms to configure (Search & Discovery → Synonyms):

| Group |
|---|
| cover, custodia, case |
| vetro, pellicola, screen protector, proteggi schermo |
| caricatore, alimentatore, charger, caricabatterie |
| cavo type c, cavo usb c, usb-c, usbc |
| powerbank, power bank, batteria esterna, batteria portatile |
| supporto auto, car holder, porta telefono auto |
| auricolari, cuffie, earbuds |

Model-format tolerance is handled in the theme (`normalise()` in `assets/device-finder.js` and
`normaliseQuery()` in `assets/predictive-search.js`), so `S24 Ultra`, `S 24 Ultra` and
`iPhone15Pro` all resolve.
