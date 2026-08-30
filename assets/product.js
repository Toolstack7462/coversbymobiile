/**
 * Italian Tech Atelier — product page.
 *
 * Variant switching, gallery navigation and the mobile sticky purchase bar.
 *
 * Price, availability and PICKUP are re-rendered by the server through the Section Rendering
 * API rather than patched from the client-side variant map. That matters most for pickup:
 * store availability is variant-specific and derived from real inventory at a location, and it
 * is not something the client can or should compute. The variant map is used only for the
 * instant, cosmetic parts (which option combination exists, which media to show).
 */

import { announce } from './a11y.js';

/* ── <variant-picker> ─────────────────────────────────────────────────── */

class VariantPicker extends HTMLElement {
  connectedCallback() {
    const script = this.querySelector('[data-variant-map]');
    if (!script) return;

    try {
      this.variants = JSON.parse(script.textContent);
    } catch {
      return; // Malformed data: leave the no-JS form working rather than half-upgrading it.
    }

    this.addEventListener('change', (event) => {
      if (event.target.matches('[data-option-position]')) this.#onChange();
    });
  }

  #selectedOptions() {
    return Array.from(this.querySelectorAll('[data-option-position]:checked'))
      .sort((a, b) => Number(a.dataset.optionPosition) - Number(b.dataset.optionPosition))
      .map((input) => input.value);
  }

  #onChange() {
    const selected = this.#selectedOptions();

    const match = this.variants.find(
      (variant) =>
        variant.options.length === selected.length &&
        variant.options.every((value, index) => value === selected[index])
    );

    // Reflect the chosen value in each legend so the current selection is readable, not just
    // visible as a highlighted chip.
    for (const input of this.querySelectorAll('[data-option-position]:checked')) {
      const label = this.querySelector(`[data-selected-value="${input.dataset.optionPosition}"]`);
      if (label) label.textContent = input.value;
    }

    if (!match) {
      // A combination that does not exist. Say so rather than silently doing nothing.
      const button = document.querySelector('[data-add-button]');
      if (button) {
        button.disabled = true;
        button.textContent = window.ITA?.strings?.products?.unavailable ?? '';
      }
      return;
    }

    this.#applyVariant(match);
  }

  async #applyVariant(variant) {
    const idInput = document.querySelector('[data-variant-id]');
    if (idInput) idInput.value = variant.id;

    // Keep the URL in step so the page can be shared, refreshed or bookmarked on this variant.
    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    history.replaceState({}, '', url);

    this.#showMediaFor(variant);

    // Ask Shopify to re-render the parts that depend on server truth.
    try {
      const sectionId = document.querySelector('.product')?.closest('.shopify-section')?.id;
      const section = sectionId ? sectionId.replace('shopify-section-', '') : 'main-product';

      const response = await fetch(
        `${window.location.pathname}?variant=${variant.id}&section_id=${section}`
      );
      if (!response.ok) throw new Error(String(response.status));

      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');

      for (const selector of [
        '[data-price-container]',
        '[data-stock-container]',
        '[data-pickup-container]',
      ]) {
        const next = doc.querySelector(selector);
        const current = document.querySelector(selector);
        if (next && current) current.replaceWith(next);
      }

      const nextSku = doc.querySelector('[data-variant-sku]');
      const currentSku = document.querySelector('[data-variant-sku]');
      if (nextSku && currentSku) currentSku.textContent = nextSku.textContent;

      const nextButton = doc.querySelector('[data-add-button]');
      const currentButton = document.querySelector('[data-add-button]');
      if (nextButton && currentButton) currentButton.replaceWith(nextButton);

      const stickyPrice = document.querySelector('[data-sticky-price]');
      const nextPrice = doc.querySelector('.price__current');
      if (stickyPrice && nextPrice) {
        // .price__current also holds a visually-hidden "In offerta"/"Prezzo" label; taking
        // textContent wholesale would render "EUR 29,90 In offerta" in the sticky bar.
        const clone = nextPrice.cloneNode(true);
        clone.querySelector('.visually-hidden')?.remove();
        stickyPrice.textContent = clone.textContent.trim();
      }
    } catch {
      // The form still carries the correct variant id, so the purchase path is intact even if
      // the cosmetic refresh failed.
      announce(window.ITA?.strings?.general?.networkError ?? '');
    }
  }

  #showMediaFor(variant) {
    if (!variant.media_id) return;
    const target = document.getElementById(`media-${variant.media_id}`);
    if (!target) return;

    const thumb = document.querySelector(`[data-thumb][data-media-id="${variant.media_id}"]`);
    thumb?.click();
    target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }
}

/* ── <media-gallery> ──────────────────────────────────────────────────── */

class MediaGallery extends HTMLElement {
  connectedCallback() {
    this.viewport = this.querySelector('.gallery__viewport');
    this.thumbs = Array.from(this.querySelectorAll('[data-thumb]'));

    for (const thumb of this.thumbs) {
      thumb.addEventListener('click', () => {
        const target = this.querySelector(`[data-media-id="${thumb.dataset.mediaId}"]`);
        target?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        this.#setActive(thumb);
      });
    }

    // Keep the active thumbnail in step with what is actually on screen.
    if (this.viewport && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const id = entry.target.dataset.mediaId;
            const thumb = this.thumbs.find((t) => t.dataset.mediaId === id);
            if (thumb) this.#setActive(thumb);
          }
        },
        { root: this.viewport, threshold: 0.6 }
      );

      for (const item of this.querySelectorAll('.gallery__item')) observer.observe(item);
    }
  }

  #setActive(active) {
    for (const thumb of this.thumbs) {
      const isActive = thumb === active;
      thumb.classList.toggle('is-active', isActive);
      thumb.setAttribute('aria-current', String(isActive));
    }
  }
}

/* ── <sticky-buy> ─────────────────────────────────────────────────────── */

class StickyBuy extends HTMLElement {
  connectedCallback() {
    const anchor = document.querySelector('[data-add-button]');
    if (!anchor || !('IntersectionObserver' in window)) return;

    // Show the bar only once the real button has scrolled out of view. A sticky bar that is
    // visible while the button it duplicates is on screen is just clutter.
    const observer = new IntersectionObserver(
      ([entry]) => {
        this.hidden = entry.isIntersecting;
      },
      { threshold: 0 }
    );

    observer.observe(anchor);
  }
}

/* ── Quantity stepper ─────────────────────────────────────────────────── */

const qtyInput = document.querySelector('[data-pdp-qty]');
if (qtyInput) {
  const step = (delta) => {
    const max = qtyInput.max ? Number(qtyInput.max) : Infinity;
    const next = Math.min(Math.max(Number(qtyInput.value) + delta, 1), max);
    if (next === Number(qtyInput.value) && delta > 0) {
      announce((window.ITA?.strings?.cart?.quantityLimit ?? '').replace('{{ max }}', String(max)));
      return;
    }
    qtyInput.value = next;
  };

  document.querySelector('[data-pdp-qty-up]')?.addEventListener('click', () => step(1));
  document.querySelector('[data-pdp-qty-down]')?.addEventListener('click', () => step(-1));
}

if (!customElements.get('variant-picker')) customElements.define('variant-picker', VariantPicker);
if (!customElements.get('media-gallery')) customElements.define('media-gallery', MediaGallery);
if (!customElements.get('sticky-buy')) customElements.define('sticky-buy', StickyBuy);
