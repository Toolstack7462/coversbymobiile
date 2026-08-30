/**
 * Italian Tech Atelier — predictive search.
 *
 * Enhancement only. The underlying element is a real GET form to /search, so search works with
 * this file blocked, failed or still loading.
 *
 * Results arrive as rendered HTML from the Section Rendering API, so this file never builds
 * markup and never touches innerHTML with a server string beyond inserting the section Shopify
 * itself rendered.
 */

import { announce } from './a11y.js';

const DEBOUNCE_MS = 250;
const MIN_QUERY = 2;
const SECTION_ID = 'predictive-search';

/**
 * Normalises a query so device models match however the customer types them:
 * "S24 Ultra", "S 24 Ultra", "iPhone15Pro" and "iPhone 15 Pro" should all find the same thing.
 * Shopify's own prefix matching handles most of it; this widens the net by also sending a
 * space-normalised variant when the raw query contains digits glued to letters.
 */
export function normaliseQuery(raw) {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  // Insert a space between letters and digits: "iphone15pro" -> "iphone 15 pro"
  const spaced = trimmed
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ');
  return spaced === trimmed ? trimmed : `${trimmed} ${spaced}`;
}

class PredictiveSearch extends HTMLElement {
  #timer;
  #controller;

  connectedCallback() {
    this.input = this.querySelector('[data-search-input]');
    this.results = this.querySelector('[data-search-results]');
    this.clearButton = this.querySelector('[data-search-clear]');
    if (!this.input || !this.results) return;

    this.input.addEventListener('input', () => this.#onInput());
    this.input.addEventListener('focus', () => {
      if (this.input.value.trim().length >= MIN_QUERY) this.#open();
    });
    this.addEventListener('keydown', (event) => this.#onKeydown(event));

    this.clearButton?.addEventListener('click', () => {
      this.input.value = '';
      this.input.focus();
      this.#close();
      this.#syncClearButton();
    });

    document.addEventListener('click', (event) => {
      if (!this.contains(event.target)) this.#close();
    });

    this.#syncClearButton();
  }

  #onInput() {
    this.#syncClearButton();
    clearTimeout(this.#timer);

    const query = this.input.value.trim();
    if (query.length < MIN_QUERY) {
      this.#close();
      return;
    }

    this.#timer = setTimeout(() => this.#search(query), DEBOUNCE_MS);
  }

  async #search(query) {
    // Abort the previous request so a slow early keystroke cannot overwrite a fast later one.
    this.#controller?.abort();
    this.#controller = new AbortController();

    const params = new URLSearchParams({
      q: normaliseQuery(query),
      'resources[limit]': '6',
      'resources[options][prefix]': 'last',
      section_id: SECTION_ID,
    });

    this.results.setAttribute('aria-busy', 'true');

    try {
      const response = await fetch(`${window.ITA.routes.predictive}?${params}`, {
        signal: this.#controller.signal,
      });
      if (!response.ok) throw new Error(String(response.status));

      const html = await response.text();
      // Shopify returns the section wrapper; take its inner content.
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const content = parsed.querySelector('.ps');
      if (!content) throw new Error('unexpected response');

      this.results.replaceChildren(content);
      this.#open();

      const status = content.querySelector('[data-search-status]');
      if (status) announce(status.textContent.trim());
    } catch (error) {
      if (error.name === 'AbortError') return;
      // A failed suggestion must never break the form. Close the panel and let the customer
      // submit a normal search.
      this.#close();
    } finally {
      this.results.removeAttribute('aria-busy');
    }
  }

  #onKeydown(event) {
    if (event.key === 'Escape') {
      this.#close();
      this.input.focus();
      return;
    }

    if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
    if (this.results.hidden) return;

    const options = Array.from(this.results.querySelectorAll('[role="option"]'));
    if (options.length === 0) return;

    const current = options.findIndex((el) => el.getAttribute('aria-selected') === 'true');

    if (event.key === 'Enter') {
      if (current > -1) {
        event.preventDefault();
        options[current].click();
      }
      return;
    }

    event.preventDefault();
    const next =
      event.key === 'ArrowDown'
        ? Math.min(current + 1, options.length - 1)
        : Math.max(current - 1, 0);

    for (const el of options) el.setAttribute('aria-selected', 'false');
    options[next].setAttribute('aria-selected', 'true');
    options[next].scrollIntoView({ block: 'nearest' });
    // Keep real focus in the input so typing continues to work, per the combobox pattern.
    this.input.setAttribute('aria-activedescendant', options[next].id || '');
  }

  #syncClearButton() {
    if (this.clearButton) this.clearButton.hidden = this.input.value.length === 0;
  }

  #open() {
    this.results.hidden = false;
    this.input.setAttribute('aria-expanded', 'true');
  }

  #close() {
    this.results.hidden = true;
    this.input.setAttribute('aria-expanded', 'false');
    this.input.removeAttribute('aria-activedescendant');
  }
}

if (!customElements.get('predictive-search')) {
  customElements.define('predictive-search', PredictiveSearch);
}
