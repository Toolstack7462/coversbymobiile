#!/usr/bin/env node
/**
 * Builds a LOCAL VISUAL PREVIEW of the theme at tests/preview/.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * WHAT THIS IS      The theme's real CSS (tokens + critical.css + every scoped stylesheet), the
 *                   real self-hosted fonts, the real icon set, the real Italian locale strings,
 *                   and the real JavaScript modules — device-context.js, device-finder.js,
 *                   wishlist.js, compare.js — running against fixture data over HTTP.
 *
 *                   So the device finder genuinely works: pick a phone and every compatibility
 *                   badge on the page re-resolves live, exactly as it would on the storefront.
 *
 * WHAT THIS IS NOT  A Shopify storefront. There is no Liquid rendering, no cart, no search, no
 *                   filters, no pickup, no checkout — those need an authenticated store and are
 *                   covered by the merchant script in docs/launch-checklist.md.
 *
 *                   Product names, prices and devices below are FIXTURES for layout evaluation.
 *                   They are not merchant data and must not be mistaken for catalogue content.
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 */

import { writeFileSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compileCss, locale, icon, root, RTL } from './lib/compile-css.mjs';

const out = join(root, 'tests', 'preview');
mkdirSync(join(out, 'assets'), { recursive: true });

let LANG = 'it';
let t = locale();

/* Only languages that exist as real locale files. Listing more would be an empty claim. */
const LANGUAGES = [
  ['Italiano', 'it', 'index'],
  ['English', 'en', 'index'],
  ['Română', 'ro', 'index'],
  ['العربية', 'ar', 'index-ar'],
];

/* ── Real assets ──────────────────────────────────────────────────────── */

writeFileSync(join(out, 'theme.css'), compileCss({ fonts: true }));
for (const f of ['inter-latin.woff2', 'manrope-latin.woff2']) {
  copyFileSync(join(root, 'assets', f), join(out, 'assets', f));
}
// The real modules, served as-is.
for (const f of ['a11y.js', 'device-context.js', 'device-finder.js', 'wishlist.js', 'compare.js']) {
  copyFileSync(join(root, 'assets', f), join(out, 'assets', f));
}

/* ── Fixtures ─────────────────────────────────────────────────────────── */

const DEVICES = [
  { brand: 'Apple', family: 'iPhone Pro', handle: 'iphone-16-pro', name: 'iPhone 16 Pro' },
  { brand: 'Apple', family: 'iPhone Pro', handle: 'iphone-16-pro-max', name: 'iPhone 16 Pro Max' },
  { brand: 'Apple', family: 'iPhone', handle: 'iphone-16', name: 'iPhone 16' },
  { brand: 'Samsung', family: 'Galaxy S', handle: 'galaxy-s25-ultra', name: 'Galaxy S25 Ultra' },
  { brand: 'Samsung', family: 'Galaxy S', handle: 'galaxy-s25', name: 'Galaxy S25' },
  { brand: 'Google Pixel', family: 'Pixel Pro', handle: 'pixel-9-pro-xl', name: 'Pixel 9 Pro XL' },
  { brand: 'Nothing', family: 'Phone', handle: 'nothing-phone-3', name: 'Nothing Phone (3)' },
];

const PRODUCTS = [
  {
    title: 'Cover trasparente antiurto con bordi rinforzati',
    vendor: 'Covers by Mobile',
    price: '24,90 €',
    compare: '34,90 €',
    level: 'exact_fit',
    devices: 'iphone-16-pro,iphone-16-pro-max',
    badge: 'sale',
    category: 'case',
  },
  {
    title: 'Caricatore da parete GaN 65W a tre porte USB-C',
    vendor: 'Covers by Mobile',
    price: '49,90 €',
    level: 'universal',
    devices: '',
    badge: 'new',
    category: 'charger',
  },
  {
    title: 'Vetro temperato con kit di applicazione guidata',
    vendor: 'Covers by Mobile',
    price: '14,90 €',
    level: 'exact_fit',
    devices: 'galaxy-s25-ultra,galaxy-s25',
    category: 'screen_protector',
  },
  {
    title: 'Power bank magnetico 10.000 mAh certificato Qi2',
    vendor: 'Covers by Mobile',
    price: '59,90 €',
    level: 'compatible',
    devices: 'iphone-16-pro,iphone-16-pro-max,iphone-16',
    category: 'powerbank',
  },
  {
    title: 'Cavo USB-C / USB-C intrecciato 2 m, 240W',
    vendor: 'Covers by Mobile',
    price: '19,90 €',
    level: 'universal',
    devices: '',
    category: 'cable',
  },
  {
    title: 'Supporto auto magnetico per bocchette',
    vendor: 'Covers by Mobile',
    price: '29,90 €',
    level: 'universal',
    devices: '',
    category: 'car_mount',
  },
  {
    title: 'Cover in silicone con MagSafe per Galaxy S25 Ultra',
    vendor: 'Covers by Mobile',
    price: '27,90 €',
    level: 'exact_fit',
    devices: 'galaxy-s25-ultra',
    category: 'case',
  },
  {
    title: 'Adattatore da USB-C a jack 3,5 mm',
    vendor: 'Covers by Mobile',
    price: '12,90 €',
    level: 'adapter_required',
    devices: 'iphone-16,iphone-16-pro',
    category: 'cable',
  },
];

const CATEGORIES = [
  'Cover',
  'Vetri e protezione',
  'Caricatori',
  'Cavi',
  'Power Bank',
  'MagSafe e magnetici',
  'Auricolari',
  'Supporti Auto',
  'Smartwatch',
  'Offerte',
];

/* ── Markup helpers (mirror the Liquid snippets) ──────────────────────── */

const RUNTIME_ICONS = [
  'shield-check',
  'check-circle',
  'info',
  'alert-circle',
  'alert-triangle',
  'device',
  'heart',
  'heart-filled',
];

const iconTemplates = RUNTIME_ICONS.map(
  (n) => `<template id="ita-icon-${n}">${icon(n)}</template>`
).join('\n');

/** Placeholder media. The theme ships no photography; merchant images go here. */
const media = (label, ratio = '1') => `
  <div class="media media--empty" style="aspect-ratio:${ratio}">
    ${icon('package', 'icon icon--xl')}
    <span class="visually-hidden">${label}</span>
  </div>`;

