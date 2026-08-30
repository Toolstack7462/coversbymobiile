/**
 * Italian Tech Atelier — device finder.
 *
 * Enhancement over server-rendered markup. Every model is already a real link, so with this
 * file absent a customer can still browse brand > family > model and land on the right
 * collection. What this adds is search, recent devices, and saving the choice so the rest of
 * the storefront can resolve compatibility against it.
 *
 * There is no JSON payload: search filters the links that are already in the DOM.
 */

import { DeviceStore } from './device-context.js';
import { announce, t } from './a11y.js';

/**
 * Normalises a device string so all the ways people actually type a model match:
 *   "Galaxy S24 Ultra", "S 24 Ultra", "s24ultra", "iPhone15Pro", "iphone 15 pro"
 * Lowercase, strip everything that is not a letter or digit.
 */
export function normalise(value) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** True when `query` matches the model name, its brand, or any configured alias. */
export function matches(query, { name, brand, aliases }) {
  const q = normalise(query);
  if (!q) return true;

  const haystacks = [name, brand, ...(aliases || '').split(/[,;|]/)].filter(Boolean).map(normalise);

  return haystacks.some((h) => h.includes(q));
}

class DeviceFinder extends HTMLElement {
  connectedCallback() {
    this.searchInput = this.querySelector('[data-finder-search]');
    this.results = this.querySelector('[data-finder-results]');
    this.resultList = this.querySelector('[data-finder-result-list]');
    this.emptyMessage = this.querySelector('[data-finder-empty]');
    this.tree = this.querySelector('[data-finder-tree]');
    this.current = this.querySelector('[data-finder-current]');
    this.currentName = this.querySelector('[data-finder-current-name]');
    this.recent = this.querySelector('[data-finder-recent]');
    this.recentList = this.querySelector('[data-finder-recent-list]');

    this.models = Array.from(this.querySelectorAll('[data-model-handle]')).map((el) => ({
      el,
      handle: el.dataset.modelHandle,
      name: el.dataset.modelName,
      brand: el.dataset.modelBrand,
      aliases: el.dataset.modelAliases,
      url: el.getAttribute('href'),
    }));

    this.searchInput?.addEventListener('input', () => this.#onSearch());

    // Choosing a model saves it and follows the link, so the customer lands on relevant
    // products AND the rest of the site now knows their device.
    this.addEventListener('click', (event) => {
      const link = event.target.closest('[data-model-handle]');
      if (!link) return;
      this.#select({
        handle: link.dataset.modelHandle,
        name: link.dataset.modelName,
        brand: link.dataset.modelBrand,
        url: link.getAttribute('href'),
      });
      // The default navigation is allowed to proceed.
    });

    this.querySelector('[data-finder-clear]')?.addEventListener('click', () => {
      DeviceStore.clear();
      this.#renderCurrent(null);
      announce(window.ITA?.strings?.device?.removed ?? '');
    });

    DeviceStore.subscribe((device) => this.#renderCurrent(device));
    this.#renderCurrent(DeviceStore.get());
    this.#renderRecent();
  }

  #select(device) {
    DeviceStore.set(device);
    announce(t(window.ITA?.strings?.device?.selected, { device: device.name }));
  }

  #onSearch() {
    const query = this.searchInput.value.trim();

    if (query.length === 0) {
      this.results.hidden = true;
      this.tree.hidden = false;
      return;
    }

    const found = this.models.filter((model) => matches(query, model));

    this.results.hidden = false;
    this.tree.hidden = true;

    // Rebuild the result list from cloned nodes rather than markup strings, so nothing is ever
    // injected as HTML.
    this.resultList.replaceChildren();
    for (const model of found.slice(0, 40)) {
      const item = document.createElement('li');
      const link = model.el.cloneNode(true);
      link.classList.remove('is-selected');
      item.append(link);
      this.resultList.append(item);
    }

    this.emptyMessage.hidden = found.length > 0;
    announce(
      found.length === 0 ? (window.ITA?.strings?.device?.noModels ?? '') : `${found.length}`
    );
  }

  #renderCurrent(device) {
    if (this.current) this.current.hidden = !device;
    if (this.currentName && device) this.currentName.textContent = device.name;

    for (const model of this.models) {
      model.el.classList.toggle('is-selected', Boolean(device) && model.handle === device.handle);
    }
  }

  #renderRecent() {
    const recent = DeviceStore.recent();
    if (!this.recent || recent.length === 0) return;

    this.recentList.replaceChildren();
    for (const device of recent) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'chip';
      link.href = device.url || '#';
      link.textContent = device.name;
      link.dataset.modelHandle = device.handle;
      link.dataset.modelName = device.name;
      if (device.brand) link.dataset.modelBrand = device.brand;
      item.append(link);
      this.recentList.append(item);
    }

    this.recent.hidden = false;
  }
}

if (!customElements.get('device-finder')) customElements.define('device-finder', DeviceFinder);
