# Legal review checklist

> ## This document is not legal advice.
>
> Nothing in this repository has been reviewed by a lawyer. The theme provides **surfaces and
> data fields** for legal information; the content is the merchant's responsibility.
>
> **Before launch, have an Italian lawyer (*avvocato*) and an accountant (*commercialista*)
> review every item below.** Italian consumer and e-commerce law carries real penalties, and the
> cost of a review is a fraction of the cost of getting it wrong.

---

## What the theme provides vs what you must supply

| The theme provides | You must supply |
|---|---|
| Page templates for every required policy | The actual legal text, professionally reviewed |
| Configurable fields for all business identifiers | Correct, verified values |
| A GPSR product-safety surface, per product | Genuine manufacturer and safety data |
| A price-integrity field for the 30-day reference price | Real historical price data |
| A consent banner using Shopify's Customer Privacy API | A cookie policy that matches actual behaviour |
| `LocalBusiness` structured data, guarded on real values | Verified NAP details |

**The theme ships no legal text of any kind.** There is no boilerplate privacy policy to
accidentally launch with — deliberately, because generated legal text that looks finished is more
dangerous than an obviously empty page.

---

## 1. Business identification (D.Lgs. 70/2003)

Italian e-commerce must identify the trader. **Theme settings → Dati aziendali**, shown in the
footer and legal pages.

- [ ] Ragione sociale (legal business name)
- [ ] Full registered address
- [ ] Email address
- [ ] Telephone number
- [ ] **P.IVA** (VAT number)
- [ ] **REA** / Chamber of Commerce registration
- [ ] Share capital, if a company that must state it
- [ ] ODR platform link, if required

Any field left blank renders nothing. **Blank is safer than wrong — but blank is not compliant.**
These must all be filled before launch.

---

## 2. Consumer rights — distance selling (D.Lgs. 206/2005, Codice del Consumo)

- [ ] **14-day right of withdrawal** clearly explained, with when the period starts
- [ ] **Standard withdrawal form** provided (Annex I(B) of the Consumer Rights Directive)
- [ ] Who pays return shipping, stated explicitly
- [ ] The return address (**Theme settings → Indirizzo per i resi**)
- [ ] Refund timing and method
- [ ] Any lawful exceptions to withdrawal, stated accurately
- [ ] **2-year legal guarantee of conformity** (*garanzia legale di conformità*) explained — and
      clearly distinguished from any commercial warranty
- [ ] Pre-contractual information available before the order is placed

---

## 3. Price indication — the one most often got wrong

Italy implements the Price Indication Directive via **D.Lgs. 84/2022**. When you announce a price
reduction you must state the **lowest price applied in the previous 30 days**.

**How the theme handles this:**

| Data | Displayed |
|---|---|
| `compare_at_price` only | Struck-through previous price. **No percentage.** |
| `compare_at_price` + `custom.prior_price_30d` | Strikethrough, "Risparmi il X%", and the 30-day reference price shown explicitly |

`compare_at_price` is a Shopify merchandising field. It is **not** evidence of a compliant prior
price, and the theme deliberately refuses to compute a percentage from it alone.

- [ ] Confirm with your adviser how you will evidence the 30-day lowest price
- [ ] Populate `custom.prior_price_30d` from genuine price history for every discounted product
- [ ] Confirm whether your promotions fall within any exception (progressive reductions, goods
      subject to rapid deterioration)
- [ ] Confirm VAT-inclusive display and any shipping-cost disclosure requirements

---

## 4. Product safety — GPSR, Regulation (EU) 2023/988

In force since 13 December 2024 for products offered to EU consumers.

Per product, `snippets/product-safety.liquid` surfaces:

- [ ] Manufacturer name, address and electronic contact
- [ ] **EU responsible person** name, address and contact, where the manufacturer is outside the EU
- [ ] Product model / identifier
- [ ] Safety warnings and usage limitations, in **Italian**
- [ ] Battery and shipping notes (lithium batteries: power banks, wireless chargers)
- [ ] Disposal and recycling information (WEEE / RAEE)
- [ ] Manual and safety-document links

**The theme never draws a CE badge.** `custom.certification` is displayed as your own recorded
text. A compliance mark rendered from an unverified flag is a false declaration.

