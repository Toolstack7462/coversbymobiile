/**
 * Italian Tech Atelier — filtering, sorting and load-more.
 *
 * Enhancement only. The underlying markup is a GET form and real pagination links, so with this
 * file absent the customer can still filter, sort and page through results.
 *
 * URL IS THE STATE. Every interaction updates the address bar via history.pushState, so:
 * back and forward work, a filtered view can be shared or bookmarked, and a refresh keeps the
 * customer where they were. That is a hard requirement, not a nicety.
 */

import { announce, trapFocus, releaseFocus } from './a11y.js';

const SECTION_SELECTOR = '[data-collection-results]';
const DEBOUNCE_MS = 350;

/** Fetches a URL and swaps in the freshly rendered results and filters. */
async function render(url, { append = false } = {}) {
  const results = document.querySelector(SECTION_SELECTOR);
  results?.setAttribute('aria-busy', 'true');

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(String(response.status));

    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');

    const nextResults = doc.querySelector(SECTION_SELECTOR);
    const currentGrid = document.querySelector('[data-product-grid]');
    const nextGrid = doc.querySelector('[data-product-grid]');

    if (append && currentGrid && nextGrid) {
      // Load more: keep what is on screen and append the next page, so the customer never
      // loses their scroll position or their place in the list.
      currentGrid.append(...nextGrid.children);
      const currentPagination = document.querySelector('.pagination');
      const nextPagination = doc.querySelector('.pagination');
      if (currentPagination && nextPagination) currentPagination.replaceWith(nextPagination);
      else currentPagination?.remove();
    } else if (nextResults && results) {
      results.replaceWith(nextResults);
    }

    // Filters must be re-rendered too: applying one filter changes the counts and availability
    // of every other one.
    const currentFacets = document.querySelector('[data-facets-form]');
    const nextFacets = doc.querySelector('[data-facets-form]');
    if (currentFacets && nextFacets) currentFacets.replaceWith(nextFacets);

    const count = doc.querySelector('.collection__count');
    const currentCount = document.querySelector('.collection__count');
    if (count && currentCount) {
      currentCount.textContent = count.textContent;
      announce(count.textContent.trim());
    }

    bind();
  } catch {
    announce(window.ITA?.strings?.general?.networkError ?? '');
  } finally {
    document.querySelector(SECTION_SELECTOR)?.removeAttribute('aria-busy');
  }
}

function navigate(url, options) {
  history.pushState({ facets: true }, '', url);
  return render(url, options);
}

/** Builds a URL from the current state of the filter form. */
function urlFromForm(form) {
  const params = new URLSearchParams(new FormData(form));
  // Drop empty values so the URL stays readable and shareable.
  for (const [key, value] of [...params.entries()]) {
    if (value === '') params.delete(key);
  }
  return `${form.action}?${params}`;
}

let debounceTimer;

function bind() {
  const form = document.querySelector('[data-facets-form]');
  if (form) {
    // With JS available the form applies on change, so the submit button is redundant —
    // but it stays in the DOM for the no-JS path and is only hidden here.
    const submit = form.querySelector('[data-facets-submit]');
    if (submit) submit.hidden = true;

    form.addEventListener('change', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => navigate(urlFromForm(form)), DEBOUNCE_MS);
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      navigate(urlFromForm(form));
    });
  }

  const sort = document.querySelector('[data-sort-select]');
  // The sort select lives in the toolbar, OUTSIDE the replaced region, so it survives every
  // render. Without this guard bind() would stack a listener on it each time.
  if (sort && sort.dataset.bound !== 'true') {
    sort.dataset.bound = 'true';
    sort.addEventListener('change', () => {
      const url = new URL(window.location.href);
      url.searchParams.set('sort_by', sort.value);
      // A new sort order invalidates the current page number.
      url.searchParams.delete('page');
      navigate(url.toString());
    });
  }

  const loadMore = document.querySelector('[data-load-more]');
  if (loadMore) {
    loadMore.addEventListener('click', () => {
      const next = loadMore.dataset.nextUrl;
      if (!next) return;
      loadMore.setAttribute('aria-busy', 'true');
      loadMore.disabled = true;
      navigate(next, { append: true });
    });
  }

  bindDrawer();
}

/* ── Mobile filter drawer ─────────────────────────────────────────────── */

function bindDrawer() {
  const toggle = document.querySelector('[data-facets-open]');
  const sidebar = document.getElementById('collection-filters');
  if (!toggle || !sidebar) return;

  if (toggle.dataset.bound === 'true') return;
  toggle.dataset.bound = 'true';

  const close = () => {
    sidebar.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
    releaseFocus(sidebar);
  };

  toggle.addEventListener('click', () => {
    sidebar.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
    trapFocus(sidebar);
  });

  sidebar.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  // Applying filters on mobile should return the customer to the results.
  sidebar.addEventListener('click', (event) => {
    if (event.target.closest('[data-facets-submit]')) close();
  });
}

// Back and forward must re-render, not just change the address bar.
window.addEventListener('popstate', () => render(window.location.href));

bind();