const compat = (p, variant = 'inline') => {
  const hasData = p.level !== 'unknown' || p.devices;
  if (!hasData) return '';
  const universal = p.level === 'universal';
  const text = universal
    ? variant === 'panel'
      ? t.compatibility.universal
      : t.compatibility.universal_short
    : t.compatibility.select_device_prompt;
  return `
  <compat-badge class="compat compat--${variant}" data-level="${p.level}" data-devices="${p.devices}">
    <span class="compat__state compat__state--${universal ? 'universal' : 'prompt'}" data-compat-state${
      !universal && variant !== 'panel' ? ' hidden' : ''
    }>
      ${icon(universal ? 'info' : 'device')}
      <span data-compat-text>${text}</span>
    </span>
    ${variant === 'panel' ? `<a class="compat__action" href="#" data-compat-action hidden>${t.compatibility.mismatch_action}</a>` : ''}
  </compat-badge>`;
};

const card = (p, lcp = false) => `
<div class="card" data-product-handle="${p.category}-${p.price}">
  <div class="card__media">
    <a class="card__media-link" href="./product.html" tabindex="-1" aria-hidden="true">${media(p.title)}</a>
    <div class="card__media-overlay">${
      p.badge
        ? `<ul class="badges" role="list"><li class="badge badge--${p.badge}">${p.badge === 'sale' ? t.products.on_sale : t.products.new}</li></ul>`
        : ''
    }</div>
    <wishlist-button class="card__wishlist" data-product-id="${Math.floor(Math.random() * 1e6)}" data-product-handle="${p.category}-${p.price}" data-product-title="${p.title}">
      <button class="icon-button" type="button" aria-pressed="false" data-wishlist-toggle>
        ${icon('heart')}<span class="visually-hidden" data-wishlist-label>${t.products.add_to_wishlist}</span>
      </button>
    </wishlist-button>
  </div>
  <div class="card__body">
    <p class="card__vendor text-caption text-secondary">${p.vendor}</p>
    <h3 class="card__title text-ui"><a class="card__link" href="./product.html">${p.title}</a></h3>
    ${compat(p)}
    <div class="price${p.compare ? ' price--on-sale' : ''}">
      <div class="price__row">
        <span class="price__current tabular">${p.price}</span>
        ${p.compare ? `<s class="price__compare tabular">${p.compare}</s>` : ''}
      </div>
    </div>
    <p class="stock stock--compact stock--in_stock">${icon('check-circle', 'icon icon--sm')}${t.inventory.in_stock}</p>
    <a class="button button--secondary button--small button--full" href="./product.html">${t.products.select_options}</a>
    <compare-button class="card__compare" data-product-handle="${p.category}-${p.price}" data-product-title="${p.title}" data-product-category="${p.category}">
      <button class="card__compare-toggle text-caption" type="button" aria-pressed="false" data-compare-toggle>
        ${icon('compare', 'icon icon--sm')}${t.products.add_to_compare}
      </button>
    </compare-button>
  </div>
</div>`;

const deviceTree = () => {
  const brands = [...new Set(DEVICES.map((d) => d.brand))];
  return brands
    .map((brand) => {
      const families = [...new Set(DEVICES.filter((d) => d.brand === brand).map((d) => d.family))];
      return `
      <details class="finder__brand">
        <summary class="finder__brand-summary">
          <span class="finder__brand-name text-ui">${brand}</span>
          ${icon('chevron-down', 'icon icon--sm')}
        </summary>
        <div class="finder__families">
          ${families
            .map(
              (family) => `
            <div class="finder__family">
              <p class="finder__family-name eyebrow">${family}</p>
              <ul class="finder__model-list" role="list">
                ${DEVICES.filter((d) => d.brand === brand && d.family === family)
                  .map(
                    (d) => `<li><a class="finder__model" href="./collection.html"
                      data-model-handle="${d.handle}" data-model-name="${d.name}"
                      data-model-brand="${d.brand}" data-model-aliases="">${d.name}</a></li>`
                  )
                  .join('')}
              </ul>
            </div>`
            )
            .join('')}
        </div>
      </details>`;
    })
    .join('');
};

