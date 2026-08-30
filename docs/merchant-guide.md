# Merchant guide

For the person running the shop. No coding required for anything in this document.

---

## 1. First-run setup (do this in order)

### Step 1 — Business and store details

**Online Store → Themes → Customise → Theme settings**

| Section | Fill in |
|---|---|
| **Marchio** | Logo, logo width, tagline |
| **Dati aziendali** | Ragione sociale, P.IVA, REA, email, telefono, WhatsApp, indirizzo per i resi |
| **Negozio fisico** | Nome, via, CAP, città, provincia, orari, coordinate, link indicazioni |
| **Social** | Only the profiles you actually have |

**Leave anything you cannot verify empty.** Every field in this theme is written so that a blank
value renders *nothing* — never a placeholder. An empty phone number shows no phone number; an
invented one sends a customer to the wrong place.

> The WhatsApp number is international format, no spaces or `+`: `39XXXXXXXXXX`.

### Step 2 — Opening hours, twice

Two fields, deliberately:

- **Orari di apertura (testo mostrato)** — what customers read. Free text, one line per day.
  e.g. `Lunedì–Venerdì 09:30–13:00, 15:30–19:30`
- **Orari di apertura (formato dati strutturati)** — what Google reads. schema.org format:
  `Mo-Fr 09:30-13:00`

If you are unsure of the structured format, **leave it blank**. The theme simply omits it. A
wrong opening time in Google's results sends real people to a closed door.

### Step 3 — Menus

**Online Store → Navigation.** Create:

| Menu handle | Used by |
|---|---|
| `main-menu` | Header and mega menu |
| `footer-acquista` | Footer column 1 |
| `footer-assistenza` | Footer column 2 |
| `footer-legale` | Footer column 3 |

The mega menu builds from the nesting: top level = tab, second level = column heading, third
level = links beneath it.

### Step 4 — Pages

Create these (Online Store → Pages) and assign the matching template:

| Page handle | Template | Purpose |
|---|---|---|
| `negozio` | `page.negozio` | The shop page |
| `trova-dispositivo` | `page.trova-dispositivo` | Device finder |
| `preferiti` | `page.preferiti` | Wishlist |
| `confronta` | `page.confronta` | Comparison |
| `contatti`, `assistenza` | `page` | Content pages |
| Legal pages | `page` | See `docs/legal-review-checklist.md` |

Then link the legal pages in **Theme settings → Privacy e consenso** so the footer and cookie
banner can find them.

### Step 5 — Devices

See `docs/device-management-guide.md`. Nothing device-related works until this is done, and the
device finder will show a setup message instead of a broken box.

---

## 2. Everyday tasks

### Adding a product

1. Products → Add product. Title, description, images, price, SKU.
2. **Set the category**: metafield `custom.accessory_type` — this drives which specification rows
   and comparison rows appear. Without it the product still works, but the spec table falls back
   to generic rows.
3. **Set compatibility**: `custom.compatible_devices` (pick the device models) and
   `custom.compatibility_level`.
4. Fill the specification metafields that apply. **Leave the rest empty** — blank rows are hidden,
   so a half-filled spec table looks intentional rather than unfinished.
5. Assign to collections.

### Putting something on sale — read this before you do

The theme has a deliberate rule about discounts:

| What you set | What the customer sees |
|---|---|
| `Compare at price` only | Old price struck through. **No percentage.** |
| `Compare at price` + `custom.prior_price_30d` | Struck-through price **and** "Risparmi il X%" **and** the 30-day reference price |

This is not a limitation, it is compliance. Italian law (D.Lgs. 84/2022, implementing the EU
Price Indication Directive) requires an announced reduction to reference the **lowest price
applied in the previous 30 days**. Shopify's `compare_at_price` is a merchandising field and is
not by itself proof of that. Fill `prior_price_30d` with the genuine lowest price of the last 30
days and the percentage appears.

### Marking something as new or bestselling

Metafields `custom.is_new` and `custom.is_bestseller` (true/false). A maximum of two badges show
per card, in the order: sale, new, bestseller.

**"Più venduto" is a claim about your sales.** Set it deliberately, based on real sales data or a
real merchandising decision — never as a default on everything.

### Low-stock messaging

Off by default. To enable: **Theme settings → Vendita → Mostra l'avviso di scorte limitate**, and
set the threshold.

It only appears when Shopify is genuinely tracking that variant, the variant cannot be oversold,
and the real quantity is at or below your threshold. It cannot be used to manufacture urgency,
which is intentional.

### Free shipping bar

Off by default. Two things must both be true:

1. **Theme settings → Vendita → Soglia per la spedizione gratuita** — the amount **in cents**
   (`4900` = €49,00)
2. You have actually configured free shipping at that threshold in **Settings → Shipping**

The theme cannot verify (2). If they disagree, the customer finds out at checkout — the worst
possible moment. Keep them in step.

---

## 3. The homepage

Every section is drag-and-drop in the theme editor. The recommended order ships in the theme:

1. Hero · 2. Trova il tuo dispositivo · 3. Categorie popolari · 4. I più venduti ·
5. Acquista per marca · 6. Campagna · 7. Nuovi arrivi · 8. Kit e bundle · 9. Negozio e ritiro ·
10. Perché sceglierci · 11. Visti di recente · 12. Recensioni · 13. Guide · 14. Newsletter ·
15. Testo SEO

Two placements are deliberate and worth keeping:

- **The device finder is second, right under the hero.** On mobile a customer reaches it with one
  short scroll. Moving it down measurably reduces its use.
- **The hero is compact.** It does not fill the screen, so products stay reachable.

### Sections that hide themselves

Several sections render nothing when unconfigured rather than showing an empty frame:

| Section | Hidden when |
|---|---|
| Negozio e ritiro | Store name/address not filled in |
| Acquista per marca | No `device_brand` metaobjects |
| Guide | Blog empty or not selected |
| Recensioni | No reviews app block added |
| Kit e bundle | No bundle products selected |
| Barra informativa | No claims added |

This is intentional. An empty section looks broken; an absent one looks finished.

---

## 4. What the theme will not do (and why)

| Request | Answer |
|---|---|
| "Add a countdown timer to the sale" | Not implemented. A fabricated deadline is an unfair commercial practice under EU consumer law. A real deadline belongs in a Shopify discount with an end date. |
| "Show '12 people are viewing this'" | Not implemented. Fabricated social proof, same legal exposure. |
| "Add some review stars until we get real ones" | Not possible. Stars render only from genuine review data. |
| "Show a percentage off using compare-at price" | Only with `prior_price_30d`. See above. |
| "Say 'ready for pickup today'" | Only if Shopify or you configured a pickup time for that location. The theme never infers it from online stock. |
| "Put a CE badge on the products" | Only as recorded text in `custom.certification`. The theme never draws a compliance mark from a flag. |

---

## 5. Wishlist, comparison and saved device

All three are stored **in the customer's own browser**, not in their account.

That means: they do not follow the customer to another phone or another browser, and clearing
browser data clears them. The interface says so (`I preferiti sono salvati su questo dispositivo
e su questo browser`) rather than letting customers assume otherwise.

If cross-device sync becomes a requirement, see `docs/app-stack.md` — it needs an app, and the
theme deliberately does not fake it.

---

## 6. Getting help

| Topic | Document |
|---|---|
| Adding devices and models | `docs/device-management-guide.md` |
| Importing products | `docs/product-import-guide.md` |
| Pickup and POS | `docs/pickup-pos-guide.md` |
| Apps | `docs/app-stack.md` |
| Legal pages | `docs/legal-review-checklist.md` |
| Going live | `docs/launch-checklist.md` |
