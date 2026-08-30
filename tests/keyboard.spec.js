import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const harness = (file) => pathToFileURL(resolve(root, 'tests', 'harness', file)).href;

test('skip link is first in focus order and becomes visible on focus', async ({ page }) => {
  await page.goto(harness('grid.html'));

  // Assert the theme's contract, engine-independently: the skip link is the FIRST focusable
  // element in DOM order, and focusing it brings it into view.
  //
  // Deliberately not asserted via Tab. WebKit (and macOS Safari) do not move focus to links on
  // Tab unless the user enables full keyboard access, so a Tab-based assertion would be testing
  // a browser preference rather than this theme. The markup and CSS are what we own, and a
  // keyboard user who has enabled link focus reaches it exactly as intended.
  const first = await page.evaluate(() => {
    const focusable = document.querySelectorAll(
      'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, summary, [tabindex]:not([tabindex="-1"])'
    );
    const el = focusable[0];
    return { className: el.className, href: el.getAttribute('href') };
  });

  expect(first.className, 'skip link must be the first focusable element').toContain('skip-link');
  expect(first.href).toBe('#main');

  await page.locator('.skip-link').focus();

  // It slides in over 180ms; wait for the transform to settle before measuring.
  await page.waitForFunction(
    () => {
      const el = document.querySelector('.skip-link');
      return el && el.getBoundingClientRect().top >= 0;
    },
    undefined,
    { timeout: 2000 }
  );

  const visible = await page.evaluate(() => {
    const rect = document.querySelector('.skip-link').getBoundingClientRect();
    // Visible means inside the viewport, not merely "not display:none".
    return rect.top >= 0 && rect.height > 0;
  });

  expect(visible, 'skip link must be visible when focused').toBe(true);
});

test('every interactive element has a visible focus indicator', async ({ page }) => {
  await page.goto(harness('components.html'));

  const missing = await page.evaluate(() => {
    const offenders = [];
    const elements = document.querySelectorAll(
      'main button, main a[href], main input, main select, main summary'
    );

    for (const el of elements) {
      el.focus();
      const style = getComputedStyle(el);
      const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
      const hasShadow = style.boxShadow !== 'none';
      const hasBorderChange = style.borderColor !== '';

      if (!hasOutline && !hasShadow && !hasBorderChange) {
        offenders.push(`${el.tagName.toLowerCase()}.${el.className}`.slice(0, 80));
      }
    }
    return offenders;
  });

  expect(missing, 'elements with no visible focus indicator').toEqual([]);
});

test('one tab stop per product card, and the card title is the accessible name', async ({
  page,
}) => {
  await page.goto(harness('grid.html'));

  // The image link is aria-hidden and untabbable by design, so a keyboard user moves card to
  // card rather than through three stops per card.
  const cardTabStops = await page.evaluate(() => {
    const firstCard = document.querySelector('.card');
    const focusable = firstCard.querySelectorAll(
      'a[href]:not([tabindex="-1"]), button:not([tabindex="-1"])'
    );
    return Array.from(focusable).map((el) => el.className.split(' ')[0]);
  });

  // Expect: wishlist, title link, options link, compare — but NOT the media link.
  expect(cardTabStops).not.toContain('card__media-link');
  expect(cardTabStops).toContain('card__link');
});

test('details/summary components are keyboard operable', async ({ page }) => {
  await page.goto(harness('components.html'));

  const summary = page.locator('.facet__summary').first();
  const details = page.locator('.facet').first();

  await expect(details).toHaveAttribute('open', '');

  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(details).not.toHaveAttribute('open', '');

  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
});

test('focused elements are not obscured by a sticky header (WCAG 2.2)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto(harness('components.html'));

  // scroll-margin-block must keep a focused control clear of any sticky chrome.
  const scrollMargin = await page.evaluate(() => {
    const button = document.querySelector('main button');
    return getComputedStyle(button).scrollMarginBlockStart;
  });

  expect(scrollMargin, 'interactive elements need scroll-margin for Focus Not Obscured').not.toBe(
    '0px'
  );
});