const header = (current) => `
<div class="utility-bar">
  <div class="utility-bar__inner page">
    <ul class="utility-bar__claims" role="list">
      <li class="utility-bar__claim">${icon('truck', 'icon icon--sm')}<span>Spedizione in tutta Italia</span></li>
      <li class="utility-bar__claim">${icon('store', 'icon icon--sm')}<span>Ritiro in negozio</span></li>
      <li class="utility-bar__claim">${icon('shield-check', 'icon icon--sm')}<span>Pagamenti sicuri</span></li>
    </ul>
    <div class="utility-bar__actions">
      <a class="utility-bar__action" href="#">${icon('whatsapp', 'icon icon--sm')}WhatsApp</a>
      <a class="utility-bar__action" href="./store.html">${icon('store', 'icon icon--sm')}${t.header.store}</a>
    </div>
  </div>
</div>

<header class="header header--sticky">
  <div class="header__inner page">
    <button class="header__menu-toggle icon-button" type="button" aria-expanded="false">
      ${icon('menu', 'icon icon--lg')}<span class="visually-hidden">${t.general.accessibility.open_menu}</span>
    </button>
    <a class="header__logo" href="./index.html"><span class="header__wordmark text-h3">Covers by Mobile</span></a>

    <div class="header__search header__search--desktop">
      <div class="search-bar">
        <form class="search-bar__form" role="search" onsubmit="return false">
          <label class="visually-hidden" for="s1">${t.search.label}</label>
          <div class="search-bar__field">
            ${icon('search', 'icon search-bar__icon')}
            <input class="search-bar__input" id="s1" type="search" placeholder="${t.search.placeholder}">
            <button class="search-bar__submit" type="submit">
              <span class="visually-hidden">${t.search.submit}</span>${icon('arrow-right', 'icon icon--sm')}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="header__actions">
      <a class="header__action header__action--device" href="./index.html#finder">
        ${icon('device')}<span class="header__action-label">${t.header.find_device}</span>
      </a>
      <a class="header__action" href="#">${icon('account')}<span class="header__action-label">${t.header.account}</span></a>
      <a class="header__action" href="#">
        ${icon('heart')}<span class="header__action-label">${t.header.wishlist}</span>
        <span class="header__count" data-wishlist-count hidden></span>
      </a>
      <a class="header__action header__action--cart" href="#">
        ${icon('cart')}<span class="header__action-label">${t.header.cart}</span>
        <span class="header__count" data-cart-count>2</span>
      </a>
    </div>
  </div>

  <div class="header__search header__search--mobile page">
    <div class="search-bar">
      <form class="search-bar__form" role="search" onsubmit="return false">
        <label class="visually-hidden" for="s2">${t.search.label}</label>
        <div class="search-bar__field">
          ${icon('search', 'icon search-bar__icon')}
          <input class="search-bar__input" id="s2" type="search" placeholder="${t.search.placeholder}">
          <button class="search-bar__submit" type="submit">
            <span class="visually-hidden">${t.search.submit}</span>${icon('arrow-right', 'icon icon--sm')}
          </button>
        </div>
      </form>
    </div>
  </div>

  <device-chip class="device-strip page">
    <div class="device-strip__inner surface--device" data-device-active>
      ${icon('device', 'icon icon--sm')}
      <span class="device-strip__label text-ui">${t.device.my_device}: <strong data-device-name></strong></span>
      <a class="device-strip__change text-ui" href="./index.html#finder">${t.device.change_device}</a>
      <button class="device-strip__remove icon-button" type="button" data-device-remove>
        ${icon('close', 'icon icon--sm')}<span class="visually-hidden">${t.device.remove_device}</span>
      </button>
    </div>
  </device-chip>

  <nav class="header__nav" aria-label="${t.header.main_navigation}">
    <ul class="header__nav-list page" role="list">
      ${CATEGORIES.slice(0, 8)
        .map(
          (c) =>
            `<li class="header__nav-item"><a class="header__nav-link" href="./collection.html">${c}</a></li>`
        )
        .join('')}
    </ul>
  </nav>
</header>`;

const footer = () => `
<footer class="footer">
  <div class="footer__main page">
    <div class="footer__brand">
      <a class="footer__logo" href="./index.html"><span class="text-h3">Covers by Mobile</span></a>
      <address class="footer__address text-ui">
        <strong>Covers by Mobile</strong><br>
        Viale della Repubblica 8a, Centro Il Nuovo Borgo, negozio 6<br>
        67039 Sulmona (AQ)<br>Italia
      </address>
      <ul class="footer__contact text-ui" role="list">
        <li><a href="tel:+393508816173">${icon('phone', 'icon icon--sm')}+39 350 881 6173</a></li>
        <li><a href="https://wa.me/393508816173" target="_blank" rel="noopener">${icon('whatsapp', 'icon icon--sm')}WhatsApp</a></li>
        <li><a href="https://www.google.com/maps/dir/?api=1&destination=42.0614846%2C13.9200965" target="_blank" rel="noopener">${icon('map-pin', 'icon icon--sm')}Indicazioni stradali</a></li>
      </ul>
    </div>
    ${['Acquista', 'Assistenza', 'Informazioni legali']
      .map(
        (h, i) => `
      <nav class="footer__column">
        <h2 class="footer__heading text-ui">${h}</h2>
        <ul class="footer__list" role="list">
          ${(i === 0
            ? CATEGORIES.slice(0, 5)
            : ['Contatti', 'Spedizioni', 'Resi e recesso', 'Garanzia legale']
          )
            .map((l) => `<li><a class="footer__link text-ui" href="#">${l}</a></li>`)
            .join('')}
        </ul>
      </nav>`
      )
      .join('')}
    <div class="footer__column footer__column--newsletter">
      <h2 class="footer__heading text-ui">${t.newsletter.title}</h2>
      <p class="text-ui text-secondary">${t.newsletter.body}</p>
      <form class="footer__newsletter" onsubmit="return false">
        <label class="visually-hidden" for="nl">${t.newsletter.email_label}</label>
        <div class="footer__newsletter-row">
          <input class="input" id="nl" type="email" placeholder="${t.newsletter.email_placeholder}">
          <button class="button button--primary" type="submit">${t.newsletter.submit}</button>
        </div>
      </form>
    </div>
  </div>
  <div class="footer__legal">
    <div class="footer__legal-inner page">
      <p class="text-caption">© 2026 Covers by Mobile — [Ragione sociale da configurare]</p>
      <p class="text-caption footer__legal-ids"><span>P.IVA [da configurare]</span></p>
      <div class="localization localization--footer">
        <form class="localization__form" onsubmit="return false">
          <details class="localization__group">
            <summary class="localization__toggle">
              ${icon('globe', 'icon icon--sm')}
              <span class="localization__current text-ui">${LANGUAGES.find(([, c]) => c === LANG)[0]}</span>
              ${icon('chevron-down', 'icon icon--sm localization__chevron')}
            </summary>
            <div class="localization__panel">
              <p class="localization__heading eyebrow">${t.localization.language_label}</p>
              <ul class="localization__list" role="list">
                ${LANGUAGES
                  .map(
                    ([label, code, target]) => {
                      const cur = code === LANG;
                      return `<li><a class="localization__option text-ui${cur ? ' is-current' : ''}" href="./${target}.html" lang="${code}"${cur ? ' aria-current="true"' : ''}>
                        <span>${label}</span>${cur ? icon('check', 'icon icon--sm') : ''}
                      </a></li>`;
                    }
                  )
                  .join('')}
              </ul>
            </div>
          </details>

          <details class="localization__group">
            <summary class="localization__toggle">
              ${icon('map-pin', 'icon icon--sm')}
              <span class="localization__current text-ui">Italia (EUR)</span>
              ${icon('chevron-down', 'icon icon--sm localization__chevron')}
            </summary>
            <div class="localization__panel">
              <p class="localization__heading eyebrow">${t.localization.country_label}</p>
              <ul class="localization__list" role="list">
                ${[
                  ['Italia', 'EUR', '€', true],
                  ['Deutschland', 'EUR', '€', false],
                  ['United Kingdom', 'GBP', '£', false],
                  ['Schweiz', 'CHF', 'CHF', false],
                ]
                  .map(
                    ([n, c, sym, cur]) =>
                      `<li><button class="localization__option text-ui${cur ? ' is-current' : ''}" type="submit"${cur ? ' aria-current="true"' : ''}>
                        <span>${n}</span><span class="localization__currency text-caption tabular">${c} ${sym}</span>
                      </button></li>`
                  )
                  .join('')}
              </ul>
            </div>
          </details>
        </form>
      </div>
      <button class="footer__consent text-caption" type="button">${icon('settings', 'icon icon--sm')}${t.consent.reopen}</button>
    </div>
  </div>
</footer>`;

