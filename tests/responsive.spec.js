import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const harness = (file) => pathToFileURL(resolve(root, 'tests', 'harness', file)).href;

/**
 * Breakpoints from the brief. These are real device widths, not round numbers:
 *  360 — small Android
 *  390 — iPhone 14/15/16
 *  430 — iPhone Pro Max
 *  768 — tablet portrait
 * 1024 — tablet landscape / small laptop
 * 1280 — laptop
 * 1440 — desktop (the theme's max content width)
 * 1920 — large desktop
 */
const BREAKPOINTS = [360, 390, 430, 768, 1024, 1280, 1440, 1920];

const PAGES = ['grid.html', 'components.html'];

for (const file of PAGES) {
  for (const width of BREAKPOINTS) {
    test(`${file} @ ${width}px — no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(harness(file));

      // The single most common responsive defect, and the easiest to assert precisely.
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      expect(
        overflow.scrollWidth,
        `Document scrolls horizontally at ${width}px (${overflow.scrollWidth} > ${overflow.clientWidth})`
      ).toBeLessThanOrEqual(overflow.clientWidth + 1); // +1 absorbs sub-pixel rounding

      // Any individual element wider than the viewport is a layout bug even when the document
      // itself does not scroll (it may be clipped, which hides content).
      const wideElements = await page.evaluate((vw) => {
        const offenders = [];
        for (const el of document.querySelectorAll('main *')) {
          const rect = el.getBoundingClientRect();
          if (rect.width > vw + 1 && rect.height > 0) {
            const style = getComputedStyle(el);
            // Elements that scroll their own overflow are behaving correctly by design.
            if (style.overflowX === 'auto' || style.overflowX === 'scroll') continue;
            if (el.closest('.scroll-x')) continue;
            offenders.push(`${el.tagName.toLowerCase()}.${el.className}`.slice(0, 90));
          }
        }
        return offenders.slice(0, 5);
      }, width);

      expect(wideElements, `Elements exceed viewport at ${width}px`).toEqual([]);
    });
  }
}

test('product grid uses 2 columns on mobile, 4 on desktop', async ({ page }) => {
  await page.goto(harness('grid.html'));

  await page.setViewportSize({ width: 390, height: 900 });
  const mobileColumns = await page.evaluate(
    () =>
      getComputedStyle(document.querySelector('.grid--products')).gridTemplateColumns.split(' ')
        .length
  );
  expect(mobileColumns, 'mobile should be 2 columns').toBe(2);

  await page.setViewportSize({ width: 768, height: 900 });
  const tabletColumns = await page.evaluate(
    () =>
      getComputedStyle(document.querySelector('.grid--products')).gridTemplateColumns.split(' ')
        .length
  );
  expect(tabletColumns, 'tablet should be 3 columns').toBe(3);

  await page.setViewportSize({ width: 1280, height: 900 });
  const desktopColumns = await page.evaluate(
    () =>
      getComputedStyle(document.querySelector('.grid--products')).gridTemplateColumns.split(' ')
        .length
  );
  expect(desktopColumns, 'desktop should be 4 columns').toBe(4);
});

test('long Italian device names are not truncated in the compatibility line', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto(harness('grid.html'));

  // Italian runs 15-25% longer than English, and a half-rendered model number is worse than
  // none at all. The compatibility text must wrap, never clip.
  const clipped = await page.evaluate(() => {
    const offenders = [];
    for (const el of document.querySelectorAll('.compat__state span:last-child')) {
      const style = getComputedStyle(el);
      if (style.textOverflow === 'ellipsis' || style.whiteSpace === 'nowrap') {
        offenders.push(el.textContent.trim().slice(0, 60));
      }
      if (el.scrollWidth > el.clientWidth + 1)
        offenders.push(`clipped: ${el.textContent.trim().slice(0, 60)}`);
    }
    return offenders;
  });

  expect(clipped, 'compatibility text must wrap, not clip').toEqual([]);
});

test('interactive targets meet the 44px minimum', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(harness('components.html'));

  const tooSmall = await page.evaluate(() => {
    const offenders = [];
    const selector = 'button, a[href], input:not([type="hidden"]), select, summary';
    for (const el of document.querySelectorAll(`main ${selector}`)) {
      // A checkbox or radio wrapped in a label is activated by clicking the label, so the
      // label is the real target. Measuring the 18px native control would be wrong.
      const wrappingLabel = el.closest('label');
      const target =
        wrappingLabel && (el.type === 'checkbox' || el.type === 'radio') ? wrappingLabel : el;

      const rect = target.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      if (rect.height < 43) {
        offenders.push(
          `${el.tagName.toLowerCase()}.${el.className}`.slice(0, 80) +
            ` h=${Math.round(rect.height)}`
        );
      }
    }
    return offenders.slice(0, 8);
  });

  expect(tooSmall, 'interactive targets below 44px high').toEqual([]);
});
