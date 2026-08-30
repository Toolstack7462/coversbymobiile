# In-store pickup and POS

The shop is the merchant's real advantage over a marketplace. This is how the theme, Shopify and
POS fit together — and, importantly, what the theme deliberately does **not** decide.

---

## Architecture

```
Shopify Locations          ← the shop is a real location with real inventory
        │
        ├─ Inventory by location   ← one source of truth, no parallel database
        ├─ Local pickup enabled    ← per location, in Shopify settings
        │
        ├─→ Storefront: variant.store_availabilities  ← what the theme reads
        ├─→ Checkout:   pickup as a delivery method   ← Shopify handles this
        └─→ Shopify POS: same inventory, in the shop
```

**The theme reads. It never decides.** Every pickup statement on the storefront comes from
`variant.store_availabilities`, which Shopify derives from genuine stock at a location where you
have enabled pickup. The theme adds no logic of its own to it.

---

## Setup

### 1. Create the retail location

**Settings → Locations → Add location.** Enter the real shop address — this is the address used
for pickup instructions in customer notifications.

### 2. Enable local pickup

**Settings → Shipping and delivery → Local pickup →** select the shop location → **enable**.

Configure:

| Setting | Notes |
|---|---|
| **Expected pickup time** | e.g. "Usually ready in 2 hours". **This is where the storefront's ready-time comes from.** |
| Pickup instructions | Shown in the confirmation email — where to go, what to bring |

If you do not set an expected pickup time here, and do not set one in Theme settings, **the
storefront shows no time at all**. That is intentional: no time is better than a wrong one.

### 3. Stock the location

**Products → Inventory** → set quantities at the shop location. Pickup availability appears only
where there is real stock.

### 4. Optional theme fallback

**Theme settings → Vendita → Tempo di preparazione per il ritiro** — used only when Shopify has
no pickup time for that location. Shopify's own value always wins.

---

## What the customer sees

Variant-by-variant, on the product page:

| State | Shown | When |
|---|---|---|
| Available | ✅ "Disponibile per il ritiro presso {negozio}" + ready time *if configured* | Real stock at a pickup-enabled location |
| Unavailable | "Non disponibile per il ritiro" + "Puoi scegliere il ritiro al checkout" | No stock at that location |
| Nothing at all | — | No pickup-enabled locations exist |

**Pickup is variant-specific.** A black case can be on the shelf while the blue one is not, and
the block re-renders from the server whenever the customer changes variant — it is never
recalculated in the browser.

### The rule that protects the shop

> The theme never says "Ritiro oggi" because online stock exists.

A wrong pickup promise sends a real person on a wasted journey and costs a customer permanently.
The ready-time is only ever Shopify's configured value or your configured fallback.

---

## At checkout

Shopify's native checkout handles it. The customer chooses shipping or pickup, and Shopify:

- shows only locations that can actually fulfil the cart,
- collects the pickup person's details,
- sends a "ready for pickup" notification when staff mark it ready,
- decrements inventory at the correct location.

**The theme does not modify checkout.** It is not permitted to and it does not need to.

---

## In the shop, with POS

1. Order appears in **Shopify POS → Orders** (and in Admin).
2. Staff pick the item and mark the order **Ready for pickup** — this triggers the customer email.
3. Customer arrives; staff mark it **Picked up** / fulfilled.
4. Inventory is already reserved, so the shelf count stays correct.

Because online and shop inventory are the same Shopify inventory, a shop sale immediately reduces
what the storefront can sell. That is the whole point of not having a parallel database.

### POS recommendations

- Use **POS Pro** if you want in-store returns of online orders and staff permissions.
- Keep barcodes on products so POS scanning works — the `Variant Barcode` column in the import.
- Train staff on the pickup flow before launch: it is the most visible part of the omnichannel
  promise, and the easiest to get wrong on day one.

---

## Communicating pickup on the storefront

| Surface | What it says |
|---|---|
| Utility bar | "Ritiro in negozio" (a configured claim — remove it if you do not offer pickup) |
| Product page | Variant-specific availability |
| Cart and drawer | "Scegli spedizione o ritiro in negozio al checkout" |
| Homepage store section | Address, hours, ready-time — hidden entirely if the store is unconfigured |
| `/pages/negozio` | Full detail, services, FAQ, consent-gated map |

---

## Do not

- ❌ Build a separate pickup inventory. Shopify Locations is the source of truth.
- ❌ Show "available today" from online stock.
- ❌ Expose exact shop inventory quantities unless you have deliberately enabled
  `show_inventory_quantity`.
- ❌ Promise a ready-time you have not configured.
- ❌ Advertise pickup in the utility bar if pickup is not actually enabled.

---

## Testing (needs a real store)

These cannot be tested without an authenticated Shopify store, so they belong to the merchant
verification pass in `docs/launch-checklist.md`:

1. Product with shop stock → shows "Disponibile per il ritiro"
2. Product with no shop stock → shows "Non disponibile per il ritiro"
3. Change variant → the pickup block updates for that variant
4. Add to cart, go to checkout → pickup is offered as a delivery method
5. Complete a test order with pickup → confirmation names the right shop and instructions
6. Mark ready in POS → customer receives the ready-for-pickup email
7. Fulfil → inventory decrements at the shop location, not the warehouse