const previewBar = (current) => {
  const pages = [
    ['index.html', 'Home'],
    ['collection.html', 'Collezione'],
    ['product.html', 'Prodotto'],
    ['store.html', 'Negozio'],
    ['components.html', 'Componenti'],
  ];
  return `
<div class="preview-bar">
  <strong>ANTEPRIMA LOCALE</strong>
  <span>CSS + JS reali · dati di esempio · nessuno storefront Shopify</span>
  <nav>${pages
    .map(
      ([href, label]) =>
        `<a href="./${href}"${href === current ? ' aria-current="page"' : ''}>${label}</a>`
    )
    .join('')}</nav>
</div>`;
};

const page = (title, current, body, extraHead = '') => `<!doctype html>
<html lang="${LANG}" dir="${RTL.includes(LANG) ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title} — Anteprima Italian Tech Atelier</title>
<script>
  // Pre-paint device flag: the same technique layout/theme.liquid uses so the device strip and
  // the compatibility line occupy their correct boxes in frame one instead of shifting later.
  try { if (localStorage.getItem('ita.device')) document.documentElement.setAttribute('data-has-device',''); } catch (e) {}
</script>
<link rel="stylesheet" href="./theme.css">
<style>
  .preview-bar{position:sticky;top:0;z-index:500;display:flex;flex-wrap:wrap;align-items:center;
    gap:var(--space-3);padding:var(--space-2) var(--space-4);background:#111;color:#fff;
    font:500 12px/1.4 var(--font-body)}
  .preview-bar span{color:rgb(255 255 255/.6)}
  .preview-bar nav{display:flex;gap:var(--space-1);margin-inline-start:auto;flex-wrap:wrap}
  .preview-bar a{color:#fff;text-decoration:none;padding:4px 10px;border-radius:999px;
    border:1px solid rgb(255 255 255/.25)}
  .preview-bar a[aria-current]{background:var(--color-accent);color:#0B1220;border-color:transparent}
</style>
${extraHead}
</head>
<body class="template-${current.replace('.html', '')}">
<a class="skip-link" href="#main-content">${t.general.accessibility.skip_to_content}</a>
<div id="ita-live-region" class="visually-hidden" role="status" aria-live="polite"></div>
${previewBar(current)}
${header(current)}
<main id="main-content" tabindex="-1">
${body}
</main>
${footer()}
${iconTemplates}
<script>
  window.ITA = {
    routes: { root: '/', cart: '#', cartAdd: '#', cartChange: '#', search: '#', predictive: '#' },
    shop: { moneyFormat: '{{amount}} €', currency: 'EUR', locale: 'it' },
    strings: ${JSON.stringify({
      compat: {
        exact: t.compatibility.exact,
        exact_short: t.compatibility.exact_short,
        compatible: t.compatibility.compatible,
        universal: t.compatibility.universal,
        universal_short: t.compatibility.universal_short,
        adapter: t.compatibility.adapter,
        mismatch: t.compatibility.mismatch,
        select_device_prompt: t.compatibility.select_device_prompt,
      },
      device: {
        removed: t.device.device_removed,
        selected: t.device.device_selected,
        noModels: t.device.no_models_title,
      },
      products: {
        addToWishlist: t.products.add_to_wishlist,
        removeFromWishlist: t.products.remove_from_wishlist,
      },
      wishlist: { added: t.wishlist.added, removed: t.wishlist.removed },
      compare: {
        limitReached: t.compare.limit_reached,
        differentCategory: t.compare.different_category,
      },
      general: { error: t.general.states.generic_error },
    })}
  };
</script>
<script type="module" src="./assets/device-context.js"></script>
<script type="module" src="./assets/device-finder.js"></script>
<script type="module" src="./assets/wishlist.js"></script>
<script type="module" src="./assets/compare.js"></script>
</body>
</html>`;

/* ── Pages ────────────────────────────────────────────────────────────── */

