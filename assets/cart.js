/**
 * Italian Tech Atelier — cart.
 *
 * TRUST BOUNDARY: this file never computes a price, a total, a discount or an inventory level.
 * It sends intents (add this variant, set this line to this quantity) and then asks Shopify to
 * re-render the cart markup. Everything the customer sees comes back from the server.
 *
 * PROGRESSIVE ENHANCEMENT: every entry point is a real form or a real link to /cart. If this
 * file fails to load, the customer can still add to cart, change quantities and check out via
 * full page loads.
 */

import { trapFocus, releaseFocus, announce, t } from './a11y.js';

const DRAWER_SECTION = 'cart-drawer';

/* ── Section rendering ────────────────────────────────────────────────── */

async function fetchCartSections() {
  const response = await fetch(`${window.ITA.routes.root}?sections=${DRAWER_SECTION}`);
  if (!response.ok) throw new Error(`sections ${response.status}`);
  return response.json();
}

/** Replaces the drawer's contents with freshly server-rendered markup. */
function applyDrawerHtml(html) {
  const drawer = document.querySelector('cart-drawer');
  if (!drawer) return;

  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const next = parsed.querySelector('cart-drawer');
  if (!next) return;

  const wasOpen = !drawer.hidden;
  drawer.replaceChildren(...next.children);
  drawer.hidden = !wasOpen;
  if (wasOpen) drawer.refreshBindings?.();
}

function updateCounts(count) {
  for (const el of document.querySelectorAll('[data-cart-count]')) {
    el.textContent = count;
    el.hidden = count === 0;
  }
  for (const el of document.querySelectorAll('[data-cart-count-label]')) {
    el.textContent = t(window.ITA?.strings?.cart?.countLabel, { count }) || '';
  }
}

/* ── Cart operations ──────────────────────────────────────────────────── */

async function postCart(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Shopify returns a human-readable `description` for cart errors, most commonly when the
    // requested quantity exceeds available stock. Surface it rather than a generic failure.
    const message = data?.description || data?.message || window.ITA?.strings?.general?.error;
    throw new Error(message);
  }

  return data;
}

export async function addToCart(formData) {
  const body = Object.fromEntries(formData.entries());
  const result = await postCart(window.ITA.routes.cartAdd, {
    items: [{ id: body.id, quantity: Number(body.quantity ?? 1) }],
  });

  const sections = await fetchCartSections();
  applyDrawerHtml(sections[DRAWER_SECTION]);

  const cart = await fetch(`${window.ITA.routes.cart}.js`).then((r) => r.json());
  updateCounts(cart.item_count);

  return result;
}

export async function changeLine(key, quantity) {
  const cart = await postCart(window.ITA.routes.cartChange, { id: key, quantity });

  const sections = await fetchCartSections();
  applyDrawerHtml(sections[DRAWER_SECTION]);
  updateCounts(cart.item_count);

  // The cart page has its own markup; a full reload there is simpler and safer than trying to
  // reconcile two independent renderings of the same data.
  if (document.body.classList.contains('template-cart')) window.location.reload();

  return cart;
}

/* ── <cart-drawer> ────────────────────────────────────────────────────── */

class CartDrawer extends HTMLElement {
  connectedCallback() {
    this.refreshBindings();

    this.addEventListener('click', (event) => {
      if (event.target === this) this.close();
    });

    this.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.close();
    });

    for (const trigger of document.querySelectorAll('[data-cart-open]')) {
      trigger.addEventListener('click', (event) => {
        // Ctrl/cmd-click and middle-click should still open /cart in a new tab.
        if (event.metaKey || event.ctrlKey || event.button !== 0) return;
        event.preventDefault();
        this.open();
      });
    }
  }

  /**
   * Re-attaches the close button after the drawer markup is replaced.
   *
   * Line-item controls are NOT bound here. They are delegated from `document` below, because
   * the same markup is also rendered on the full /cart page, which is not inside this element
   * — binding them here left the cart page's +/- and remove buttons completely inert.
   */
  refreshBindings() {
    this.querySelector('[data-drawer-close]')?.addEventListener('click', () => this.close());
  }

  open() {
    this.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    trapFocus(this, this.querySelector('[data-drawer-close]'));
  }

  close() {
    releaseFocus(this);
    this.hidden = true;
    document.documentElement.style.overflow = '';
  }
}

