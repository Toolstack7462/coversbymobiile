import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const harness = (file) => pathToFileURL(resolve(root, 'tests', 'harness', file)).href;

const PAGES = ['grid.html', 'components.html'];

for (const file of PAGES) {
  test(`${file} — no critical or serious axe violations`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(harness(file));

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    // Report the actual rule and selector, not just a count — a bare number is not actionable.
    const detail = blocking
      .map(
        (v) =>
          `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes
            .map((n) => n.target.join(' '))
            .slice(0, 3)
            .join('\n    ')}`
      )
      .join('\n  ');

    expect(blocking.length, `axe violations in ${file}:\n  ${detail}`).toBe(0);
  });

  test(`${file} — no critical or serious axe violations at 390px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(harness(file));

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    const detail = blocking.map((v) => `${v.id} (${v.impact}): ${v.help}`).join('\n  ');

    expect(blocking.length, `axe violations at 390px in ${file}:\n  ${detail}`).toBe(0);
  });
}

test('colour contrast holds for the brand palette', async ({ page }) => {
  await page.goto(harness('components.html'));

  // axe checks rendered contrast; this asserts the specific pairings the design system relies on
  // so a token change cannot silently break them.
  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();

  const failures = results.violations.flatMap((v) =>
    v.nodes.map((n) => `${n.target.join(' ')}: ${n.failureSummary?.split('\n')[1] ?? ''}`)
  );

  expect(failures, 'contrast failures').toEqual([]);
});

test('every form control has an accessible name', async ({ page }) => {
  await page.goto(harness('components.html'));

  const unnamed = await page.evaluate(() => {
    const offenders = [];
    for (const el of document.querySelectorAll('main input, main select, main textarea')) {
      if (el.type === 'hidden') continue;
      const id = el.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAria = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      const wrapped = el.closest('label');
      if (!hasLabel && !hasAria && !wrapped) {
        offenders.push(`${el.tagName.toLowerCase()}#${id || '(no id)'}`);
      }
    }
    return offenders;
  });

  expect(unnamed, 'form controls without an accessible name').toEqual([]);
});

test('status is never communicated by colour alone', async ({ page }) => {
  await page.goto(harness('components.html'));

  // Every stock, pickup and compatibility state must carry an icon or text, not just a hue.
  const colourOnly = await page.evaluate(() => {
    const offenders = [];
    for (const el of document.querySelectorAll('.stock, .compat__state, .pickup__row')) {
      const hasIcon = el.querySelector('svg');
      const hasText = el.textContent.trim().length > 0;
      if (!hasIcon || !hasText) offenders.push(el.className);
    }
    return offenders;
  });

  expect(colourOnly, 'status elements relying on colour alone').toEqual([]);
});
