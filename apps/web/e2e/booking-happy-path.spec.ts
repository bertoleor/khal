import { expect, test } from '@playwright/test';

import { expectNoSeriousA11yViolations } from './a11y';

/**
 * KHAL-A6 — E2E happy path for the booking flow (the repo's hottest spot,
 * 7 churn commits, previously zero integration coverage).
 *
 * Flow under test (es default locale):
 *   home → service detail → reservar → pick open day + slot → fill guest
 *   form → submit → payment screen visible (deposit amount, alias, CBU/CVU).
 *
 * All data is deterministic: the Playwright `webServer` boots the zero-dep
 * Supabase stub (apps/web/e2e/server.mjs) which seeds the visible services
 * from supabase/seed.sql and answers the create_booking RPC with the
 * documented 0003 contract. No live systems are touched.
 *
 * The spec is written against TARGET behavior (ticket note for t_715635aa):
 * it asserts the flow end-to-end through real pages and the real server
 * action, not against the schedule mocks' internals — when availability
 * moves to DB reads, only the stub fixtures change, not this spec.
 *
 * FQ3 — the journey doubles as the accessibility circuit: an axe scan
 * runs at each of the 5 client screens (stop markers below), gating on
 * critical/serious violations of the rendered DOM.
 */

const LIFTING_ID = '11111111-1111-4111-8111-111111111111';

