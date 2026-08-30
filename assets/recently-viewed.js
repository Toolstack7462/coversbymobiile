/**
 * Italian Tech Atelier — recently viewed.
 *
 * PRIVACY: the list of viewed products never leaves the customer's browser except as product
 * ids in a request for markup. Nothing is stored server-side, nothing is sent to a third party,
 * and nothing is tied to an identity. It is per-browser and the UI says so.
 *
 * The cards are rendered by Shopify (search endpoint + section id) rather than built in JS, so
 * prices, stock and compatibility badges are always the server's version.
 */

const KEY = 'ita.recently-viewed';
const MAX = 12;

function read() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((id) => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* Storage unavailable (private mode, blocked site data). Feature degrades to nothing. */
  }
}

/** Records the current product, most recent first, without duplicates. */
function record() {
  const container = document.querySelector('[data-product-id]');
  const id = Number(container?.dataset.productId);
  if (!id) return;

  const list = read().filter((existing) => existing !== id);
  list.unshift(id);
  write(list);
}

async function render() {
  const section = document.querySelector('[data-recently-viewed]');
  const target = document.querySelector('[data-recently-viewed-target]');
  if (!section || !target) return;

  const currentId = Number(document.querySelector('[data-product-id]')?.dataset.productId);
  // Never show the product the customer is already looking at.
  const ids = read().filter((id) => id !== currentId);
  if (ids.length === 0) return;

  const query = ids.map((id) => `id:${id}`).join(' OR ');
  const params = new URLSearchParams({
    q: query,
    type: 'product',
    section_id: 'recently-viewed',
  });

  try {
    const response = await fetch(`${window.ITA.routes.search}?${params}`);
    if (!response.ok) return;

    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
    const results = doc.querySelector('[data-recently-viewed-results]');
    if (!results || results.children.length === 0) return;

    target.replaceChildren(results);
    section.hidden = false;
  } catch {
    // A failed fetch simply means the row stays hidden. It is a convenience, not a dependency.
  }
}

record();

/* Deferred like the recommendations row: expanding a section from zero height while it is on
   screen is a layout shift. Loading it ~400px early means the box is already correct by the
   time the customer scrolls to it. */
const section = document.querySelector('[data-recently-viewed]');
if (section && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      render();
    },
    { rootMargin: '400px' }
  );
  observer.observe(section);
} else {
  render();
}
