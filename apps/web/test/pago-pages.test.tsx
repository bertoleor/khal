// @vitest-environment node
// G3 close-out: /pago/exito|error|pendiente return pages (MP back_urls targets).
//
// Contract: the three pages exist and wire PagoResult with the right status,
// the presentational component renders per-status copy with fail-soft
// WhatsApp (never a broken CTA), and MP query params are sanitized before
// they reach the UI (payment ids are digits-only, references are uuids).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PagoResult } from '../src/components/payment/pago-result';
import { parsePagoSearchParams } from '../src/lib/pago-params';

const UUID = 'b19e6f3a-9d4c-4f6e-8a2b-1c3d5e7f9a0b';

// ---------------------------------------------------------------------------
// parsePagoSearchParams — MP appends payment_id / external_reference (and more)
// to the back_url; only well-formed values may reach the UI.
// ---------------------------------------------------------------------------
describe('parsePagoSearchParams', () => {
  it('keeps a numeric payment_id and a uuid external_reference', () => {
    expect(parsePagoSearchParams({ payment_id: '123456789', external_reference: UUID })).toEqual({
      paymentId: '123456789',
      externalReference: UUID,
    });
  });

  it('takes the first value when Next delivers an array', () => {
    expect(parsePagoSearchParams({ payment_id: ['123', '456'] })).toEqual({
      paymentId: '123',
      externalReference: null,
    });
  });

  it('rejects non-numeric or path-carrying payment ids', () => {
    expect(parsePagoSearchParams({ payment_id: '12a34' }).paymentId).toBeNull();
    expect(parsePagoSearchParams({ payment_id: '../../admin' }).paymentId).toBeNull();
    expect(parsePagoSearchParams({ payment_id: '' }).paymentId).toBeNull();
    expect(parsePagoSearchParams({ payment_id: '1234567890123456' }).paymentId).toBeNull();
  });

  it('rejects a malformed external_reference', () => {
    expect(
      parsePagoSearchParams({ external_reference: 'not-a-uuid' }).externalReference
    ).toBeNull();
  });

  it('returns nulls when the params are absent', () => {
    expect(parsePagoSearchParams({})).toEqual({ paymentId: null, externalReference: null });
  });
});

// ---------------------------------------------------------------------------
// PagoResult — presentational component (all copy arrives as props, so the
// render is locale-agnostic and testable without next-intl).
// ---------------------------------------------------------------------------
function renderPago(overrides: Partial<Parameters<typeof PagoResult>[0]> = {}) {
  return renderToStaticMarkup(
    <PagoResult
      status="exito"
      title="¡Pago recibido!"
      body="Tu pago quedó registrado."
      paymentLine="Pago N.º 123"
      backToCatalogLabel="Volver al catálogo"
      backToCatalogHref="/"
      whatsappLabel="Consultanos por WhatsApp"
      whatsappHref="https://wa.me/5491122334455"
      {...overrides}
    />
  );
}

describe('PagoResult', () => {
  it('renders the status card with role=status, title, body and payment line', () => {
    const html = renderPago();
    expect(html).toContain('¡Pago recibido!');
    expect(html).toContain('Tu pago quedó registrado.');
    expect(html).toContain('Pago N.º 123');
    expect(html).toContain('role="status"');
  });

  it('hides the payment line when no id survived sanitization', () => {
    expect(renderPago({ paymentLine: null })).not.toContain('Pago N.º');
  });

  it('renders the pendiente status with its own copy', () => {
    const html = renderPago({ status: 'pendiente', title: 'Pago pendiente' });
    expect(html).toContain('Pago pendiente');
    expect(html).toContain('role="status"');
  });

  it('renders the error status with its own copy', () => {
    const html = renderPago({ status: 'error', title: 'No se pudo completar el pago' });
    expect(html).toContain('No se pudo completar el pago');
  });

  it('always links back to the catalog', () => {
    const html = renderPago();
    expect(html).toContain('href="/"');
    expect(html).toContain('Volver al catálogo');
  });

  it('hides the WhatsApp CTA when no phone is configured (fail-soft, no broken link)', () => {
    const html = renderPago({ whatsappLabel: null, whatsappHref: null });
    expect(html).not.toContain('wa.me');
    expect(html).not.toContain('Consultanos por WhatsApp');
  });

  it('renders the WhatsApp CTA with the wa.me link when a phone exists', () => {
    const html = renderPago();
    expect(html).toContain('https://wa.me/5491122334455');
  });
});

// ---------------------------------------------------------------------------
// Route contract — the three pages MP redirects to must exist and wire the
// component, sanitize the query params and stay out of search indexes.
// ---------------------------------------------------------------------------
describe('/pago routes contract', () => {
  for (const slug of ['exito', 'pendiente', 'error'] as const) {
    it(`pago/${slug}/page.tsx exists, wires PagoResult with status="${slug}" and noindex`, () => {
      const file = join(__dirname, '..', 'src', 'app', '[locale]', 'pago', slug, 'page.tsx');
      expect(existsSync(file), `${file} is missing`).toBe(true);
      const src = readFileSync(file, 'utf8');
      expect(src).toContain('PagoResult');
      expect(src).toMatch(new RegExp(`status:\\s*["']${slug}["']`));
      expect(src).toContain('buildPagoProps');
      expect(src).toContain('robots');
      expect(src).toContain('index: false');
    });
  }

  it('lib/pago-page.ts builds the props from sanitized params + store settings', () => {
    const file = join(__dirname, '..', 'src', 'lib', 'pago-page.ts');
    expect(existsSync(file), `${file} is missing`).toBe(true);
    const src = readFileSync(file, 'utf8');
    expect(src).toContain('parsePagoSearchParams');
    expect(src).toContain('getPaymentSettings');
    expect(src).toContain('buildWhatsAppLink');
    expect(src).toContain('getTranslations');
  });

  it('es/en messages carry the pagoResult namespace with all keys', () => {
    const expected = [
      'backToCatalog',
      'errorBody',
      'errorTitle',
      'exitoBody',
      'exitoTitle',
      'paymentLabel',
      'pendienteBody',
      'pendienteTitle',
      'whatsappHelp',
      'whatsappMessage',
      'whatsappMessageNoId',
    ].sort();
    for (const locale of ['es', 'en']) {
      const messages = JSON.parse(
        readFileSync(join(__dirname, '..', 'messages', `${locale}.json`), 'utf8')
      ) as Record<string, Record<string, string>>;
      expect(Object.keys(messages.pagoResult ?? {}).sort(), locale).toEqual(expected);
    }
  });
});
