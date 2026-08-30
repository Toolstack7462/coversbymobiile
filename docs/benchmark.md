# Benchmark and originality record

## Basis of this document — read first

The reference sites named in the brief (Back Market, Cellularline, Mous, Native Union, Spigen,
Puro Italy) were used as **functional references for interaction patterns**. This document is
written from established, widely-observable category patterns in phone-accessory retail. It is
**not** a live audit report, and it should not be read as one: no page was scraped, no asset was
downloaded, and no proprietary material was accessed or reproduced.

**Nothing was copied.** No source code, layout, brand colour, logo, icon, photograph, text,
illustration, proprietary graphic, distinctive component shape or theme code from any reference
site exists in this repository. What is recorded below is *how an interaction works* — an
unprotectable functional idea — never its expression.

Before launch the design lead should validate this pattern list against the live sites, and
confirm the originality assessment at the end.

---

## Patterns adopted

### From the marketplace/catalogue pattern (Back Market as reference)

| Pattern | Why adopted | How ours differs |
|---|---|---|
| **Result count always visible** | A shopper scanning a category needs to know if they are choosing among 6 or 300. It reframes filtering from a chore into a tool. | Ours is a live region (`role="status"`) so screen-reader users hear the count change when filters apply — not a static number. |
| **Filters permanently visible on desktop** | Hiding filters behind a button measurably reduces filter use, and filtering is what makes a 400-SKU accessory catalogue navigable. | Left sidebar, sticky, no click-to-discover. Mobile gets a full-height drawer with a focus trap. |
| **Price hierarchy: current price dominant, prior price secondary** | Reduces the cognitive work of comparing a grid. | Ours goes further on integrity: a percentage saving renders **only** with a documented 30-day reference price. |
| **Dense but readable catalogue grid** | Accessory shopping is comparison shopping; more products per screen genuinely helps. | 2/3/4 columns with a hard rule that cards stay readable; 5 columns only above 1440px. |

**Rejected from this reference:** condition/grading language and refurbished-specific trust
signals. This merchant sells new accessories — borrowing that vocabulary would misdescribe the
product.

### From the compatibility-led pattern (Cellularline, Spigen as references)

| Pattern | Why adopted | How ours differs |
|---|---|---|
| **Brand → family → model finder** | Matches how a customer actually thinks: "I have a Samsung… Galaxy S… S25 Ultra." | Ours is server-rendered nested `<details>` with real links, so it works with **zero JavaScript**. Most implementations of this pattern are JS-dependent. |
| **Deep device taxonomy as a first-class navigation axis** | For accessories, "what phone do you have" is a more useful entry point than "what product type". | Ours is metaobject-driven, so brands and models are added in Shopify Admin with no code change. |
| **Model aliases in search** | Customers type `S24 Ultra`, `S 24 Ultra`, `iPhone15Pro`. | Normalisation strips all non-alphanumerics, and models carry an explicit `aliases` field. Unit-testable (`normalise()` / `matches()` are exported). |

**Rejected:** exhaustive model dropdowns that list every device ever made, including models with
no stock. We render only `active` models, and `docs/technical-seo` forbids generating device
landing pages that have no compatible products.

### From the premium protection pattern (Mous, Native Union as references)

| Pattern | Why adopted | How ours differs |
|---|---|---|
| **Explain the protection, do not just assert it** | Technical credibility is what justifies a premium price against a €5 marketplace case. | Category-aware spec tables driven by metafields, with rows omitted entirely when unset — never "N/A". |
| **Guided "for my device / I need a product" entry** | Two shopper types, two doors. | Both doors are equal citizens: the device finder sits at homepage position 2, directly under a deliberately compact hero. |
| **Restrained editorial presentation** | Signals quality without decoration. | Hairline borders instead of shadows, non-uniform radii, one accent colour used for exactly one purpose. |

