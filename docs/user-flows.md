# User flows

Seven flows, including the two failure paths where accessory stores actually lose sales.

Legend: **→** step · *italics* = system response · ⚠ = failure branch

---

## 1. Search-first shopping

The most common mobile entry.

1. Customer lands on any page → types `cover iphone 16 pro` in the header field
2. *After 250ms, predictive search fetches rendered results (Section Rendering API)*
3. *Panel shows: product thumbnails, brand, title, compatibility line, price; then matching
   categories, guides and pages; then "Vedi tutti i risultati"*
4. Customer either picks a product → PDP, or presses Enter → `/search?q=`
5. *Search results page offers the same filters and sorting as a collection*

**Design notes.** The form is a real GET form: with JS unavailable, Enter still searches.
Superseded requests are aborted so a slow early keystroke cannot overwrite a fast later one.

⚠ **No results** → see flow 7.

---

## 2. Device-first shopping

1. Customer taps "Trova il tuo dispositivo" (header, hero, mobile drawer or bottom bar)
2. *Device finder opens: search field, recently selected chips, then brand → family → model tree*
3. Customer either types `s25 ultra` (*list filters live across names AND aliases*) or expands
   Samsung → Galaxy S → Galaxy S25 Ultra
4. Customer taps the model
5. *Device saved to `localStorage`; announced politely; navigation proceeds to that model's
   collection*
6. *From now on: header chip shows "Il mio dispositivo: Galaxy S25 Ultra"; every product card
   shows a compatibility line; the PDP panel resolves against this device*

**Design notes.** The whole tree is server-rendered `<details>` with real links — the flow works
with **zero JavaScript**, just without persistence. Guest-only, per-browser; the UI never claims
cross-device sync.

⚠ **No products for that model** → "Nessun prodotto per {device}" with universal alternatives and
a contact route. Never a blank page.

---

## 3. Category-first shopping

1. Customer opens "Caricatori" from the mega menu
2. *Collection page: breadcrumbs, H1, result count, device chip if a device is set, filters in a
   permanent left sidebar (desktop) or a drawer button (mobile)*
3. Customer applies Wattage 65W + USB PD
4. *URL updates via `pushState`; results and filters re-render; count announced to screen readers*
5. Customer changes sort to "Prezzo crescente"
6. *`page` param dropped, results re-render*
7. Customer presses **browser back**
8. *`popstate` re-renders the previous filtered state — not a jump to an unfiltered page*

**Design notes.** Filter state lives entirely in the URL, so the view is shareable, bookmarkable
and refresh-safe. Which filters appear is merchant configuration in Search & Discovery, which is
why chargers show wattage and cases show protection level with no conditional code.

---

## 4. Online delivery purchase

1. PDP → customer picks colour
2. *Variant map matches the combination; URL gains `?variant=`; media jumps to that variant*
3. *Price, availability, SKU and pickup re-render **from the server** (Section Rendering API) —
   never recomputed in the browser*
4. Customer sets quantity (capped at real inventory when tracked and not oversellable)
5. Add to cart → *`/cart/add.js`, then the drawer re-renders from Shopify and opens; addition
   announced politely*
6. Checkout → **Shopify native checkout**
7. Customer proceeds **as a guest** — account creation is never required

---

## 5. In-store pickup purchase

1. PDP → customer selects a variant
2. *Pickup block renders from `variant.store_availabilities` — real inventory at a real location*
3. *States: "Disponibile per il ritiro presso {negozio}" with a ready-time **only** if Shopify or
   the merchant configured one; otherwise no time is shown at all*
4. Customer adds to cart → cart notes that shipping or pickup is chosen at checkout
5. Checkout → customer selects the pickup location
6. *Shopify handles the fulfilment method, notifications and POS handoff*

**The rule that matters.** The theme never says "Ritiro oggi" because online stock exists. A
wrong pickup promise sends a real person to a shop for an item that is not there.

⚠ **Pickup unavailable for that variant** → stated plainly, with shipping offered instead.

---

## 6. ⚠ Incompatibility recovery

The flow that separates a credible accessory store from a careless one.

1. Customer has `iPhone 16 Pro` selected
2. They open a case built for `Galaxy S25 Ultra`
3. *Compatibility panel resolves to **MISMATCH**: red surface, warning triangle, "Questo prodotto
   non risulta compatibile con il dispositivo selezionato"*
4. *A "Vedi prodotti compatibili" action links to the customer's own device collection*
5. **Navigation and purchase are NOT blocked** — the customer may be buying for someone else

**Why not block.** Blocking assumes the store knows the customer's intent better than they do,
and it is wrong often enough to cost real sales. Warn clearly, offer the alternative, let them
decide.

**The invariant behind this.** A `universal` product NEVER resolves to EXACT, whatever else is
set. A universal charger is not an exact fit for anything, and claiming otherwise is the single
most damaging thing this data model could do.

---

## 7. ⚠ Out-of-stock and no-results recovery

Every dead end offers a way forward.

| Situation | What the customer gets |
|---|---|
| Search found nothing | Spelling hint, device finder, WhatsApp contact, merchant-chosen suggested categories |
| Filters exclude everything | "Nessun prodotto corrisponde ai filtri" + one-click clear-all |
| Collection genuinely empty | All products, plus contact |
| Variant sold out | Other variants remain visible and selectable (struck through, not hidden), pickup still checkable |
| Product unavailable | Related and complementary recommendations still render |
| Cart empty | Continue shopping + device finder |
| Wishlist/comparison empty | Explanation plus a route back into the catalogue |
| 404 | Search field first, then home, device finder and category shortcuts |

**Why unavailable variants are shown, not hidden.** Hiding a sold-out colour makes a customer
believe the store never stocked it. Showing it struck through tells the truth and keeps the
option available for when it returns.
