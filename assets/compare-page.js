/**
 * Italian Tech Atelier — comparison page.
 *
 * Reads the compared products from localStorage, then asks Shopify to render the table so the
 * values come from product metafields rather than a second, client-side data path.
 */

import { Compare } from './compare.js';
import { announce } from './a11y.js';

class CompareTable extends HTMLElement {
  connectedCallback() {
    this.emptyState = this.querySelector('[data-compare-empty]');
    this.results = this.querySelector('[data-compare-results]');
    this.target = this.querySelector('[data-compare-target]');

    this.querySelector('[data-compare-clear-all]')?.addEventListener('click', () => {
      Compare.clear();
      this.#render();
    });

    // Removal buttons live inside the fetched markup, so they are handled by delegation.
    this.addEventListener('click', (event) => {
      const button = event.target.closest('[data-compare-remove]');
      if (!button) return;
      const handle = button.dataset.compareRemove;
      const item = Compare.all().find((entry) => entry.handle === handle);
      if (item) Compare.toggle(item);
      this.#render();
    });

    document.addEventListener('ita:compare-change', () => this.#render());
    this.#render();
  }

  async #render() {
    const items = Compare.all();

    if (items.length === 0) {
      this.emptyState.hidden = false;
      this.results.hidden = true;
      this.target.replaceChildren();
      return;
    }

    const query = items.map((item) => `id:${item.id}`).join(' OR ');
    const params = new URLSearchParams({
      q: query,
      type: 'product',
      section_id: 'compare-data',
    });

    try {
      const response = await fetch(`${window.ITA.routes.search}?${params}`);
      if (!response.ok) throw new Error(String(response.status));

      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const table = doc.querySelector('[data-compare-rendered]');
      if (!table) throw new Error('no table');

      this.target.replaceChildren(table);
      this.emptyState.hidden = true;
      this.results.hidden = false;
    } catch {
      announce(window.ITA?.strings?.general?.networkError ?? '');
    }
  }
}

if (!customElements.get('compare-table')) customElements.define('compare-table', CompareTable);