**Rejected:** large full-viewport lifestyle heroes. They push the catalogue below the fold and
cost conversions on mobile. Our hero is sized by its content.

### From Italian-market category language (Puro Italy as reference)

| Pattern | Why adopted | How ours differs |
|---|---|---|
| **Italian category nouns customers actually type** | *cover*, *vetro*/*pellicola*, *caricatore*, *cavo*, *power bank*, *supporto auto*, *auricolari* — not literal translations of English category names. | Encoded in `locales/it.default.json` and the navigation IA. Italian is the default locale, not a translation layer over English. |
| **MagSafe/magnetic as its own grouping** | It is how Italian customers shop this segment. | Modelled as `custom.magsafe_compatible` + a category, so it works as both a filter and a landing page. |
| **Colour-led merchandising for cases** | Colour is a genuine primary choice for cases. | Swatches carry text alternatives; colour is never the only cue. |

---

## Patterns explicitly rejected

| Pattern | Why rejected |
|---|---|
| Countdown timers on offers | A fabricated deadline is an unfair commercial practice (Dir. 2005/29/EC as amended by (EU) 2019/2161). Not implemented, and not implementable in this theme. |
| "N people are viewing this" | Fabricated social proof. Same legal exposure, plus it insults the customer. |
| Placeholder testimonials / star ratings | `snippets/rating.liquid` renders **nothing** without real review data. `sections/reviews.liquid` renders nothing without a real reviews app block. |
| Percentage-off badges derived from `compare_at_price` alone | `compare_at_price` is a merchandising field, not proof of a prior price under the Price Indication Directive (D.Lgs. 84/2022 in Italy). A percentage requires `custom.prior_price_30d`. |
| Newsletter modal on entry | Obstructs the first product view; consent obtained by obstruction is weak consent. Ours is a section. |
| Infinite scroll | Strands keyboard users before the footer and makes results impossible to return to. We use real pagination with an optional load-more that pushes history state. |
| Auto-playing hero video | Costs bandwidth and LCP, and is hostile on mobile data. |
| Icon-only "hamburger + magnifier" mobile header | Search is the primary discovery tool here; it gets a full-width field, not an icon. |
| Carousel-first homepage | Content below the first slide is rarely seen and carousels are an accessibility liability. |

---

## How the result stays original

Adopting a functional pattern is not copying an expression. Concretely, the visual and structural
system here was derived independently:

1. **Palette** — cobalt/porcelain/navy/volt-lime, specified by the client brief, not sampled from
   any reference. The 70/20/8/2 distribution and the rule that lime appears *only* in device
   context is a constraint invented for this project.
2. **The device-context signature** — an asymmetric notched surface
   (`border-radius: 12px 12px 12px 2px`) with a 3px lime inline-start edge, applied to anything
   tagged to the customer's phone. This is our own device, used consistently across the header
   strip, compatibility panel, mobile menu and finder.
3. **Deliberately non-uniform radii** — 10px controls, 12–14px cards, 18px editorial, pill chips.
   Most templates round everything identically; the mix is a deliberate signature.
4. **Borders over shadows** — cards are carried by a 1px hairline. Shadows are reserved for
   things that genuinely float (drawer, menu, dialog).
5. **Typography** — Manrope 800 display at −0.03em tracking over Inter body, with a fixed scale
   from the brief. Independent of any reference site's type system.
6. **Compatibility as a five-state system** with an explicit MISMATCH state that warns without
   blocking. No reference site was consulted for this logic; it derives from the data model in
   `docs/device-compatibility-model.md`.
7. **All imagery is merchant-supplied.** The theme ships no photography and no brand logos. Brand
   logos are uploaded by the merchant precisely because manufacturer trade dress cannot be
   bundled with a theme.

## Attribution

The only third-party code in the repository is Shopify's Skeleton starter (see
`docs/repository-audit.md` for its licence, which is not MIT) and two OFL-1.1 typefaces with
their licences retained at `docs/font-licenses/`.