const homeBody = () => `
<section class="hero">
  <div class="hero__inner page">
    <div class="hero__content">
      <p class="eyebrow">Accessori per smartphone</p>
      <h1 class="hero__heading text-display">Accessori per il tuo smartphone.<br>Online e nel nostro negozio.</h1>
      <p class="hero__body text-body">Cover, vetri, caricatori, cavi, power bank e molto altro.</p>
      <div class="hero__actions">
        <a class="button button--primary" href="./collection.html">${t.general.actions.shop_now}</a>
        <a class="button button--secondary" href="#finder">${t.header.find_device}</a>
        <a class="hero__store text-ui" href="./store.html">${icon('store', 'icon icon--sm')}Visita il negozio</a>
      </div>
    </div>
    <div class="hero__media">${media('Immagine hero — fornita dal negozio', '4/3')}</div>
  </div>
</section>

<section class="finder finder--compact" id="finder">
  <div class="finder__inner page">
    <header class="finder__header">
      <p class="eyebrow">Compatibilità garantita</p>
      <h2 class="finder__title text-h2">${t.device.finder_title}</h2>
      <p class="finder__subtitle text-body text-secondary">${t.device.finder_subtitle}</p>
    </header>
    <device-finder class="finder__body" data-finder>
      <div class="finder__current surface--device" data-finder-current hidden>
        ${icon('check-circle', 'icon icon--sm')}
        <span class="text-ui">${t.device.my_device}: <strong data-finder-current-name></strong></span>
        <button class="finder__clear" type="button" data-finder-clear>${t.device.remove_device}</button>
      </div>
      <div class="finder__search">
        <label class="visually-hidden" for="finder-search">${t.device.search_model_label}</label>
        <div class="finder__search-field">
          ${icon('search', 'icon finder__search-icon')}
          <input class="input finder__input" id="finder-search" type="search"
                 placeholder="${t.device.search_model_placeholder}" autocomplete="off" data-finder-search>
        </div>
      </div>
      <div class="finder__results" data-finder-results hidden>
        <p class="eyebrow">${t.device.all_models}</p>
        <ul class="finder__model-list" role="list" data-finder-result-list></ul>
        <p class="finder__no-results text-ui text-secondary" data-finder-empty hidden>
          ${t.device.no_models_title} — ${t.device.no_models_body}
        </p>
      </div>
      <div class="finder__recent" data-finder-recent hidden>
        <p class="eyebrow">${t.device.recent_models}</p>
        <ul class="finder__chips" role="list" data-finder-recent-list></ul>
      </div>
      <div class="finder__tree" data-finder-tree>${deviceTree()}</div>
      <a class="finder__all text-ui" href="./collection.html">${t.device.show_all_products}${icon('arrow-right', 'icon icon--sm')}</a>
    </device-finder>
  </div>
</section>

<section class="section">
  <div class="page">
    <header class="section-head"><div><h2 class="text-h2">Categorie popolari</h2></div></header>
    <ul class="cats" role="list" style="--cats-columns:5">
      ${CATEGORIES.map(
        (c) => `<li><a class="cat" href="./collection.html">
          <div class="cat__media">${media(c)}</div>
          <span class="cat__title text-ui">${c}</span></a></li>`
      ).join('')}
    </ul>
  </div>
</section>

<section class="section">
  <div class="page">
    <header class="section-head">
      <div><h2 class="text-h2">I più venduti</h2></div>
      <a class="section-head__link text-ui" href="./collection.html">${t.general.actions.see_all}${icon('arrow-right', 'icon icon--sm')}</a>
    </header>
    <ul class="grid grid--products" role="list">
      ${PRODUCTS.slice(0, 4)
        .map((p, i) => `<li>${card(p, i === 0)}</li>`)
        .join('')}
    </ul>
  </div>
</section>

<section class="section storepick">
  <div class="page">
    <div class="storepick__layout">
      <div class="storepick__content">
        <p class="eyebrow">Il nostro negozio</p>
        <h2 class="text-h2">${t.store.title}</h2>
        <address class="storepick__address text-body">
          <strong>Covers by Mobile</strong><br>
          Viale della Repubblica 8a, Centro Il Nuovo Borgo, negozio 6<br>
          67039 Sulmona (AQ)
        </address>
        <ul class="storepick__features" role="list">
          <li>${icon('package', 'icon icon--sm')}<span class="text-ui">${t.pickup.title}</span></li>
        </ul>
        <div class="storepick__actions">
          <a class="button button--primary" href="./store.html">Scopri il negozio</a>
          <a class="button button--secondary" href="#">${icon('map-pin', 'icon icon--sm')}${t.store.directions}</a>
        </div>
      </div>
      <div class="storepick__media">${media('Foto del negozio', '4/3')}</div>
    </div>
  </div>
</section>

<section class="section">
  <div class="page">
    <header class="section-head"><div><h2 class="text-h2">Perché sceglierci</h2></div></header>
    <ul class="reasons" role="list">
      ${[
        [
          'device',
          'Compatibilità verificata',
          'Ogni accessorio è collegato ai modelli con cui funziona davvero.',
        ],
        ['store', 'Negozio fisico a Sulmona', 'Ritira il tuo ordine e provalo di persona.'],
        ['shield-check', 'Garanzia legale 2 anni', 'Come previsto dal Codice del Consumo.'],
        ['whatsapp', 'Assistenza diretta', 'Scrivici se hai dubbi sulla compatibilità.'],
      ]
        .map(
          ([ic, h, b]) => `<li class="reason">
            <span class="reason__icon">${icon(ic, 'icon icon--lg')}</span>
            <h3 class="reason__title text-ui">${h}</h3>
            <p class="reason__body text-ui text-secondary">${b}</p></li>`
        )
        .join('')}
    </ul>
  </div>
</section>`;

writeFileSync(join(out, 'index.html'), page('Home', 'index.html', homeBody()));

