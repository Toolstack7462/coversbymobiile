/**
 * Italian Tech Atelier — wishlist.
 *
 * SCOPE, STATED HONESTLY: this is a guest wishlist stored in the customer's browser. It is not
 * synced to their account and not shared between devices or browsers. Cross-device sync needs a
 * customer-account app or a custom app with a datastore; that is documented in docs/app-stack.md
 * rather than faked here. The UI carries the same caveat in `wishlist.local_only_note`.
 */

import { announce, t } from './a11y.js';

const KEY = 'ita.wishlist';

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
    // Quota or blocked storage. Tell the customer rather than silently doing nothing.
    announce(window.ITA?.strings?.general?.error ?? '');
    return false;
  }
}

export const Wishlist = {
  all: read,

  has(handle) {
    return read().some((item) => item.handle === handle);
  },

  toggle(item) {
    const list = read();
    const index = list.findIndex((existing) => existing.handle === item.handle);
    const added = index === -1;

    if (added) list.unshift(item);
    else list.splice(index, 1);

    if (!write(list)) return null;

    document.dispatchEvent(new CustomEvent('ita:wishlist-change', { detail: { list } }));
    return added;
  },
};

function updateCounts() {
  const count = read().length;
  for (const el of document.querySelectorAll('[data-wishlist-count]')) {
    el.textContent = count;
    el.hidden = count === 0;
  }
}

class WishlistButton extends HTMLElement {
  connectedCallback() {
    this.button = this.querySelector('[data-wishlist-toggle]');
    this.labelEl = this.querySelector('[data-wishlist-label]');
    if (!this.button) return;

    this.item = {
      handle: this.dataset.productHandle,
      id: Number(this.dataset.productId),
      title: this.dataset.productTitle,
    };

    this.#render(Wishlist.has(this.item.handle));

    this.button.addEventListener('click', () => {
      const added = Wishlist.toggle(this.item);
      if (added === null) return;

      this.#render(added);
      updateCounts();
      announce(
        t(added ? window.ITA?.strings?.wishlist?.added : window.ITA?.strings?.wishlist?.removed, {
          title: this.item.title,
        })
      );
    });

    document.addEventListener('ita:wishlist-change', () => {
      this.#render(Wishlist.has(this.item.handle));
    });
  }

  #render(active) {
    // aria-pressed communicates the state; the icon swap is the visual half of the same fact.
    this.button.setAttribute('aria-pressed', String(active));

    if (this.labelEl) {
      this.labelEl.textContent = active
        ? (window.ITA?.strings?.products?.removeFromWishlist ?? '')
        : (window.ITA?.strings?.products?.addToWishlist ?? '');
    }

    const icon = this.button.querySelector('svg');
    const template = document.getElementById(`ita-icon-${active ? 'heart-filled' : 'heart'}`);
    if (icon && template) {
      const next = template.content.firstElementChild.cloneNode(true);
      next.setAttribute('class', icon.getAttribute('class') || 'icon');
      icon.replaceWith(next);
    }
  }
}

if (!customElements.get('wishlist-button')) {
  customElements.define('wishlist-button', WishlistButton);
}

updateCounts();
