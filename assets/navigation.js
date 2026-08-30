/**
 * Italian Tech Atelier — navigation enhancements.
 *
 * The mega menu is native <details>/<summary>, so it is already keyboard operable, announces its
 * expanded state and works with this file absent. Everything here is an addition on top:
 * Escape to close, click-outside to close, and only one menu open at a time.
 *
 * The mobile drawer needs real focus management, which is what most of this file is.
 */

import { trapFocus, releaseFocus } from './a11y.js';
import './predictive-search.js';

/* ── Mega menu ────────────────────────────────────────────────────────── */

const megas = () => Array.from(document.querySelectorAll('[data-mega]'));

function closeMegas(except) {
  for (const details of megas()) {
    if (details !== except) details.open = false;
  }
}

document.addEventListener('click', (event) => {
  const openMega = megas().find((d) => d.open);
  if (!openMega) return;
  if (!openMega.contains(event.target)) closeMegas();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openMega = megas().find((d) => d.open);
  if (!openMega) return;
  openMega.open = false;
  // Focus must return to the control that opened the panel, not vanish to the body.
  openMega.querySelector('summary')?.focus();
});

for (const details of megas()) {
  details.addEventListener('toggle', () => {
    if (details.open) closeMegas(details);
  });
}

/* ── Mobile menu drawer ───────────────────────────────────────────────── */

class MobileMenu extends HTMLElement {
  connectedCallback() {
    this.panel = this.querySelector('[data-menu-panel]');
    this.closeButton = this.querySelector('[data-menu-close]');
    this.toggles = Array.from(document.querySelectorAll('[data-menu-toggle]'));

    for (const toggle of this.toggles) {
      toggle.addEventListener('click', () => this.open());
    }

    this.closeButton?.addEventListener('click', () => this.close());

    this.addEventListener('click', (event) => {
      // Clicking the scrim (the element itself, not the panel) closes.
      if (event.target === this) this.close();
    });

    this.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.close();
    });
  }

  open() {
    this.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    for (const toggle of this.toggles) toggle.setAttribute('aria-expanded', 'true');
    trapFocus(this, this.closeButton);
  }

  close() {
    releaseFocus(this);
    this.hidden = true;
    document.documentElement.style.overflow = '';
    for (const toggle of this.toggles) toggle.setAttribute('aria-expanded', 'false');
  }
}

if (!customElements.get('mobile-menu')) customElements.define('mobile-menu', MobileMenu);
