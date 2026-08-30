/**
 * Italian Tech Atelier — consent-aware store map.
 *
 * The map is a static image until the customer asks for the interactive version. Embedding a
 * third-party map on page load would contact an external service and set third-party cookies
 * before any consent has been given, which is precisely what the consent banner exists to
 * prevent — and it would also cost a large amount of JavaScript on a page that does not need it.
 *
 * Loading is gated twice: the customer must click, AND third-party consent must not have been
 * refused. A customer who pressed "Rifiuta non necessari" does not get a third-party iframe
 * just because they later pressed a button.
 */

class StoreMap extends HTMLElement {
  connectedCallback() {
    this.preview = this.querySelector('[data-map-preview]');
    this.button = this.querySelector('[data-map-load]');
    this.embedUrl = this.dataset.embedUrl;

    if (!this.button || !this.embedUrl) return;

    this.button.addEventListener('click', () => {
      if (!this.#consentAllows()) {
        // Send them to the consent panel rather than silently doing nothing.
        document.querySelector('[data-consent-reopen]')?.click();
        return;
      }
      this.#load();
    });

    // If consent is granted later, a further click will now succeed.
    document.addEventListener('ita:consent-change', () => {});
  }

  /** True unless the customer has actively refused the relevant consent. */
  #consentAllows() {
    const api = window.Shopify?.customerPrivacy;
    if (!api?.currentVisitorConsent) return true; // No API: the click gate stands alone.
    const consent = api.currentVisitorConsent();
    // Only an explicit refusal blocks. An undecided visitor who clicks is choosing to load it.
    return consent.marketing !== 'no' && consent.analytics !== 'no';
  }

  #load() {
    // Defence in depth. The setting is now `type: url` and the attribute is escaped, but a
    // value assigned to iframe.src executes in THIS origin if it carries a javascript: scheme,
    // so the scheme is verified here too rather than trusted.
    let url;
    try {
      url = new URL(this.embedUrl, window.location.href);
    } catch {
      return;
    }
    if (url.protocol !== 'https:') return;

    const iframe = document.createElement('iframe');
    iframe.src = url.href;
    // Least privilege: the map needs no access to this origin.
    iframe.setAttribute('sandbox', 'allow-scripts allow-popups allow-forms');
    iframe.title = this.dataset.title || 'Map';
    iframe.loading = 'lazy';
    // Least-privilege: the map needs neither scripts from us nor access to our origin.
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.setAttribute('allowfullscreen', '');

    this.preview.replaceWith(iframe);
  }
}

if (!customElements.get('store-map')) customElements.define('store-map', StoreMap);
