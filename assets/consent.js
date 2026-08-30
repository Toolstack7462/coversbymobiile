/**
 * Italian Tech Atelier — cookie consent.
 *
 * Wraps Shopify's Customer Privacy API. Nothing non-essential runs before the customer decides,
 * and the theme never injects a tracking script of its own — analytics belong in Shopify
 * Customer Events (web pixels), which are consent-aware by design.
 *
 * Rejecting is exactly as easy as accepting: one click, same prominence. That is a legal
 * requirement under GDPR/ePrivacy as applied in Italy, and simply the right way to behave.
 */

import { announce } from './a11y.js';

const FEATURE = { name: 'consent-tracking-api', version: '0.1' };

class ConsentBanner extends HTMLElement {
  connectedCallback() {
    this.panel = this.querySelector('[data-consent-panel]');
    this.preferences = this.querySelector('[data-consent-preferences]');
    this.saveButton = this.querySelector('[data-consent-save]');
    this.customiseButton = this.querySelector('[data-consent-customise]');

    this.querySelector('[data-consent-accept]')?.addEventListener('click', () =>
      this.#apply({ analytics: true, marketing: true, preferences: true })
    );

    this.querySelector('[data-consent-reject]')?.addEventListener('click', () =>
      this.#apply({ analytics: false, marketing: false, preferences: false })
    );

    this.customiseButton?.addEventListener('click', () => this.#showPreferences());

    this.saveButton?.addEventListener('click', () => {
      const read = (name) =>
        this.querySelector(`[data-consent-category="${name}"]`)?.checked ?? false;
      this.#apply({
        analytics: read('analytics'),
        marketing: read('marketing'),
        preferences: read('preferences'),
      });
    });

    // The footer link lets a customer change their mind at any time, which is required.
    for (const trigger of document.querySelectorAll('[data-consent-reopen]')) {
      trigger.addEventListener('click', () => {
        this.hidden = false;
        this.#showPreferences();
        this.#hydrateFromCurrent();
      });
    }

    this.#init();
  }

  #init() {
    // loadFeatures is how Shopify exposes the privacy API to a theme.
    if (!window.Shopify?.loadFeatures) return;

    window.Shopify.loadFeatures([FEATURE], (error) => {
      if (error) return; // Without the API we show nothing rather than a banner that cannot save.

      const api = window.Shopify.customerPrivacy;
      // shouldShowBanner() is false once a decision has been recorded, and in regions where
      // prior consent is not required.
      if (api?.shouldShowBanner?.()) {
        this.hidden = false;
      }
      this.#hydrateFromCurrent();
    });
  }

  #hydrateFromCurrent() {
    const current = window.Shopify?.customerPrivacy?.currentVisitorConsent?.();
    if (!current) return;
    const set = (name, value) => {
      const input = this.querySelector(`[data-consent-category="${name}"]`);
      if (input) input.checked = value === 'yes';
    };
    set('analytics', current.analytics);
    set('marketing', current.marketing);
    set('preferences', current.preferences);
  }

  #showPreferences() {
    if (this.preferences) this.preferences.hidden = false;
    if (this.saveButton) this.saveButton.hidden = false;
    if (this.customiseButton) this.customiseButton.hidden = true;
    this.preferences?.querySelector('input')?.focus();
  }

  #apply(consent) {
    const api = window.Shopify?.customerPrivacy;
    if (!api?.setTrackingConsent) {
      this.hidden = true;
      return;
    }

    api.setTrackingConsent(
      {
        analytics: consent.analytics,
        marketing: consent.marketing,
        preferences: consent.preferences,
        // Italy applies GDPR rather than a US-style sale-of-data regime, but the API expects
        // the field; it is tied to the marketing choice so it can never be broader than it.
        sale_of_data: consent.marketing,
      },
      () => {
        this.hidden = true;
        announce(window.ITA?.strings?.consent?.saved ?? '');
        document.dispatchEvent(new CustomEvent('ita:consent-change', { detail: consent }));
      }
    );
  }
}

if (!customElements.get('consent-banner')) {
  customElements.define('consent-banner', ConsentBanner);
}
