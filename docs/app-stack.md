# App stack

**No app was installed.** This project had no store access, and installing apps is a merchant
decision with a recurring cost, a permissions footprint and a performance cost. This document is
a recommendation set with the reasoning attached, so the merchant can decide.

App scripts are usually the **largest performance liability** in a Shopify theme and are outside
theme control. The theme holds a 30 KB JS budget; a single heavy app can exceed the entire theme
several times over. Every app below is judged on that basis too.

---

## Install these (Shopify-native, free)

### Search & Discovery — **required**

Not optional for this store. It is what makes the whole discovery layer work.

| Configure | Why |
|---|---|
| Filters per collection | The theme renders whatever `collection.filters` returns. This is how chargers show wattage while cases show protection level, with no conditional code. |
| Synonyms | Italian terms customers actually type — see the table in `docs/information-architecture.md` |
| Product boosts | Merchandising control |
| **Complementary products** | This is what makes cross-sells compatibility-aware. Curate them per product. |

Cost: free. Storefront weight: none (server-side).

### Translate & Adapt — required for the English locale

Italian is the default. `locales/en.json` ships complete (380 keys, exact parity), but **product
titles, descriptions, collection text and metafield values** are merchant content and need
translating here.

Cost: free. Storefront weight: none.

### Shopify Bundles — required if you sell the kits

The homepage bundles section and `docs/catalog-data-model.md` assume inventory-aware bundles. This
is what makes a bundle go out of stock when a component does, rather than selling a kit you
cannot assemble.

Cost: free. Storefront weight: none — the theme renders bundles as ordinary products.

### Customer Privacy / consent

Already used by the theme via `window.Shopify.customerPrivacy`. Confirm the consent banner is
enabled and that a privacy policy page is set in **Theme settings → Privacy e consenso**.

---

## Choose one: reviews

**Needed for:** star ratings on cards and PDPs, the reviews section, and `AggregateRating`
structured data. Without one, the theme renders **no stars anywhere** — which is correct and
deliberate, not a bug.

| Option | Storefront weight | Notes |
|---|---|---|
| **Judge.me** | Moderate | Widely used in the EU, writes the standard `reviews.rating` metafields the theme already reads, has an app block |
| **Loox** | Heavier (photo reviews) | Strong visually; more script |
| **Okendo** | Heavier | More capable, higher cost |

**Requirements whichever you choose:**

1. It must write `reviews.rating` and `reviews.rating_count` metafields — the theme reads those
   already, so ratings appear with no code change.
2. It must offer an **app block** for `sections/reviews.liquid`.
3. It must **not** emit its own `AggregateRating` JSON-LD if the theme is also emitting product
   schema — duplicate conflicting schema is worse than none. Check and disable one side.
4. Reviews must be genuine and verified. Fabricated or incentivised-without-disclosure reviews
   are prohibited under Directive (EU) 2019/2161 as implemented in Italy.

---

## Choose one: email

For newsletter and transactional marketing. The theme's newsletter form is Shopify-native, so
addresses land in Shopify with **no third-party script on the page** — a genuine performance and
privacy advantage worth keeping.

| Option | Notes |
|---|---|
| **Shopify Email** | Free tier, zero extra storefront script, no data leaves Shopify. Start here. |
| Klaviyo | More capable segmentation; adds a storefront script and sends customer data to a third party — needs a consent and DPA review |
| Omnisend | Middle ground |

Whatever you choose, keep the **form** native. Do not replace it with an app's embedded form,
which is how a page gains a blocking script and a popup.

---

## Consider

| Need | Option | Judgement |
|---|---|---|
| Google Shopping / free listings | **Google & YouTube** sales channel | Recommended. Official, free, no storefront script. |
| Customer chat | **Shopify Inbox** | Only if the merchant can actually staff it. An unanswered chat widget is worse than none. WhatsApp is already linked throughout and costs nothing. |
| Analytics | **Shopify Customer Events** (web pixels) | Preferred over pasting a tag into the theme. Consent-aware by design. |
| Back-in-stock alerts | Various | Genuinely useful for a device-specific catalogue where a single model sells out |
| Bulk metaobject/metafield import | **Matrixify** | Recommended for a large device catalogue. Import-time only, no storefront weight. |

---

## Cross-device wishlist — the honest position

The theme's wishlist, comparison and saved device are **per-browser** (`localStorage`). The UI
says so plainly rather than letting customers assume otherwise.

Making them follow a customer across devices genuinely requires either:

1. a **wishlist app** with its own datastore, or
2. a **custom app** using customer metafields plus a customer-account extension.

Both add cost, a permission footprint and storefront script. Neither was installed.

**What was deliberately not done:** the theme does not pretend. There is no "saved to your
account" message on a `localStorage` list. That would be a lie the customer discovers only when
they lose their list.

---

## Before installing anything

Answer these in writing:

| Question | Why it matters |
|---|---|
| Why is native Shopify insufficient? | Most requests are already met by Search & Discovery or Bundles |
| What permissions does it request? | An app asking for `read_customers` to show reviews is over-scoped |
| Recurring cost? | Monthly, per-order, or usage-based |
| What does it inject into the storefront? | Measure before/after with `npm run budgets` and Lighthouse |
| Likely INP effect? | Script-heavy apps are the usual cause of poor INP |
| Who owns the data? | And can you export it if you leave? |
| What happens on removal? | Orphaned metafields, broken app blocks, dead sections |

**Never install two apps that solve the same problem.** Two review apps means two sets of
structured data, two scripts and two sources of truth.

---

## Prohibited by the theme's design

| App category | Why |
|---|---|
| Countdown / urgency / scarcity | Fabricated urgency is an unfair commercial practice under EU consumer law |
| Fake or auto-generated reviews | Illegal under Directive (EU) 2019/2161 |
| "Recent purchase" / "N viewing" popups | Fabricated social proof; also a CLS and INP liability |
| Entry newsletter popups | Obstructs the first product view; consent by obstruction is weak consent |
| Checkout DOM modifiers | Unsupported and against Shopify's terms |
| Anything injecting tracking before consent | Breaks the consent model the theme implements |