writeFileSync(
  join(out, 'collection.html'),
  page(
    'Collezione',
    'collection.html',
    `
<div class="collection page">
  <nav class="breadcrumbs" aria-label="${t.general.accessibility.breadcrumb}">
    <ol class="breadcrumbs__list" role="list">
      <li class="breadcrumbs__item"><a class="breadcrumbs__link" href="./index.html">Home</a>${icon('chevron-right', 'breadcrumbs__sep icon icon--sm')}</li>
      <li class="breadcrumbs__item"><span class="breadcrumbs__current" aria-current="page">Cover</span></li>
    </ol>
  </nav>

  <header class="collection__header">
    <h1 class="collection__title text-h1">Cover</h1>
    <div class="collection__description text-body text-measure">
      Cover trasparenti, in silicone e rinforzate. Filtra per il tuo modello per vedere solo ciò che calza davvero.
    </div>
  </header>

  <div class="collection__layout">
    <aside class="collection__sidebar" id="collection-filters">
      <h2 class="visually-hidden">${t.facets.title}</h2>
      <div class="facets facets--sidebar">
        <form class="facets__form" onsubmit="return false">
          <div class="facets__active">
            <div class="facets__active-head">
              <span class="eyebrow">${t.facets.active_filters}</span>
              <a class="facets__clear-all text-ui" href="#">${t.facets.clear_all}</a>
            </div>
            <ul class="facets__chips" role="list">
              <li><a class="chip" href="#"><span>Trasparente</span>${icon('close', 'icon icon--sm')}</a></li>
              <li><a class="chip" href="#"><span>MagSafe</span>${icon('close', 'icon icon--sm')}</a></li>
            </ul>
          </div>
          ${[
            [
              'Disponibilità',
              [
                ['Disponibile', 24],
                ['Esaurito', 3],
              ],
            ],
            [
              'Colore',
              [
                ['Trasparente', 12],
                ['Blu notte', 7],
                ['Nero', 9],
              ],
            ],
            [
              'Materiale',
              [
                ['Silicone', 11],
                ['TPU', 8],
                ['Pelle', 4],
              ],
            ],
            [
              'Compatibilità magnetica',
              [
                ['Sì', 15],
                ['No', 9],
              ],
            ],
          ]
            .map(
              ([label, values], i) => `
            <details class="facet"${i < 3 ? ' open' : ''}>
              <summary class="facet__summary">
                <span class="facet__label text-ui">${label}</span>
                ${icon('chevron-down', 'facet__chevron icon icon--sm')}
              </summary>
              <div class="facet__body"><fieldset class="facet__fieldset">
                <legend class="visually-hidden">${label}</legend>
                <ul class="facet__values" role="list">
                  ${values
                    .map(
                      ([v, n]) => `<li><label class="facet__option">
                        <input type="checkbox"><span class="facet__option-label text-ui">${v}</span>
                        <span class="facet__option-count text-caption text-secondary tabular">${n}</span>
                      </label></li>`
                    )
                    .join('')}
                </ul>
              </fieldset></div>
            </details>`
            )
            .join('')}
          <button class="button button--primary button--full facets__submit" type="submit">${t.facets.apply}</button>
        </form>
      </div>
    </aside>

    <div class="collection__main">
      <div class="collection__toolbar">
        <p class="collection__count text-ui">${PRODUCTS.length} prodotti</p>
        <div class="collection__toolbar-actions">
          <button class="button button--secondary button--small collection__filter-toggle" type="button" aria-expanded="false">
            ${icon('filter', 'icon icon--sm')}${t.facets.open}
          </button>
          <div class="sort">
            <label class="sort__label text-ui" for="sort-by">${t.facets.sort_label}</label>
            <select class="select sort__select" id="sort-by">
              <option>${t.sorting.featured}</option><option>${t.sorting.best_selling}</option>
              <option>${t.sorting.newest}</option><option>${t.sorting.price_ascending}</option>
            </select>
          </div>
        </div>
      </div>
      <div class="collection__results">
        <ul class="grid grid--products" role="list">
          ${PRODUCTS.map((p, i) => `<li>${card(p, i === 0)}</li>`).join('')}
        </ul>
        <nav class="pagination" aria-label="${t.general.accessibility.pagination}">
          <button class="button button--secondary pagination__more" type="button">${t.collections.load_more}</button>
          <ol class="pagination__list" role="list">
            <li><span class="pagination__link pagination__link--current" aria-current="page">1</span></li>
            <li><a class="pagination__link" href="#">2</a></li>
            <li><a class="pagination__link" href="#">3</a></li>
            <li><a class="pagination__link" href="#">${icon('chevron-right', 'icon icon--sm')}<span class="visually-hidden">${t.general.accessibility.next}</span></a></li>
          </ol>
        </nav>
      </div>
    </div>
  </div>
</div>`
  )
);

