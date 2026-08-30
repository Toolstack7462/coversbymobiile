# Launch checklist

Two parts: what was verified during development, and the **merchant verification script** — the
flows that genuinely cannot be tested without a live store and must be walked through by a human
before going live.

---

## Part 1 — Verified during development

Reproduce with `npm run verify`. Results in `docs/qa-report.md`.

- [x] Shopify Theme Check — 110 files, **0 offenses**
- [x] Prettier — all files conform (and it doubles as the JS syntax gate)
- [x] Asset budgets — JS **19.5 KB** / 30 KB, CSS **17.1 KB** / 45 KB gzipped
- [x] Playwright — **98 passed** across Chromium, Firefox, WebKit and an iPhone 14 viewport:
      responsive at 8 breakpoints, keyboard, axe-core, target sizes
- [x] Locale parity — it/en, 428 keys each, zero missing or extra
- [x] No secrets, tokens or store domains in the repository
- [x] Theme unpublished; `shopify theme publish` never run

---

## Part 2 — Merchant verification script

**These require a real store.** Work through them on the unpublished preview before publishing.
Each maps to a required scenario from the brief.

### Setup verification

- [ ] **1.** All Theme settings filled: brand, business, store, social, commerce
- [ ] **2.** Menus created: `main-menu`, `footer-acquista`, `footer-assistenza`, `footer-legale`
- [ ] **3.** Pages created with correct templates (negozio, trova-dispositivo, preferiti, confronta, legal)
- [ ] **4.** Device metaobjects populated; brands, families and models all `active`
- [ ] **5.** Search & Discovery: filters per collection, Italian synonyms, complementary products
- [ ] **6.** Locations created; local pickup enabled with an expected pickup time
- [ ] **7.** Payment methods enabled and tested in **test mode**

### Discovery

- [ ] **8.** Search `cover iphone 16 pro` → predictive panel shows products with images, prices and compatibility
- [ ] **9.** Search a model alias (`SM-S938B`) → correct model's products returned
- [ ] **10.** Search `iPhone15Pro` (no spaces) → same results as `iPhone 15 Pro`
- [ ] **11.** Device finder: Apple → iPhone → iPhone 16 Pro → compatible collection loads
- [ ] **12.** Selected device persists across pages; header chip shows it
- [ ] **13.** Apply a colour filter **and** an availability filter → results narrow correctly
- [ ] **14.** **Press browser Back → the filtered state is restored**, not an unfiltered page
- [ ] **15.** Copy the filtered URL into a new tab → same filtered view
- [ ] **16.** Change sort → results reorder, page resets to 1
- [ ] **17.** "Carica altri" appends products **and** updates the URL
- [ ] **18.** Disable JavaScript → filters still work via the submit button; pagination still works

### Product and compatibility

- [ ] **19.** Product card shows the correct compatibility line for the selected device
- [ ] **20.** ⚠ **A universal product is NOT marked as exact fit** for the selected device
- [ ] **21.** ⚠ An incompatible product shows the mismatch warning **and remains purchasable**
- [ ] **22.** Mismatch offers "Vedi prodotti compatibili" and it goes somewhere useful
- [ ] **23.** Change colour variant → image, price, SKU and availability all update
- [ ] **24.** **Pickup availability updates for the selected variant**
- [ ] **25.** A variant with no shop stock shows "Non disponibile per il ritiro"
- [ ] **26.** Spec table shows only populated rows — no blanks, no "N/A"
- [ ] **27.** A product with no reviews shows **no stars at all**
- [ ] **28.** A sale product **without** `prior_price_30d` shows a strikethrough and **no percentage**
- [ ] **29.** A sale product **with** `prior_price_30d` shows the percentage and the reference price
- [ ] **30.** Product safety section shows only entered data; **no CE badge is drawn**

### Cart and checkout

