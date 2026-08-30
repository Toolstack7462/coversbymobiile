/**
 * Italian Tech Atelier — device context.
 *
 * Holds the customer's selected device and resolves product compatibility against it.
 *
 * WHY CLIENT-SIDE: Shopify serves fully cached pages. Resolving the selected device on the
 * server would bake one visitor's device into HTML served to the next. The server therefore
 * emits compatibility facts as data attributes and this module resolves them per-visitor.
 *
 * Guest-only by design. There is no cross-device account sync and the UI never claims one.
 */

const STORAGE_KEY = 'ita.device';
const RECENT_KEY = 'ita.device.recent';
const RECENT_LIMIT = 4;

/* ── Storage ──────────────────────────────────────────────────────────────
   Private browsing, disabled site data and quota errors all throw. Every
   access is guarded so a storage failure degrades to "no device selected"
   rather than breaking the page. */

const storage = {
  read(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* nothing we can do, and nothing that should break the page */
    }
  },
};

/* ── Device store ─────────────────────────────────────────────────────── */

const listeners = new Set();

/** Notifies subscribers and the document that the selected device changed. */
function emitDeviceChange() {
  const device = DeviceStore.get();
  for (const fn of listeners) fn(device);
  document.dispatchEvent(new CustomEvent('ita:device-change', { detail: { device } }));
}

/** Keeps a short most-recent-first list of chosen devices, without duplicates. */
function rememberDevice(device) {
  const list = DeviceStore.recent().filter((d) => d.handle !== device.handle);
  list.unshift(device);
  storage.write(RECENT_KEY, list.slice(0, RECENT_LIMIT));
}

export const DeviceStore = {
  /** @returns {{handle:string,name:string,brand?:string,url?:string}|null} */
  get() {
    const device = storage.read(STORAGE_KEY);
    return device && typeof device.handle === 'string' && typeof device.name === 'string'
      ? device
      : null;
  },

  set(device) {
    if (!device || !device.handle || !device.name) return;
    storage.write(STORAGE_KEY, device);
    rememberDevice(device);
    emitDeviceChange();
  },

  clear() {
    storage.remove(STORAGE_KEY);
    emitDeviceChange();
  },

  recent() {
    const list = storage.read(RECENT_KEY);
    return Array.isArray(list) ? list : [];
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

// Keep tabs in sync — a device chosen in one tab should not contradict another.
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) emitDeviceChange();
});

/* ── Compatibility resolution ─────────────────────────────────────────────
   This mirrors the table in CLAUDE.md section 6 exactly. Any change here is a
   change to what the store claims about fit, so treat it as commercial copy,
   not as plumbing. */

/**
 * @param {string} level - exact_fit | compatible | universal | adapter_required | unknown
 * @param {string[]} devices - device-model handles this product is listed against
 * @param {string|null} selected - the customer's selected device handle
 * @returns {'exact'|'compatible'|'universal'|'adapter'|'mismatch'|'prompt'}
 */
export function resolveCompatibility(level, devices, selected) {
  // A universal accessory is universal regardless of what else is set. It must NEVER be
  // presented as an exact fit for the selected device.
  if (level === 'universal') return 'universal';

  if (!selected) return 'prompt';

  if (devices.includes(selected)) {
    if (level === 'exact_fit') return 'exact';
    if (level === 'adapter_required') return 'adapter';
    // Listed as compatible, or listed with no explicit level: claim the weaker, true thing.
    return 'compatible';
  }

  // Listed against specific devices, and the selected one is not among them.
  if (devices.length > 0) return 'mismatch';

  // A level was set but no devices were listed. That is incomplete data — say nothing
  // rather than invent a claim.
  return 'prompt';
}

/* ── <compat-badge> ───────────────────────────────────────────────────── */

const ICONS = {
  exact: 'shield-check',
  compatible: 'check-circle',
  universal: 'info',
  adapter: 'alert-circle',
  mismatch: 'alert-triangle',
  prompt: 'device',
};

class CompatBadge extends HTMLElement {
  #unsubscribe;

