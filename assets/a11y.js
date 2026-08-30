/**
 * Italian Tech Atelier — shared accessibility helpers.
 *
 * Small and shared on purpose: focus management is easy to get subtly wrong, and three
 * near-identical copies in the drawer, dialog and menu is how it drifts.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Elements that are actually visible and therefore actually focusable. */
export function focusableWithin(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement
  );
}

const traps = new WeakMap();

/**
 * Traps focus inside a container and remembers where focus came from.
 * Siblings are marked `inert` so screen readers cannot wander out of an open dialog.
 */
export function trapFocus(container, initialFocus) {
  const previous = document.activeElement;

  const onKeydown = (event) => {
    if (event.key !== 'Tab') return;
    const items = focusableWithin(container);
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  container.addEventListener('keydown', onKeydown);

  const siblings = Array.from(document.body.children).filter(
    (el) => el !== container && !el.contains(container) && !el.hasAttribute('inert')
  );
  for (const el of siblings) el.setAttribute('inert', '');

  traps.set(container, { previous, onKeydown, siblings });

  const target = initialFocus || focusableWithin(container)[0] || container;
  // Wait a frame so the element is painted before focusing, otherwise Safari drops it.
  requestAnimationFrame(() => target.focus());
}

/** Releases a trap and returns focus to whatever opened it. */
export function releaseFocus(container) {
  const trap = traps.get(container);
  if (!trap) return;

  container.removeEventListener('keydown', trap.onKeydown);
  for (const el of trap.siblings) el.removeAttribute('inert');
  traps.delete(container);

  // Returning focus to the trigger is what makes a drawer usable by keyboard. Without it the
  // user is dumped at the top of the document.
  if (trap.previous && document.contains(trap.previous)) trap.previous.focus();
}

/** Announces a message through the single shared polite live region. */
export function announce(message) {
  if (!message) return;
  const region = document.getElementById('ita-live-region');
  if (!region) return;
  // Clearing first forces assistive tech to re-announce an identical consecutive message.
  region.textContent = '';
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

/** Interpolates `{{ name }}` placeholders in a translated string. */
export function t(template, values = {}) {
  if (!template) return '';
  return Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`{{ ${key} }}`, String(value)),
    template
  );
}