if (!customElements.get('cart-drawer')) customElements.define('cart-drawer', CartDrawer);

/* ── Line-item controls ───────────────────────────────────────────────────
   Delegated from `document` for two reasons: the cart PAGE renders these same controls
   outside any custom element, and the drawer replaces its own contents after every mutation.
   One mechanism serves both surfaces and survives re-rendering with no re-binding. */

async function setQuantity(key, quantity, source) {
  if (!key) return;
  source?.closest('[data-cart-item]')?.setAttribute('aria-busy', 'true');

  try {
    await changeLine(key, Number(quantity));
  } catch (error) {
    announce(error.message || window.ITA?.strings?.cart?.error);
    source?.closest('[data-cart-item]')?.removeAttribute('aria-busy');
  }
}

document.addEventListener('click', (event) => {
  const stepper = event.target.closest('[data-qty-up], [data-qty-down]');
  if (stepper) {
    const input = stepper.parentElement?.querySelector('[data-qty-input]');
    if (!input) return;

    const step = stepper.hasAttribute('data-qty-up') ? 1 : -1;
    const max = input.max ? Number(input.max) : Infinity;
    const next = Math.min(Math.max(Number(input.value) + step, 0), max);

    // Refuse to exceed real stock, and say why rather than failing silently.
    if (next === Number(input.value) && step > 0) {
      announce(t(window.ITA?.strings?.cart?.quantityLimit, { max }));
      return;
    }
    setQuantity(input.dataset.key, next, input);
    return;
  }

  const remove = event.target.closest('[data-cart-remove]');
  if (remove) setQuantity(remove.dataset.key, 0, remove);
});

document.addEventListener('change', (event) => {
  const input = event.target.closest('[data-qty-input]');
  if (input) setQuantity(input.dataset.key, input.value, input);
});

/* ── Line-item controls: delegated ────────────────────────────────────────
   Delegated from `document` rather than bound inside the drawer, for two reasons: the cart
   PAGE renders the same markup outside any custom element, and the drawer replaces its own
   contents after every mutation. One mechanism, both surfaces, no re-binding. */

async function setQuantity(key, quantity, source) {
  if (!key) return;
  source?.closest('[data-cart-item]')?.setAttribute('aria-busy', 'true');

  try {
    await changeLine(key, Number(quantity));
  } catch (error) {
    announce(error.message || window.ITA?.strings?.cart?.error);
    source?.closest('[data-cart-item]')?.removeAttribute('aria-busy');
  }
}

document.addEventListener('click', (event) => {
  const stepper = event.target.closest('[data-qty-up], [data-qty-down]');
  if (stepper) {
    const input = stepper.parentElement?.querySelector('[data-qty-input]');
    if (!input) return;
    const step = stepper.hasAttribute('data-qty-up') ? 1 : -1;
    const max = input.max ? Number(input.max) : Infinity;
    const next = Math.min(Math.max(Number(input.value) + step, 0), max);

    // Refuse to exceed real stock, and say why rather than failing silently.
    if (next === Number(input.value) && step > 0) {
      announce(t(window.ITA?.strings?.cart?.quantityLimit, { max }));
      return;
    }
    setQuantity(input.dataset.key, next, input);
    return;
  }

  const remove = event.target.closest('[data-cart-remove]');
  if (remove) setQuantity(remove.dataset.key, 0, remove);
});

document.addEventListener('change', (event) => {
  const input = event.target.closest('[data-qty-input]');
  if (input) setQuantity(input.dataset.key, input.value, input);
});

/* ── Quick add and product forms ──────────────────────────────────────── */

document.addEventListener('submit', async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (!form.matches('[data-quick-add], [data-product-form]')) return;

  event.preventDefault();

  const submit = form.querySelector('[type="submit"]');
  const original = submit?.textContent;
  if (submit) {
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    submit.textContent = window.ITA?.strings?.products?.adding ?? original;
  }

  try {
    await addToCart(new FormData(form));

    const title = form.dataset.productTitle || '';
    announce(t(window.ITA?.strings?.cart?.added, { title }));
    document.querySelector('cart-drawer')?.open();
  } catch (error) {
    announce(error.message || window.ITA?.strings?.cart?.error);
  } finally {
    if (submit) {
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      if (original) submit.textContent = original;
    }
  }
});
