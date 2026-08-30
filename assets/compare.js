/**
 * Italian Tech Atelier — product comparison.
 *
 * Compares up to three products FROM THE SAME CATEGORY. The category restriction is not a
 * limitation, it is the point: comparing a charger against a phone case produces a table of
 * mismatched rows that helps nobody. The comparison rows are category-specific, so the category
 * must be consistent.
 *
 * State is per-browser (localStorage), like the wishlist, and the UI never claims otherwise.
 */

import { announce } from './a11y.js';

const KEY = 'ita.compare';
const LIMIT = 3;

function read() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

/** Notifies listeners that the comparison list changed. */
function emitCompareChange(list) {
  document.dispatchEvent(new CustomEvent('ita:compare-change', { detail: { list } }));
}

export const Compare = {
  all: read,

  has(handle) {
    return read().some((item) => item.handle === handle);
  },

  /**
   * @returns {'added'|'removed'|'limit'|'category'|'error'}
   */
  toggle(item) {
    const list = read();
    const index = list.findIndex((existing) => existing.handle === item.handle);

    if (index > -1) {
      list.splice(index, 1);
      if (!write(list)) return 'error';
      emitCompareChange(list);
      return 'removed';
    }

    // Both guards produce a specific, actionable message rather than a silent no-op.
    if (list.length > 0 && list[0].category !== item.category) return 'category';
    if (list.length >= LIMIT) return 'limit';

    list.push(item);
    if (!write(list)) return 'error';
    emitCompareChange(list);
    return 'added';
  },

  clear() {
    write([]);
    emitCompareChange([]);
  },
};

class CompareButton extends HTMLElement {
  connectedCallback() {
    this.button = this.querySelector('[data-compare-toggle]');
    if (!this.button) return;

    this.item = {
      handle: this.dataset.productHandle,
      id: Number(this.dataset.productId),
      title: this.dataset.productTitle,
      category: this.dataset.productCategory || '',
    };

    this.#render();

    this.button.addEventListener('click', () => {
      const result = Compare.toggle(this.item);
      const strings = window.ITA?.strings?.compare ?? {};

      switch (result) {
        case 'limit':
          announce(strings.limitReached ?? '');
          return;
        case 'category':
          announce(strings.differentCategory ?? '');
          return;
        case 'error':
          announce(window.ITA?.strings?.general?.error ?? '');
          return;
        default:
          this.#render();
      }
    });

    document.addEventListener('ita:compare-change', () => this.#render());
  }

  #render() {
    this.button.setAttribute('aria-pressed', String(Compare.has(this.item.handle)));
  }
}

/** The floating "Confronta (n)" bar. Hidden until there is something to compare. */
class CompareBar extends HTMLElement {
  connectedCallback() {
    this.countEl = this.querySelector('[data-compare-count]');
    this.clearButton = this.querySelector('[data-compare-clear]');

    this.clearButton?.addEventListener('click', () => Compare.clear());
    document.addEventListener('ita:compare-change', () => this.#render());
    this.#render();
  }

  #render() {
    const list = Compare.all();
    this.hidden = list.length === 0;
    if (this.countEl) this.countEl.textContent = String(list.length);
  }
}

if (!customElements.get('compare-button')) customElements.define('compare-button', CompareButton);
if (!customElements.get('compare-bar')) customElements.define('compare-bar', CompareBar);