test.describe('Booking happy path (public storefront)', () => {
  test('visitor books a service end to end and reaches the payment screen', async ({ page }) => {
    // 1. Home renders the seeded catalog with the first service.
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Nuestros servicios' })).toBeVisible();
    const firstService = page.locator('a', { hasText: 'Lifting de Pestañas' }).first();
    await expect(firstService).toBeVisible();
    // FQ3 axe stop 1/5: catálogo.
    await expectNoSeriousA11yViolations(page, 'home — catálogo');

    // 2. Service detail page shows duration and the booking CTA.
    await firstService.click();
    // Cold-route tolerance: `next dev` compiles each route on demand; the
    // first visit to a route can take tens of seconds on slow filesystems
    // and in CI (where every route starts cold).
    await expect(page).toHaveURL(new RegExp(`/es/servicios/${LIFTING_ID}$`), {
      timeout: 120_000,
    });
    await expect(page.getByRole('heading', { name: 'Lifting de Pestañas' })).toBeVisible();
    await expect(page.getByText('60 min')).toBeVisible();
    // FQ3 axe stop 2/5: detalle del servicio.
    await expectNoSeriousA11yViolations(page, 'detalle del servicio');

    // 3. Reservar page: 7-day strip, Sunday closed; slots come from business
    //    hours 09:00-18:00 (today additionally blocks 10:00-11:15 and
    //    14:30-15:45). Click the booking CTA and pick the first open day.
    const bookCta = page.getByRole('link', { name: 'Agendar Cita' });
    await expect(bookCta).toBeVisible();
    await bookCta.click();
    await expect(page).toHaveURL(new RegExp(`/es/servicios/${LIFTING_ID}/reservar$`), {
      timeout: 120_000,
    });
    await expect(page.getByRole('heading', { name: 'Elegí el día' })).toBeVisible({
      timeout: 120_000,
    });

    // The day strip lives in the section headed "Elegí el día". Day buttons
    // and slot buttons both carry aria-pressed, so scope each to its section
    // heading to avoid cross-matching (day strip first, slot grid second).
    const daySection = page
      .getByRole('heading', { name: 'Elegí el día' })
      .locator('xpath=following-sibling::div[1]');
    const openDay = daySection.locator('button:not([disabled])').first();
    await openDay.click();

    // 4. Pick the first offered slot in the "Elegí el horario" section.
    const slotSection = page
      .getByRole('heading', { name: 'Elegí el horario' })
      .locator('xpath=following-sibling::div[1]');
    const firstSlot = slotSection.locator('button:not([disabled])').first();
    await expect(firstSlot).toBeVisible();
    await firstSlot.click();

    // 5. Fill the guest form and submit. Inputs are wrapped in <label> (Field
    //    component), so they are addressable by accessible label. The D1
    //    terms checkbox is required (enforced server-side too), so the flow
    //    must check it before the 12h-hold submit button.
    await expect(page.getByLabel('Nombre')).toBeVisible();
    await page.getByLabel('Nombre').fill('Valentina Prueba');
    await page.getByLabel('Teléfono').fill('+54 9 11 5555 5555');
    await page.getByLabel('Correo').fill('deposit@example.com');
    await page.getByLabel('Acepto los términos del estudio').check();
    // FQ3 axe stop 3/5: reservar with day + slot picked and the form filled
    // — the fullest interactive state the client works with.
    await expectNoSeriousA11yViolations(page, 'reservar — formulario completo');
    await page.getByRole('button', { name: 'Confirmar — reserva por 12 h' }).click();

    // 6. Payment screen: deposit banner + amounts + transfer rows + WhatsApp.
    //    Lifting: percentage deposit 30% of $ 45.000,00 -> seña $ 13.500,00
    //    (es-AR currency renders a NBSP between $ and digits). The amount
    //    string appears in several texts, so assert the big amount element.
    await expect(page.getByText('Seña pendiente')).toBeVisible();
    await expect(page.getByText(/Tu turno está reservado\./)).toBeVisible();
    await expect(page.getByText('Seña a transferir')).toBeVisible();
    // v2 receipt: the amount is the receipt hero (clamp-sized), so assert the
    // text itself instead of a size class.
    await expect(page.getByText(/\$\s?13\.500,00/).first()).toBeVisible();
    await expect(page.getByText('khal.estudio')).toBeVisible();
    await expect(page.getByText('0000003100000000000001')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Enviar comprobante por WhatsApp' })).toBeVisible();
    // FQ3 axe stop 4/5: recibo de seña.
    await expectNoSeriousA11yViolations(page, 'recibo de seña');

    // 6b. T-F2.5 — the estado door: the receipt links to the live booking
    //     state (board s05). The stub answers the seeded booking as
    //     PENDIENTE with a live 12h hold — the badge + the 3 steps of
    //     "qué pasa ahora" must render.
    const estadoLink = page.getByRole('link', { name: 'ver estado de mi turno' });
    await expect(estadoLink).toBeVisible();
    await estadoLink.click();
    await expect(page).toHaveURL(/\/es\/estado\/99999999-9999-4999-8999-999999999999$/);
    await expect(page.getByText('pendiente de confirmación')).toBeVisible();
    await expect(page.getByText('Lifting de Pestañas')).toBeVisible();
    await expect(page.getByText('Qué pasa ahora')).toBeVisible();
    await expect(page.getByText('Envianos el comprobante de la seña por WhatsApp.')).toBeVisible();
    // FQ3 axe stop 5/5: estado del turno.
    await expectNoSeriousA11yViolations(page, 'estado del turno');

    // 7. The real server action forwarded the booking through the stub: the
    //    RPC payload must carry the 0003 contract inputs (service, guest
    //    data, selected date/slot). The stub exposes its recordings for the
    //    spec — the only channel between the two processes.
    const callsResponse = await fetch('http://127.0.0.1:54321/e2e/create-booking-calls');
    const { calls } = await callsResponse.json();
    expect(calls).toHaveLength(1);
    const rpcCall = calls[0];
    expect(rpcCall.p_service_id).toBe(LIFTING_ID);
    expect(rpcCall.p_name).toBe('Valentina Prueba');
    expect(rpcCall.p_phone).toBe('+54 9 11 5555 5555');
    expect(rpcCall.p_email).toBe('deposit@example.com');
    expect(rpcCall.p_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(rpcCall.p_slot_start_minutes).toBeGreaterThanOrEqual(0);
    expect(rpcCall.p_slot_start_minutes).toBeLessThanOrEqual(1439);
    expect(typeof rpcCall.p_idempotency_key).toBe('string');
    // D3 — the unchecked ⚑ travels as false through the real server action.
    expect(rpcCall.p_external_work).toBe(false);
  });
});
