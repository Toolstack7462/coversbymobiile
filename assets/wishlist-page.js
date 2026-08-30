/**
 * Italian Tech Atelier — wishlist page.
 *
 * Reads the saved products from localStorage and asks Shopify to render their cards, so prices,
 * availability and compatibility come from the server rather than from whatever was cached in
 * the browser when the product was saved. A wishlist showing a stale price is worse than no
 * wishlist.
 */

import { Wishlist } from './wishlist.js';
import { announce } from './a11y.js';

class WishlistPage extends HTMLElement {
  connectedCallback() {
    this.emptyState = this.querySelector('[data-wishlist-empty]');
    this.target = this.querySelector('[data-wishlist-target]');

    document.addEventListener('ita:wishlist-change', () => this.#render());
    this.#render();
  }

  async #render() {
    const items = Wishlist.all();

    if (items.length === 0) {
      this.emptyState.hidden = false;
      this.target.hidden = true;
      this.target.replaceChildren();
      return;
    }

    const query = items
      .map((item) => (item.id ? `id:${item.id}` : null))
      .filter(Boolean)
      .join(' OR ');

    if (!query) return;

    const params = new URLSearchParams({
      q: query,
      type: 'product',
      section_id: 'recently-viewed',
    });

    try {
      const response = await fetch(`${window.ITA.routes.search}?${params}`);
      if (!response.ok) throw new Error(String(response.status));

      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const grid = doc.querySelector('[data-recently-viewed-results]');
      if (!grid || grid.children.length === 0) {
        // Everything saved has since been removed from the catalogue.
        this.emptyState.hidden = false;
        this.target.hidden = true;
        return;
      }

      this.target.replaceChildren(grid);
      this.target.hidden = false;
      this.emptyState.hidden = true;
    } catch {
      announce(window.ITA?.strings?.general?.networkError ?? '');
    }
  }
}

if (!customElements.get('wishlist-page')) customElements.define('wishlist-page', WishlistPage);
