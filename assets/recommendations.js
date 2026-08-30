/**
 * Italian Tech Atelier — product recommendations.
 *
 * Loads only when the section approaches the viewport. Recommendations sit well below the fold
 * on a product page, so fetching them on load would spend request budget and main-thread time
 * that the add-to-cart path needs first.
 */

class ProductRecommendations extends HTMLElement {
  connectedCallback() {
    const url = this.dataset.url;
    if (!url) return;

    if (!('IntersectionObserver' in window)) {
      this.#load(url);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        this.#load(url);
      },
      // Start a little early so the row is populated by the time it is actually seen.
      { rootMargin: '400px' }
    );

    observer.observe(this);
  }

  async #load(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(String(response.status));

      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const next = doc.querySelector('product-recommendations');
      if (!next) return;

      // No recommendations is a valid outcome. Render nothing rather than an empty heading.
      if (next.children.length === 0) return;

      this.replaceChildren(...next.children);
    } catch {
      /* Recommendations are supplementary; a failure must never disturb the page. */
    }
  }
}

if (!customElements.get('product-recommendations')) {
  customElements.define('product-recommendations', ProductRecommendations);
}