const pdp = PRODUCTS[0];
writeFileSync(
  join(out, 'product.html'),
  page(
    'Prodotto',
    'product.html',
    `
<div class="product page">
  <nav class="breadcrumbs" aria-label="${t.general.accessibility.breadcrumb}">
    <ol class="breadcrumbs__list" role="list">
      <li class="breadcrumbs__item"><a class="breadcrumbs__link" href="./index.html">Home</a>${icon('chevron-right', 'breadcrumbs__sep icon icon--sm')}</li>
      <li class="breadcrumbs__item"><a class="breadcrumbs__link" href="./collection.html">Cover</a>${icon('chevron-right', 'breadcrumbs__sep icon icon--sm')}</li>
      <li class="breadcrumbs__item"><span class="breadcrumbs__current" aria-current="page">${pdp.title}</span></li>
    </ol>
  </nav>

  <div class="product__layout">
    <div class="product__media-column">
      <media-gallery class="gallery">
        <div class="gallery__viewport">
          ${[1, 2, 3].map((n) => `<figure class="gallery__item">${media('Immagine ' + n)}</figure>`).join('')}
        </div>
        <div class="gallery__thumbs">
          ${[1, 2, 3]
            .map(
              (n) =>
                `<button class="gallery__thumb${n === 1 ? ' is-active' : ''}" type="button" aria-current="${n === 1}">
                  ${icon('package', 'icon')}<span class="visually-hidden">${t.products.gallery_thumbnail.replace('{{ number }}', n)}</span>
                </button>`
            )
            .join('')}
        </div>
      </media-gallery>
    </div>

    <div class="product__info-column">
      <p class="product__vendor eyebrow">${pdp.vendor}</p>
      <h1 class="product__title text-h1">${pdp.title}</h1>
      <p class="product__sku text-caption text-secondary tabular">${t.products.sku}: COV-TR-IP16P</p>

      <div class="product__price">
        <div class="price price--lg price--on-sale">
          <div class="price__row">
            <span class="price__current tabular">${pdp.price}</span>
            <s class="price__compare tabular">${pdp.compare}</s>
          </div>
          <p class="price__prior text-caption text-secondary tabular">
            ${t.price.prior_price}: 29,90 €
          </p>
        </div>
        <p class="text-caption text-secondary">${t.price.shipping_at_checkout}</p>
      </div>

      <div class="product__compat">${compat(pdp, 'panel')}</div>

      <variant-picker class="variants">
        <fieldset class="variants__group">
          <legend class="variants__legend text-ui">Colore: <span class="variants__selected">Trasparente</span></legend>
          <div class="variants__options variants__options--swatch">
            ${[
              ['Trasparente', '#E8ECF0', true],
              ['Blu notte', '#0B1220', true],
              ['Verde', '#15845A', false],
            ]
              .map(
                ([name, hex, avail], i) => `
              <input class="variants__input visually-hidden" type="radio" name="option-1" id="o${i}"${i === 0 ? ' checked' : ''}>
              <label class="variants__label variants__label--swatch${avail ? '' : ' is-unavailable'}" for="o${i}" style="background-color:${hex}">
                <span class="visually-hidden">${name}${avail ? '' : ' — non disponibile'}</span>
              </label>`
              )
              .join('')}
          </div>
        </fieldset>
      </variant-picker>

      <p class="stock stock--in_stock">${icon('check-circle', 'icon icon--sm')}${t.inventory.in_stock}</p>

      <div class="pickup">
        <div class="pickup__row pickup__row--available">
          ${icon('check-circle', 'icon icon--sm')}
          <div>
            <p class="pickup__label text-ui">${t.pickup.available}</p>
            <p class="text-caption text-secondary">Il tempo di ritiro appare qui solo se configurato in Shopify</p>
          </div>
        </div>
        <a class="pickup__link text-ui" href="./store.html">${t.pickup.view_store_info}${icon('chevron-right', 'icon icon--sm')}</a>
      </div>

      <div class="product__buy">
        <form class="product__form" onsubmit="return false">
          <div class="product__buy-row">
            <div class="qty">
              <button class="qty__button" type="button">${icon('minus', 'icon icon--sm')}<span class="visually-hidden">${t.products.decrease_quantity}</span></button>
              <input class="qty__input tabular" type="number" value="1" min="1" aria-label="${t.products.quantity}">
              <button class="qty__button" type="button">${icon('plus', 'icon icon--sm')}<span class="visually-hidden">${t.products.increase_quantity}</span></button>
            </div>
            <button class="button button--primary product__add" type="submit">${t.products.add_to_cart}</button>
          </div>
        </form>
      </div>

      <ul class="product__services" role="list">
        <li>${icon('truck', 'icon icon--sm')}<span class="text-ui">Spedizione in tutta Italia</span></li>
        <li>${icon('refresh', 'icon icon--sm')}<span class="text-ui">Reso entro 14 giorni</span></li>
        <li>${icon('store', 'icon icon--sm')}<span class="text-ui">${t.cart.fulfilment_note}</span></li>
      </ul>

      <a class="button button--secondary button--full" href="#">${icon('whatsapp', 'icon icon--sm')}${t.store.contact_whatsapp}</a>
    </div>
  </div>

  <div class="product__details">
    <details class="accordion" open>
      <summary class="accordion__summary"><span class="text-h3">${t.products.description}</span>${icon('chevron-down', 'accordion__chevron icon')}</summary>
      <div class="accordion__body rte text-measure">
        <p>Cover trasparente con bordi rinforzati e angoli ammortizzati. Compatibile con la ricarica wireless e con gli accessori magnetici.</p>
      </div>
    </details>
    <details class="accordion" open>
      <summary class="accordion__summary"><span class="text-h3">${t.products.specifications}</span>${icon('chevron-down', 'accordion__chevron icon')}</summary>
      <div class="accordion__body"><div class="scroll-x">
        <table class="specs"><tbody>
          <tr><th scope="row">${t.specs.material}</th><td class="tabular">TPU + policarbonato</td></tr>
          <tr><th scope="row">${t.specs.protection_level}</th><td class="tabular">Caduta 2 m</td></tr>
          <tr><th scope="row">${t.specs.magnetic}</th><td class="tabular">Sì</td></tr>
          <tr><th scope="row">${t.specs.wireless_charging}</th><td class="tabular">Sì</td></tr>
          <tr><th scope="row">${t.specs.weight}</th><td class="tabular">32 g</td></tr>
        </tbody></table>
      </div></div>
    </details>
    <details class="accordion">
      <summary class="accordion__summary"><span class="text-h3">${t.products.safety}</span>${icon('chevron-down', 'accordion__chevron icon')}</summary>
      <div class="accordion__body">
        <dl class="safety__list">
          <div class="safety__item"><dt class="text-ui text-secondary">${t.safety.manufacturer}</dt>
            <dd class="text-ui">[Da configurare per prodotto — GPSR]</dd></div>
          <div class="safety__item"><dt class="text-ui text-secondary">${t.safety.eu_person}</dt>
            <dd class="text-ui">[Da configurare per prodotto — GPSR]</dd></div>
        </dl>
      </div>
    </details>
  </div>

  <section class="section">
    <header class="section-head"><div><h2 class="text-h2">${t.products.complete_protection}</h2></div></header>
    <ul class="grid grid--products" role="list">
      ${PRODUCTS.slice(2, 6)
        .map((p) => `<li>${card(p)}</li>`)
        .join('')}
    </ul>
  </section>
</div>

<sticky-buy class="stickybuy">
  <div class="stickybuy__inner">
    <div class="stickybuy__info">
      <span class="stickybuy__title text-caption">${pdp.title}</span>
      <span class="stickybuy__price tabular">${pdp.price}</span>
    </div>
    <button class="button button--primary" type="button">${t.products.add_to_cart}</button>
  </div>
</sticky-buy>`
  )
);

