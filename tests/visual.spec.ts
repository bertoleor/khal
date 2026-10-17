import { expect, test, waitForPageReady } from './fixtures/visual';

/**
 * [ORN-205] Visual baseline suite — pixel-diff via toHaveScreenshot().
 *
 * Canonical pages come from design-system/khal/CONTRASTE.md (UUPM-204 output:
 * tokens reales vs catálogo). This file is the SKELETON stage of the pilot:
 * home only — the card's guaranteed minimum — while CONTRASTE.md lands; every
 * additional canonical page extends this file with its own key locator.
 *
 * Per-test contract (skill pixel-perfect, Workflow E):
 *   1. key locator waitFor() — proves the route rendered real content
 *   2. waitForPageReady(page) — fonts + images + GSAP freeze
 *   3. toHaveScreenshot() — NEVER before 1 and 2.
 */

test('home /es — catálogo de servicios', async ({ page }) => {
  await page.goto('/es');
  // 'Nuestros servicios' is the storefront's primary landmark — the same
  // anchor the booking happy path asserts on.
  await page.getByRole('heading', { name: 'Nuestros servicios' }).waitFor();
  await waitForPageReady(page);
  await expect(page).toHaveScreenshot('home-es.png', { fullPage: true });
});
