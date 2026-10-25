import { expect, test } from '@playwright/test';

/**
 * khal v2 — runtime acceptance probes for t_0cc93731 (ux-skeletons-v2).
 *
 * F0 (tokens/tema): wordmark renders in the licensed TAN Nightingale
 * (document.fonts.check gate from docs/plans/plan-implementacion-v2.md),
 * the typographic toggle flips AND persists (D12), and the D11 radius cap
 * is real in the browser (computed styles, not just CSS source).
 *
 * F1 (fondo clienta): the home hero mounts the MeshGradient canvas
 * (license-gated fallback for the 21st.dev component — see
 * apps/web/src/components/home/mesh-gradient-canvas.tsx), the CTA stays on
 * ONE line (approved iteration-1 fix), and pointer interaction runs clean.
 *
 * Runs against the same zero-dep Supabase stub + next dev server as the
 * booking happy path (see playwright.config.ts).
 */

test.describe('khal v2 — F0: wordmark, theme toggle, radius discipline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('wordmark "Khal" renders in TAN Nightingale (document.fonts.check)', async ({ page }) => {
    const wordmark = page.getByRole('heading', { name: 'Khal', exact: true });
    await expect(wordmark).toBeVisible();

    await expect
      .poll(async () => page.evaluate(() => document.fonts.check('1em "TAN Nightingale"')))
      .toBe(true);

    const family = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? getComputedStyle(h1).fontFamily : '';
    });
    expect(family).toContain('TAN Nightingale');
  });

  test('typographic toggle flips the mode, swaps the palette and persists', async ({ page }) => {
    const toggle = page.getByRole('button', { name: 'Cambiar modo claro/oscuro' });
    await expect(toggle).toBeVisible();

    const classBefore = await page.evaluate(() => document.documentElement.className);
    const bgBefore = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await toggle.click();

    const classAfter = await page.evaluate(() => document.documentElement.className);
    const bgAfter = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(classAfter).not.toBe(classBefore);
    expect(bgAfter).not.toBe(bgBefore);

    // Persisted (next-themes localStorage) — survives a reload.
    const stored = await page.evaluate(() => localStorage.getItem('theme'));
    expect(['light', 'dark']).toContain(stored);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Khal', exact: true })).toBeVisible();
    const classReload = await page.evaluate(() => document.documentElement.className);
    expect(classReload).toBe(classAfter);
  });

  test('D11 radius cap: every element inside main computes ≤ 2px radius', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Nuestros servicios' })).toBeVisible();
    // Walk every element in main and take the max computed border-radius:
    // the 2px cap is a runtime contract, not just a CSS-source one. (The
    // flow-gradient hero CTA sits OUTSIDE main and keeps its owner-approved
    // 30px glass pill — asserted separately below.)
    const maxRadius = await page.evaluate(() => {
      let max = 0;
      const main = document.querySelector('main');
      if (!main) return -1;
      for (const el of main.querySelectorAll('*')) {
        const v = parseFloat(getComputedStyle(el).borderRadius);
        if (!Number.isNaN(v) && v > max) max = v;
      }
      return max;
    });
    expect(maxRadius).toBeGreaterThanOrEqual(0);
    expect(maxRadius).toBeLessThanOrEqual(2.01);
  });

  test('hero CTA keeps the owner-approved 30px glass pill (documented exception)', async ({
    page,
  }) => {
    const ctaRadius = await page.evaluate(() => {
      const cta = Array.from(document.querySelectorAll('a')).find(
        (a) => a.textContent?.trim() === 'Agendá tu turno'
      );
      return cta ? parseFloat(getComputedStyle(cta).borderRadius) : -1;
    });
    expect(ctaRadius).toBe(30);
  });
});

test.describe('khal v2 — F1: flow-gradient hero (fallback MeshGradient, Apache 2.0)', () => {
  test('hero canvas mounts, CTA stays on one line, pointer interaction is live', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Khal', exact: true })).toBeVisible();

    // The lazy shader chunk mounts a <canvas> inside the hero (WebGL via
    // SwiftShader in headless Chromium).
    const hero = page.locator('section[aria-label]');
    await expect(hero.locator('canvas').first()).toBeVisible({ timeout: 30_000 });

    // Approved iteration-1 fix: the CTA never wraps.
    const cta = page.getByRole('link', { name: 'Agendá tu turno' });
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeLessThanOrEqual(64);
    expect(box!.width).toBeLessThanOrEqual(page.viewportSize()?.width ?? 390);

    // Pointer interaction: the flow follows the pointer/touch without
    // throwing (rAF lerp loop + uniform updates).
    await page.mouse.move(120, 200);
    await page.mouse.move(300, 500, { steps: 12 });
    await page.mouse.wheel(0, 400); // scroll to the catalog — hero must unmount nothing
    await expect(page.getByRole('heading', { name: 'Nuestros servicios' })).toBeVisible();

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