  connectedCallback() {
    this.stateEl = this.querySelector('[data-compat-state]');
    this.textEl = this.querySelector('[data-compat-text]');
    this.actionEl = this.querySelector('[data-compat-action]');
    if (!this.stateEl || !this.textEl) return;

    this.level = this.dataset.level || 'unknown';
    this.devices = (this.dataset.devices || '').split(',').filter(Boolean);
    this.isPanel = this.classList.contains('compat--panel');

    this.render(DeviceStore.get());
    this.#unsubscribe = DeviceStore.subscribe((device) => this.render(device));
  }

  disconnectedCallback() {
    this.#unsubscribe?.();
  }

  render(device) {
    const state = resolveCompatibility(this.level, this.devices, device?.handle ?? null);
    const strings = window.ITA?.strings?.compat ?? {};
    const name = device?.name ?? '';

    // On a product card, a "choose your device" prompt in every grid cell is noise.
    if (state === 'prompt' && !this.isPanel) {
      this.stateEl.hidden = true;
      return;
    }
    this.stateEl.hidden = false;

    let text;
    switch (state) {
      case 'exact':
        text = this.isPanel ? strings.exact : strings.exact_short;
        break;
      case 'compatible':
        text = strings.compatible;
        break;
      case 'universal':
        text = this.isPanel ? strings.universal : strings.universal_short;
        break;
      case 'adapter':
        text = strings.adapter;
        break;
      case 'mismatch':
        text = strings.mismatch;
        break;
      default:
        text = strings.select_device_prompt;
    }

    // textContent, never innerHTML — device names come from merchant data.
    this.textEl.textContent = (text || '').replace('{{ device }}', name);

    this.stateEl.className = `compat__state compat__state--${state}`;
    this.#swapIcon(state);

    // A mismatch warns and offers a route out. It never blocks the purchase — the customer
    // may well be buying for someone else.
    if (this.actionEl) {
      if (state === 'mismatch' && device?.url) {
        this.actionEl.hidden = false;
        this.actionEl.href = device.url;
      } else {
        this.actionEl.hidden = true;
      }
    }

    this.dataset.state = state;
  }

  #swapIcon(state) {
    const icon = this.stateEl.querySelector('svg');
    const template = document.getElementById(`ita-icon-${ICONS[state]}`);
    if (icon && template) {
      const next = template.content.firstElementChild.cloneNode(true);
      next.setAttribute('class', icon.getAttribute('class') || 'icon');
      icon.replaceWith(next);
    }
  }
}

/* ── <device-chip> ────────────────────────────────────────────────────────
   The persistent "Il mio dispositivo: iPhone 16 Pro" control. Rendered empty
   by the server and filled in here, so it never ships a stale device in
   cached HTML. */

class DeviceChip extends HTMLElement {
  #unsubscribe;

  connectedCallback() {
    this.nameEl = this.querySelector('[data-device-name]');
    this.emptyEl = this.querySelector('[data-device-empty]');
    this.activeEl = this.querySelector('[data-device-active]');
    this.removeEl = this.querySelector('[data-device-remove]');

    this.removeEl?.addEventListener('click', (event) => {
      event.preventDefault();
      DeviceStore.clear();
      this.#announce(window.ITA?.strings?.device?.removed);
    });

    this.render(DeviceStore.get());
    this.#unsubscribe = DeviceStore.subscribe((device) => this.render(device));
  }

  disconnectedCallback() {
    this.#unsubscribe?.();
  }

  render(device) {
    const hasDevice = Boolean(device);
    if (this.emptyEl) this.emptyEl.hidden = hasDevice;
    if (this.activeEl) this.activeEl.hidden = !hasDevice;
    if (this.nameEl && device) this.nameEl.textContent = device.name;
  }

  #announce(message) {
    if (!message) return;
    const region = document.getElementById('ita-live-region');
    if (region) region.textContent = message;
  }
}

if (!customElements.get('compat-badge')) customElements.define('compat-badge', CompatBadge);
if (!customElements.get('device-chip')) customElements.define('device-chip', DeviceChip);