- [ ] **31.** Add to cart → drawer opens, count updates, addition is announced
- [ ] **32.** Change quantity in the drawer → totals update from the server
- [ ] **33.** ⚠ **Quantity cannot exceed available stock** — the message explains why
- [ ] **34.** Remove an item → cart updates; empty state offers a route onward
- [ ] **35.** Cart page works with JavaScript disabled (update + checkout)
- [ ] **36.** ⚠ **Guest checkout completes without creating an account**
- [ ] **37.** Checkout with **shipping** — test order completes
- [ ] **38.** Checkout with **in-store pickup** — location selectable, order completes
- [ ] **39.** Pickup confirmation email names the right shop with correct instructions
- [ ] **40.** Mark ready in POS → customer receives the notification
- [ ] **41.** Fulfil → inventory decrements at the **shop** location

### Trust, privacy and content

- [ ] **42.** ⚠ **Reject non-essential cookies → no analytics or marketing cookie is set.** Verify in DevTools → Application → Cookies, and Network.
- [ ] **43.** Accept → pixels fire as expected
- [ ] **44.** Footer "Preferenze cookie" reopens the panel and saved choices persist
- [ ] **45.** Store map does **not** load until the customer clicks "Carica la mappa"
- [ ] **46.** Store page shows **only verified merchant information**
- [ ] **47.** Footer NAP matches the store page and the structured data exactly
- [ ] **48.** Test `LocalBusiness` and `Product` schema in Google's Rich Results Test
- [ ] **49.** No `AggregateRating` is emitted for products without reviews

### Accessibility and resilience

- [ ] **50.** ⚠ **Keyboard only:** operate menu, search, filters, variant picker, cart drawer, dialogs — including Escape and focus return
- [ ] **51.** Screen reader: cart, filter and device changes are announced
- [ ] **52.** ⚠ **Long Italian text does not overflow** at 360px — check the longest product titles and device names
- [ ] **53.** A product with a missing image shows the fallback, not a broken icon
- [ ] **54.** 404 page offers search and category shortcuts
- [ ] **55.** Empty search offers spelling help, the device finder and WhatsApp
- [ ] **56.** Zoom to 200% → no content lost, no horizontal scroll
- [ ] **57.** `prefers-reduced-motion` on → no transitions or animation

### Real devices

Emulators miss safe areas, sticky-bar overlap and real touch accuracy.

- [ ] **58.** iOS Safari on a notched iPhone — sticky bars clear the home indicator
- [ ] **59.** Android Chrome
- [ ] **60.** Desktop Chrome, Firefox, and Safari if available — note all three engines already
      pass the automated suite; this step is about real rendering, not emulation
- [ ] **61.** Mobile bottom nav does **not** appear on product pages (sticky buy bar instead)

### Performance (field data, not lab)

- [ ] **62.** Lighthouse on home, a collection and a product — record the numbers
- [ ] **63.** After launch, monitor **real** CWV in Shopify Web Performance or CrUX. Lab numbers are indicative only.
- [ ] **64.** Re-run `npm run budgets` after every app install

---

## Part 3 — Legal gate

**Do not publish until `docs/legal-review-checklist.md` is signed off.** Every box, including the
professional sign-offs.

---

## Part 4 — Publishing

The theme is intentionally unpublished and this project never publishes it.

```bash
# 1. Authenticate (you do this — no credentials are stored in this repository)
npx shopify theme dev --store your-store.myshopify.com

# 2. Push as an UNPUBLISHED development theme
npx shopify theme push --unpublished --theme "Italian Tech Atelier v1"

# 3. Preview and work through Part 2 above on the preview URL
```

Then publish **from the Shopify Admin**, deliberately, after the checklist is complete:
**Online Store → Themes → [your theme] → Actions → Publish.**

Keep the previous theme available for rollback.

### Immediately after publishing

- [ ] Submit the sitemap in Google Search Console
- [ ] Connect Google Business Profile with matching NAP
- [ ] Verify the Google & YouTube channel product feed
- [ ] Place one real order end-to-end and refund it
- [ ] Place one real pickup order and collect it in the shop
- [ ] Watch the browser console on the live site for errors
- [ ] Check Shopify Web Performance after 48 hours of real traffic
