#!/usr/bin/env node
/**
 * Builds the static QA harness.
 *
 * WHY A HARNESS: there is no authenticated Shopify store in this project, so Liquid cannot be
 * rendered. The harness compiles the theme's REAL CSS — the design tokens from
 * theme-tokens.liquid plus critical.css plus every scoped {% stylesheet %} block — and renders
 * the actual component markup with fixture data.
 *
 * WHAT THIS GENUINELY TESTS: component CSS, responsive behaviour, horizontal overflow, colour
 * contrast, focus order, keyboard operation and axe violations.
 *
 * WHAT IT DOES NOT TEST: Liquid rendering, live cart, predictive search results, storefront
 * filters, pickup availability, checkout. Those need a real store and are covered by Theme
 * Check plus the merchant verification script in docs/launch-checklist.md. The QA report must
 * not claim otherwise.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'tests', 'harness');
mkdirSync(outDir, { recursive: true });

/* ── Compile the real CSS ─────────────────────────────────────────────── */

/** Extracts the :root token block from theme-tokens.liquid, resolving Liquid defaults. */
function extractTokens() {
  const source = readFileSync(join(root, 'snippets', 'theme-tokens.liquid'), 'utf8');
  const styleBlocks = [...source.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  // The last <style> block holds :root; the first holds @font-face (skipped — the harness
  // uses system fonts so tests do not depend on webfont loading).
  const tokens = styleBlocks[styleBlocks.length - 1];

  return (
    tokens
      // {{ settings.color_ink | default: '#0B1220' }}  ->  #0B1220
      .replace(/\{\{\s*settings\.[a-z_]+\s*\|\s*default:\s*'([^']+)'\s*\}\}/g, '$1')
      // {{ settings.page_width | default: 1440 }}      ->  1440
      .replace(/\{\{\s*settings\.[a-z_]+\s*\|\s*default:\s*([0-9]+)\s*\}\}/g, '$1')
      .replace(/\{%-?\s*[\s\S]*?-?%\}/g, '')
  );
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function scopedStyles() {
  const files = [...walk(join(root, 'sections')), ...walk(join(root, 'snippets'))].filter(
    (f) => extname(f) === '.liquid'
  );

  let css = '';
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const match = source.match(/\{%\s*stylesheet\s*%\}([\s\S]*?)\{%\s*endstylesheet\s*%\}/);
    if (match) css += `\n/* ${file.split(/[\\/]/).slice(-2).join('/')} */\n${match[1]}`;
  }
  return css;
}

const css = [
  '/* Compiled by tests/build-harness.mjs from the theme source. Do not edit. */',
  extractTokens(),
  readFileSync(join(root, 'assets', 'critical.css'), 'utf8'),
  scopedStyles(),
].join('\n');

writeFileSync(join(outDir, 'theme.css'), css);

/* ── Fixtures ─────────────────────────────────────────────────────────── */

// A deliberately awkward set: the longest realistic Italian strings and the longest device
// names, because that is where layouts actually break.
const products = [
  {
    title: 'Cover trasparente antiurto con bordi rinforzati',
    vendor: 'Atelier',
    price: '24,90 €',
    compare: '34,90 €',
    compat: 'exact',
    device: 'iPhone 16 Pro Max',
    badge: 'sale',
  },
  {
    title: 'Caricatore da parete GaN 65W tre porte USB-C',
    vendor: 'Atelier',
    price: '49,90 €',
    compat: 'universal',
    badge: 'new',
  },
  {
    title: 'Vetro temperato con kit di applicazione guidata',
    vendor: 'Atelier',
    price: '14,90 €',
    compat: 'compatible',
    device: 'Samsung Galaxy S25 Ultra',
  },
  {
    title: 'Power bank magnetico 10.000 mAh Qi2 certificato',
    vendor: 'Atelier',
    price: '59,90 €',
    compat: 'mismatch',
    device: 'Google Pixel 9 Pro XL',
  },
];

const icon = (name) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8"></circle></svg>`;

const compatMarkup = (state, device) => {
  const text = {
    exact: `Compatibilità esatta con ${device}`,
    compatible: `Compatibile con ${device}`,
    universal: 'Universale — verifica le specifiche',
    mismatch: 'Questo prodotto non risulta compatibile con il dispositivo selezionato',
  }[state];
  return `<div class="compat compat--inline"><span class="compat__state compat__state--${state}">${icon()}<span>${text}</span></span></div>`;
};

const card = (p, lcp = false) => `
<div class="card">
  <div class="card__media">
    <a class="card__media-link" href="#" tabindex="-1" aria-hidden="true">
      <div class="media media--empty" style="aspect-ratio:1">${icon()}</div>
    </a>
    <div class="card__media-overlay">
      ${p.badge ? `<ul class="badges" role="list"><li class="badge badge--${p.badge}">${p.badge === 'sale' ? 'In offerta' : 'Novità'}</li></ul>` : ''}
    </div>
    <div class="card__wishlist">
      <button class="icon-button" type="button" aria-pressed="false">${icon()}<span class="visually-hidden">Aggiungi ai preferiti</span></button>
    </div>
  </div>
  <div class="card__body">
    <p class="card__vendor text-caption text-secondary">${p.vendor}</p>
    <h3 class="card__title text-ui"><a class="card__link" href="#">${p.title}</a></h3>
    ${compatMarkup(p.compat, p.device)}
    <div class="price${p.compare ? ' price--on-sale' : ''}">
      <div class="price__row">
        <span class="price__current tabular">${p.price}</span>
        ${p.compare ? `<s class="price__compare tabular">${p.compare}</s>` : ''}
      </div>
    </div>
    <p class="stock stock--compact stock--in_stock">${icon()}Disponibile online</p>
    <a class="button button--secondary button--small button--full" href="#">Scegli le opzioni</a>
    <div class="card__compare">
      <button class="card__compare-toggle text-caption" type="button" aria-pressed="false">${icon()}Aggiungi al confronto</button>
    </div>
  </div>
</div>`;

const page = (title, body) => `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="./theme.css">
</head>
<body>
<a class="skip-link" href="#main">Vai al contenuto principale</a>
<div id="ita-live-region" class="visually-hidden" role="status" aria-live="polite"></div>
<main id="main" tabindex="-1">
${body}
</main>
</body>
</html>`;

/* ── Page 1: product grid (responsive column behaviour) ────────────────── */

writeFileSync(
  join(outDir, 'grid.html'),
  page(
    'Griglia prodotti',
    `<div class="page section">
      <h1 class="text-h1">Cover per iPhone 16 Pro Max</h1>
      <p class="collection__count text-ui">48 prodotti</p>
      <ul class="grid grid--products" role="list">
        ${products
          .concat(products)
          .map((p) => `<li>${card(p)}</li>`)
          .join('')}
      </ul>
    </div>`
  )
);

/* ── Page 2: components (contrast, states, forms, controls) ────────────── */

writeFileSync(
  join(outDir, 'components.html'),
  page(
    'Componenti',
    `<div class="page section">
      <h1 class="text-h1">Componenti</h1>

      <section class="section--tight">
        <h2 class="text-h2">Pulsanti</h2>
        <div class="cluster">
          <button class="button button--primary">Aggiungi al carrello</button>
          <button class="button button--secondary">Trova il tuo dispositivo</button>
          <button class="button button--ink">Vai al checkout</button>
          <button class="button button--ghost">Continua lo shopping</button>
          <button class="button button--primary" disabled>Esaurito</button>
        </div>
      </section>

      <section class="section--tight">
        <h2 class="text-h2">Compatibilità</h2>
        <div class="stack">
          ${['exact', 'compatible', 'universal', 'adapter', 'mismatch']
            .map(
              (state) => `<div class="compat compat--panel">
              <span class="compat__state compat__state--${state}">${icon()}<span>${
                {
                  exact: 'Compatibilità esatta con iPhone 16 Pro Max',
                  compatible: 'Compatibile con Samsung Galaxy S25 Ultra',
                  universal: 'Accessorio universale — controlla connettore e potenza',
                  adapter: 'Compatibile tramite adattatore',
                  mismatch:
                    'Questo prodotto non risulta compatibile con il dispositivo selezionato',
                }[state]
              }</span></span>
            </div>`
            )
            .join('')}
        </div>
      </section>

      <section class="section--tight">
        <h2 class="text-h2">Modulo</h2>
        <div class="stack" style="max-width:420px">
          <div class="field">
            <label class="field__label" for="f-email">Il tuo indirizzo email</label>
            <input class="input" id="f-email" type="email" placeholder="nome@esempio.it">
            <p class="field__hint">Non condivideremo mai il tuo indirizzo.</p>
          </div>
          <div class="field">
            <label class="field__label" for="f-bad">Email non valida</label>
            <input class="input" id="f-bad" type="email" aria-invalid="true" aria-describedby="f-bad-err" value="non-valida">
            <p class="field__error" id="f-bad-err">${icon()}Inserisci un indirizzo email valido.</p>
          </div>
          <div class="field">
            <label class="field__label" for="f-sel">Ordina per</label>
            <select class="select" id="f-sel">
              <option>In evidenza</option><option>Più venduti</option><option>Prezzo crescente</option>
            </select>
          </div>
          <div class="qty">
            <button class="qty__button" type="button"><span class="visually-hidden">Riduci</span>−</button>
            <input class="qty__input tabular" type="number" value="1" aria-label="Quantità">
            <button class="qty__button" type="button"><span class="visually-hidden">Aumenta</span>+</button>
          </div>
        </div>
      </section>

      <section class="section--tight">
        <h2 class="text-h2">Stato disponibilità</h2>
        <div class="stack">
          <p class="stock stock--in_stock">${icon()}Disponibile online</p>
          <p class="stock stock--backorder">${icon()}Disponibile su ordinazione</p>
          <p class="stock stock--out_of_stock">${icon()}Non disponibile online</p>
          <div class="pickup">
            <div class="pickup__row pickup__row--available">${icon()}<div>
              <p class="pickup__label text-ui">Disponibile per il ritiro presso il negozio</p>
              <p class="text-caption text-secondary">Pronto per il ritiro in 2 ore lavorative</p>
            </div></div>
          </div>
        </div>
      </section>

      <section class="section--tight">
        <h2 class="text-h2">Contesto dispositivo</h2>
        <div class="surface--device" style="padding:var(--space-3);display:flex;gap:var(--space-3);align-items:center;background:var(--color-accent-surface)">
          ${icon()}<span class="device-strip__label text-ui">Il mio dispositivo: <strong>iPhone 16 Pro Max</strong></span>
          <a class="device-strip__change text-ui" href="#">Cambia dispositivo</a>
        </div>
      </section>

      <section class="section--tight">
        <h2 class="text-h2">Filtri</h2>
        <ul class="facets__chips" role="list">
          <li><a class="chip" href="#">Nero${icon()}</a></li>
          <li><a class="chip" href="#">MagSafe${icon()}</a></li>
          <li><a class="chip" href="#">Disponibile${icon()}</a></li>
        </ul>
        <details class="facet" open>
          <summary class="facet__summary"><span class="facet__label text-ui">Colore</span>${icon()}</summary>
          <div class="facet__body"><ul class="facet__values" role="list">
            <li><label class="facet__option"><input type="checkbox"><span class="facet__option-label text-ui">Trasparente</span><span class="facet__option-count text-caption text-secondary tabular">12</span></label></li>
            <li><label class="facet__option"><input type="checkbox" checked><span class="facet__option-label text-ui">Blu notte</span><span class="facet__option-count text-caption text-secondary tabular">7</span></label></li>
          </ul></div>
        </details>
      </section>

      <section class="section--tight">
        <h2 class="text-h2">Stato vuoto</h2>
        <div class="empty-state surface">
          ${icon()}
          <p class="empty-state__title text-h3">Nessun prodotto corrisponde ai filtri</p>
          <p class="text-ui text-secondary">Prova a rimuovere qualche filtro per vedere più risultati.</p>
          <div class="empty-state__actions">
            <a class="button button--primary" href="#">Cancella tutti i filtri</a>
          </div>
        </div>
      </section>

      <section class="section--tight">
        <h2 class="text-h2">Specifiche</h2>
        <div class="scroll-x">
          <table class="specs"><tbody>
            <tr><th scope="row">Potenza totale</th><td class="tabular">65 W</td></tr>
            <tr><th scope="row">Tecnologia GaN</th><td class="tabular">Sì</td></tr>
            <tr><th scope="row">Compatibilità magnetica</th><td class="tabular">MagSafe, Qi2</td></tr>
          </tbody></table>
        </div>
      </section>
    </div>`
  )
);

console.log('Harness built:');
console.log('  tests/harness/theme.css');
console.log('  tests/harness/grid.html');
console.log('  tests/harness/components.html');