- [ ] Confirm which of your products are in scope
- [ ] Confirm the EU responsible person is appointed and stated for every imported product
- [ ] Confirm RAEE registration and any *contributo ambientale* display duty

---

## 5. Privacy, cookies and consent (GDPR + ePrivacy, Garante Privacy guidance)

The consent banner uses Shopify's Customer Privacy API. Before consent, no analytics, marketing
or preference cookie is set, and the store map is a **static image** until the customer acts.

Design decisions relevant to compliance:

- [ ] "Accetta tutti" and "Rifiuta non necessari" are the **same size, weight and prominence**
- [ ] Rejection is **one click**, not buried inside "Personalizza"
- [ ] Nothing is pre-ticked except strictly necessary
- [ ] Preferences can be reopened at any time (footer link)

Still to confirm with your adviser:

- [ ] Privacy policy naming every processor (Shopify, payment providers, any app installed)
- [ ] Cookie policy listing every cookie actually set, with purpose and duration — **audit the
      live site**, do not copy a template
- [ ] Lawful basis for each processing purpose
- [ ] Data Processing Agreements with Shopify and every app
- [ ] Retention periods
- [ ] Whether a *Registro dei trattamenti* is required
- [ ] Transfers outside the EEA
- [ ] `localStorage` use (wishlist, comparison, selected device) — assess whether it needs
      disclosure in the cookie policy. It is first-party and functional, but should be documented.

---

## 6. Accessibility (European Accessibility Act, D.Lgs. 82/2022)

The EAA applies to e-commerce from **28 June 2025**. The theme targets WCAG 2.2 AA and its
automated checks pass (see `docs/qa-report.md`), but automated testing covers only part of the
standard.

- [ ] Confirm whether your business is in scope (micro-enterprise exemptions may apply)
- [ ] Commission an **independent accessibility audit** including manual screen-reader testing
- [ ] Publish an accessibility statement (page slot exists in Theme settings)
- [ ] Establish a feedback route for accessibility problems

---

## 7. Required pages

Create each as a Shopify page, then link it in **Theme settings → Privacy e consenso**.

| Page | Status |
|---|---|
| Informativa privacy | ☐ drafted ☐ reviewed |
| Cookie policy | ☐ drafted ☐ reviewed |
| Termini e condizioni di vendita | ☐ drafted ☐ reviewed |
| Spedizioni | ☐ drafted ☐ reviewed |
| Resi e diritto di recesso | ☐ drafted ☐ reviewed |
| Modulo di recesso tipo | ☐ drafted ☐ reviewed |
| Garanzia legale | ☐ drafted ☐ reviewed |
| Note legali | ☐ drafted ☐ reviewed |
| Informazioni sui pagamenti | ☐ drafted ☐ reviewed |
| Sicurezza dei prodotti | ☐ drafted ☐ reviewed |
| Contatti | ☐ drafted ☐ reviewed |
| Dichiarazione di accessibilità | ☐ drafted ☐ reviewed |

**Do not machine-translate legal content and publish it unreviewed.**

---

## 8. Claims the theme structurally cannot make

Recorded here so a future change does not quietly reintroduce them. Each is prohibited under the
Unfair Commercial Practices Directive as amended by (EU) 2019/2161:

| Claim | Status |
|---|---|
| Countdown timers | Not implemented |
| "N people viewing" | Not implemented |
| Fabricated review counts or stars | Structurally impossible — stars require real data |
| Invented scarcity | Low stock requires a merchant setting **and** real inventory |
| Percentage off without a prior price | Structurally gated on `prior_price_30d` |
| "Ready for pickup today" from online stock | Structurally impossible — pickup time comes from Shopify |
| CE marks from a flag | Not implemented; certification is recorded text only |
| `AggregateRating` without reviews | Guarded |
| `LocalBusiness` without a verified address | Guarded |

---

## Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Avvocato (consumer & e-commerce) | | | |
| Commercialista (VAT, invoicing) | | | |
| Privacy adviser / DPO | | | |
| Accessibility auditor | | | |
| Merchant | | | |

**Do not launch with unchecked boxes above.**
