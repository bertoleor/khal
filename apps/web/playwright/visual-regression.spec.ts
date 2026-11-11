import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests (E7)
 * 
 * Tests key pages at mobile (390px), tablet (768px), desktop (1440px)
 * Run: npx playwright test --project=mobile-chromium --project=tablet-chromium --project=desktop-chromium
 * Update baselines: npx playwright test --update-snapshots
 */

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/catalogo', name: 'catalogo' },
  { path: '/conocenos', name: 'conocenos' },
  { path: '/reservar', name: 'reservar' },
  { path: '/politicas', name: 'politicas' },
];

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const page of PAGES) {
  for (const viewport of VIEWPORTS) {
    test.describe(`${page.name} - ${viewport.name} (${viewport.width}px)`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      test(`should match visual baseline`, async ({ page: pwPage }) => {
        await pwPage.goto(page.path);
        
        // Wait for fonts and images to load
        await pwPage.waitForLoadState('networkidle');
        await pwPage.waitForTimeout(500); // Allow animations to settle
        
        // Hide dynamic elements that change (dates, timestamps, etc.)
        await pwPage.addStyleTag({
          content: `
            /* Hide dynamic content */
            [data-testid="current-date"],
            [data-testid="timestamp"],
            .animate-spin,
            .animate-pulse {
              visibility: hidden !important;
            }
            /* Disable animations for consistent screenshots */
            *,
            *::before,
            *::after {
              animation-duration: 0s !important;
              animation-delay: 0s !important;
              transition-duration: 0s !important;
              transition-delay: 0s !important;
            }
          `,
        });
        
        // Take full page screenshot
        await expect(pwPage).toHaveScreenshot(`${page.name}-${viewport.name}.png`, {
          fullPage: true,
          maxDiffPixels: 100,
          threshold: 0.2,
        });
      });
    });
  }
}
