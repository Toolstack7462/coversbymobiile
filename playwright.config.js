import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright runs against the static harness built by tests/build-harness.mjs, which compiles
 * the theme's real CSS. There is no dev server: the harness is plain files, loaded over file://.
 *
 * SCOPE: these tests cover component CSS, responsive layout, overflow, keyboard operation and
 * axe violations. They do NOT cover Liquid rendering, cart, search, filters, pickup or checkout
 * — those require an authenticated store and are covered by the merchant verification script in
 * docs/launch-checklist.md.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',

  globalSetup: './tests/global-setup.mjs',

  use: {
    // Italian locale so number and date formatting matches the storefront's default market.
    locale: 'it-IT',
    timezoneId: 'Europe/Rome',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },

    /**
     * Firefox and WebKit matter here for specific reasons, not for completeness:
     * - WebKit is the only engine iOS Safari can use, and mobile Safari is a large share of
     *   Italian retail traffic. It is also the engine most likely to differ on `:has()`,
     *   `aspect-ratio` and scroll-snap, all of which this theme relies on.
     * - Firefox renders `<progress>` (the free-shipping bar) and `appearance` differently.
     *
     * axe runs Chromium-only: it is engine-independent for the rules we assert, and running it
     * three times triples the suite for no additional signal.
     */
    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: '**/a11y.spec.js',
    },
    {
      name: 'desktop-safari',
      use: { ...devices['Desktop Safari'] },
      testIgnore: '**/a11y.spec.js',
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
      testIgnore: ['**/a11y.spec.js', '**/keyboard.spec.js'],
    },
  ],
});
