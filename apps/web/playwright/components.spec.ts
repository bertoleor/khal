import { test, expect } from '@playwright/test';

/**
 * Component Visual Regression Tests (E7)
 * Tests individual components in isolation
 */

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 100 },
  { name: 'tablet', width: 768, height: 100 },
  { name: 'desktop', width: 1440, height: 100 },
];

test.describe('Header Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  for (const viewport of VIEWPORTS) {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test(`header matches baseline - ${viewport.name}`, async ({ page }) => {
      const header = page.locator('header').first();
      await expect(header).toHaveScreenshot(`header-${viewport.name}.png`, {
        maxDiffPixels: 50,
        threshold: 0.1,
      });
    });
  }
});

test.describe('Footer Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Scroll to footer
    await page.locator('footer').first().scrollIntoViewIfNeeded();
  });

  for (const viewport of VIEWPORTS) {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test(`footer matches baseline - ${viewport.name}`, async ({ page }) => {
      const footer = page.locator('footer').first();
      await expect(footer).toHaveScreenshot(`footer-${viewport.name}.png`, {
        maxDiffPixels: 50,
        threshold: 0.1,
      });
    });
  }
});

test.describe('Breadcrumbs Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reservar');
    await page.waitForLoadState('networkidle');
  });

  for (const viewport of VIEWPORTS) {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test(`breadcrumbs matches baseline - ${viewport.name}`, async ({ page }) => {
      const breadcrumbs = page.locator('[aria-label="Breadcrumb"]').first();
      await expect(breadcrumbs).toHaveScreenshot(`breadcrumbs-${viewport.name}.png`, {
        maxDiffPixels: 30,
        threshold: 0.1,
      });
    });
  }
});