writeFileSync(
  join(out, 'store.html'),
  page(
    'Negozio',
    'store.html',
    `
<div class="storepage page">
  <header class="storepage__header">
    <p class="eyebrow">${t.store.title}</p>
    <h1 class="text-h1">Covers by Mobile</h1>
    <p class="text-body text-secondary text-measure">
      Centro Commerciale Il Nuovo Borgo, Sulmona. Accessori per smartphone, riparazioni e
      protezione tagliata su misura. Aperto tutti i giorni 09:00–20:00.
    </p>
  </header>

  <div class="storepage__layout">
    <div class="storepage__main">
      <ul class="storepage__gallery" role="list">
        ${[1, 2].map((n) => `<li>${media('Foto negozio ' + n, '4/3')}</li>`).join('')}
      </ul>

      <section class="storepage__section">
        <h2 class="text-h2">${t.store.services}</h2>
        <ul class="storepage__services" role="list">
          ${[
            [
              'settings',
              'Riparazioni cellulari, tablet e PC',
              'Diagnosi e riparazione in negozio.',
            ],
            ['device', 'Sostituzione display e batteria', 'Schermi rotti e batterie esauste.'],
            [
              'shield-check',
              'Protezione tagliata su misura',
              'Pellicole tagliate al momento sul tuo modello esatto.',
            ],
            [
              'store',
              'Accessori per smartphone',
              'Cover, vetri, caricatori, cavi, auricolari, smartwatch.',
            ],
            ['package', 'Ritiro ordini online', 'Ordina online e ritira al Centro Il Nuovo Borgo.'],
          ]
            .map(
              ([ic, h, b]) => `<li class="storepage__service">${icon(ic, 'icon icon--lg')}
                <div><h3 class="text-ui storepage__service-title">${h}</h3>
                <p class="text-ui text-secondary">${b}</p></div></li>`
            )
            .join('')}
        </ul>
      </section>

      <section class="storepage__section">
        <h2 class="text-h2">${t.pickup.how_it_works}</h2>
        <div class="rte text-body text-secondary text-measure"><p>${t.pickup.select_at_checkout}</p></div>
      </section>
    </div>

    <aside class="storepage__aside">
      <div class="storepage__card surface">
        <h2 class="text-h3">${t.store.address}</h2>
        <address class="storepage__address text-body">
          <strong>Covers by Mobile</strong><br>
          Viale della Repubblica 8a<br>
          Centro Il Nuovo Borgo, negozio 6<br>
          67039 Sulmona (AQ)<br>Italia
        </address>
        <div class="storepage__block">
          <h3 class="eyebrow">${t.store.hours}</h3>
          <p class="text-ui">Tutti i giorni 09:00–20:00</p>
        </div>
        <ul class="storepage__contact" role="list">
          <li><a class="storepage__contact-link" href="tel:+393508816173">${icon('phone', 'icon icon--sm')}+39 350 881 6173</a></li>
          <li><a class="storepage__contact-link" href="https://wa.me/393508816173" target="_blank" rel="noopener">${icon('whatsapp', 'icon icon--sm')}WhatsApp</a></li>
        </ul>
        <a class="button button--primary button--full" href="https://www.google.com/maps/dir/?api=1&destination=42.0614846%2C13.9200965" target="_blank" rel="noopener">
          ${icon('map-pin', 'icon icon--sm')}${t.store.directions}
        </a>
      </div>

      <div class="storepage__map">
        <div class="storepage__map-preview">
          ${media('Anteprima statica della mappa', '4/3')}
          <div class="storepage__map-consent">
            <p class="text-caption">${t.store.map_consent}</p>
            <button class="button button--secondary button--small" type="button">${t.store.map_load}</button>
          </div>
        </div>
      </div>
    </aside>
  </div>
</div>`
  )
);

/* Components reference page reuses the test harness content. */
writeFileSync(
  join(out, 'components.html'),
  page(
    'Componenti',
    'components.html',
    `
<div class="page section">
  <h1 class="text-h1">Componenti</h1>

  <section class="section--tight">
    <h2 class="text-h2">Pulsanti</h2>
    <div class="cluster">
      <button class="button button--primary">${t.products.add_to_cart}</button>
      <button class="button button--secondary">${t.header.find_device}</button>
      <button class="button button--ink">${t.cart.checkout}</button>
      <button class="button button--ghost">${t.general.actions.continue_shopping}</button>
      <button class="button button--primary" disabled>${t.products.sold_out}</button>
    </div>
  </section>

  <section class="section--tight">
    <h2 class="text-h2">Stati di compatibilità</h2>
    <p class="text-ui text-secondary">Seleziona un dispositivo in home per vederli cambiare dal vivo.</p>
    <div class="stack">
      ${[
        [
          'exact',
          t.compatibility.exact.replace('{{ device }}', 'iPhone 16 Pro Max'),
          'shield-check',
        ],
        [
          'compatible',
          t.compatibility.compatible.replace('{{ device }}', 'Galaxy S25 Ultra'),
          'check-circle',
        ],
        ['universal', t.compatibility.universal, 'info'],
        ['adapter', t.compatibility.adapter, 'alert-circle'],
        ['mismatch', t.compatibility.mismatch, 'alert-triangle'],
      ]
        .map(
          ([state, text, ic]) => `<div class="compat compat--panel">
            <span class="compat__state compat__state--${state}">${icon(ic)}<span>${text}</span></span>
          </div>`
        )
        .join('')}
    </div>
  </section>

  <section class="section--tight">
    <h2 class="text-h2">Modulo</h2>
    <div class="stack" style="max-width:420px">
      <div class="field">
        <label class="field__label" for="f1">${t.newsletter.email_label}</label>
        <input class="input" id="f1" type="email" placeholder="${t.newsletter.email_placeholder}">
        <p class="field__hint">Non condivideremo mai il tuo indirizzo.</p>
      </div>
      <div class="field">
        <label class="field__label" for="f2">Email non valida</label>
        <input class="input" id="f2" type="email" aria-invalid="true" aria-describedby="f2e" value="non-valida">
        <p class="field__error" id="f2e">${icon('alert-circle', 'icon icon--sm')}${t.forms.error_email}</p>
      </div>
    </div>
  </section>

  <section class="section--tight">
    <h2 class="text-h2">Disponibilità</h2>
    <div class="stack">
      <p class="stock stock--in_stock">${icon('check-circle', 'icon icon--sm')}${t.inventory.in_stock}</p>
      <p class="stock stock--backorder">${icon('clock', 'icon icon--sm')}${t.inventory.backorder}</p>
      <p class="stock stock--out_of_stock">${icon('alert-circle', 'icon icon--sm')}${t.inventory.out_of_stock}</p>
    </div>
  </section>

  <section class="section--tight">
    <h2 class="text-h2">Stato vuoto</h2>
    <div class="empty-state surface">
      ${icon('filter', 'icon icon--xl')}
      <p class="empty-state__title text-h3">${t.facets.no_results_title}</p>
      <p class="text-ui text-secondary">${t.facets.no_results_body}</p>
      <div class="empty-state__actions"><a class="button button--primary" href="#">${t.facets.clear_all}</a></div>
    </div>
  </section>
</div>`
  )
);

/* ── Arabic (RTL) ──────────────────────────────────────────────────────────
   Same builders, same CSS, different locale file and direction. This is a real demonstration
   that the theme mirrors: the layout uses logical properties throughout, so setting `dir` is
   genuinely all that changes. Strings come from locales/ar.json, not from a mock. */
LANG = 'ar';
t = locale('ar.json');
writeFileSync(join(out, 'index-ar.html'), page('الصفحة الرئيسية', 'index.html', homeBody()));
LANG = 'it';
t = locale();

console.log('Preview built at tests/preview/');
for (const f of [
  'index.html',
  'collection.html',
  'product.html',
  'store.html',
  'components.html',
]) {
  console.log('  ' + f);
}
