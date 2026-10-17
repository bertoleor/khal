import type { Page } from '@playwright/test';
import { expect, test, waitForPageReady } from './fixtures/visual';

/**
 * [ORN-205] Visual baseline suite — pixel-diff via toHaveScreenshot().
 *
 * Canonical pages trace to design-system/khal/CONTRASTE.md (UUPM-204 output):
 * its "Metodología y fuentes" inventories the storefront surfaces
 * (page.tsx home, servicios/[id], servicios/[id]/reservar, politicas) and the
 * card minimum is "home + flujos clave del app web". Excluded on purpose:
 * error.tsx / not-found.tsx (pre-dark light-mode drift islands, CONTRASTE.md
 * §Notas — baselining them now would lock in debt slated for removal) and
 * payment-step.tsx (post-submit state; needs a booking action first — follow-up).
 *
 * Per-test contract (skill pixel-perfect, Workflow E):
 *   1. key locator waitFor() — proves the route rendered real content
 *   2. hideParticleAura(page) — deterministic background (see below)
 *   3. waitForPageReady(page) — fonts + images + GSAP freeze
 *   4. toHaveScreenshot() — NEVER before 1-3.
 *
 * The particle aura (BackgroundMesh) is a requestAnimationFrame canvas that is
 * non-deterministic BY DESIGN: particles are seeded with Math.random(), the
 * crossfade cycles forever (FRAMES_PER_PAIR 420) and even under
 * prefers-reduced-motion the breathing continues (CONTRASTE.md filas 13/36 —
 * reduced-motion is only partial). Pixel-diff can only guard DETERMINISTIC
 * pixels, so the pilot hides the canvas and baselines every surface over the
 * canonical #000000 OLED background (globals.css:4). Aura fidelity stays
 * covered by CONTRASTE.md's token citations, not by pixel-diff.
 */

const LIFTING_ID = '11111111-1111-4111-8111-111111111111';

/** Black out the animated background canvas for a deterministic screenshot. */
async function hideParticleAura(page: Page): Promise<void> {
  await page.addStyleTag({
    content: 'canvas[aria-hidden="true"] { visibility: hidden !important; }',
  });
}

test('home /es — catálogo de servicios', async ({ page }) => {
  await page.goto('/es');
  // 'Nuestros servicios' is the storefront's primary landmark — the same
  // anchor the booking happy path asserts on (hero white/[0.03] + catalog
  // cards over the OLED canvas, CONTRASTE.md filas 1/5/45).
  await page.getByRole('heading', { name: 'Nuestros servicios' }).waitFor();
  await hideParticleAura(page);
  await waitForPageReady(page);
  await expect(page).toHaveScreenshot('home-es.png', { fullPage: true });
});

test('servicio /es — detalle de Lifting de Pestañas', async ({ page }) => {
  await page.goto(`/es/servicios/${LIFTING_ID}`);
  // Stub fixture: Lifting de Pestañas, $ 45.000,00 ARS, 60 min — the page the
  // booking flow links from the catalog (glass card + bottom bar + CTA
  // 'Agendar Cita', CONTRASTE.md filas 12/20/45).
  await page.getByRole('heading', { name: 'Lifting de Pestañas' }).waitFor();
  await expect(page.getByText('60 min')).toBeVisible();
  await hideParticleAura(page);
  await waitForPageReady(page);
  await expect(page).toHaveScreenshot('servicio-detail-es.png', { fullPage: true });
});

test('reservar /es — día y horario (clock fijo)', async ({ page }) => {
  // The 7-day strip renders REAL dates (today + 6 days) and "today" carries
  // extra blocked slots — a live clock would rot the baseline every midnight.
  // Freeze time so every run renders the same days, the same disabled Sunday
  // and the same blocked 10:00-11:15 / 14:30-15:45 ranges. Install BEFORE
  // page.goto so client-side date logic hydrates against the fixed instant.
  await page.clock.install({ time: '2026-10-21T12:00:00-03:00' });
  await page.goto(`/es/servicios/${LIFTING_ID}/reservar`);
  await page.getByRole('heading', { name: 'Elegí el día' }).waitFor();
  await hideParticleAura(page);
  await waitForPageReady(page);
  await expect(page).toHaveScreenshot('reservar-es.png', { fullPage: true });
});

test('politicas /es — Políticas del estudio', async ({ page }) => {
  await page.goto('/es/politicas');
  await page.getByRole('heading', { name: 'Políticas del estudio' }).waitFor();
  await hideParticleAura(page);
  await waitForPageReady(page);
  await expect(page).toHaveScreenshot('politicas-es.png', { fullPage: true });
});
