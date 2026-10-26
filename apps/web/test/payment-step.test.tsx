// @vitest-environment node
// Server-rendered component tests for the v7 recibo (PaymentStep, S9 —
// "Tu turno está reservado", copy rows, no resto, no 12h text).
// Rendered via ReactDOMServer (react-dom is already a dep) so no DOM/jsdom
// is needed; next-intl is mocked to the Spanish `payment`/`estado` strings.
import { formatCents } from '@khal/utils';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PaymentStep, type PaymentInfo } from '../src/components/payment/payment-step';

vi.mock('next-intl', () => {
  const pay: Record<string, string> = {
    reservedTitle: 'Tu turno está reservado',
    serviceRow: 'Servicio',
    dateRow: 'Fecha',
    depositAmountLabel: 'Seña a transferir',
    alias: 'Alias',
    cvu: 'CBU/CVU',
    copy: 'Copiar',
    copied: '✓ copiado',
    sendComprobante: 'Enviar comprobante por WhatsApp',
    whatsappMessage:
      '¡Hola! Agendé para {service} el {date} a las {slot}. Adjunto el comprobante de pago.',
  };
  const estado: Record<string, string> = {
    receiptLink: 'ver estado de mi turno',
  };
  return {
    useLocale: () => 'es',
    useTranslations:
      (ns: string) =>
      (key: string, vars: Record<string, string | number> = {}) => {
        const dict = ns === 'estado' ? estado : pay;
        let s = dict[key] ?? key;
        for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
        return s;
      },
  };
});

const payment: PaymentInfo = {
  alias: 'khal.estudio',
  cvu: '0000003100000000000001',
  whatsappPhone: '5491122334455',
  amountDueCents: 1_000_000,
  currencyCode: 'ARS',
  isDeposit: true,
  durationMinutes: 60,
};

const bookingId = 'b76c8e0a-1a2b-4c3d-9e4f-5a6b7c8d9e0f';

function renderRecibo() {
  return renderToStaticMarkup(
    <PaymentStep
      payment={payment}
      // S9: the recibo renders the service WITH its add-ons, pre-joined by
      // the booking form (serviceWithAddons).
      serviceName="Lifting + perfilado"
      date="2026-11-03"
      slot="11:00"
      bookingId={bookingId}
    />
  );
}

/** Strips all whitespace so currency strings with NBSP compare cleanly. */
function clean(s: string): string {
  return s.replace(/\s/g, '');
}

describe('PaymentStep — the v7 recibo (S9)', () => {
  it('opens with "Tu turno está reservado" — no ✓, no 12h mechanic', () => {
    const html = renderRecibo();
    expect(html).toContain('Tu turno está reservado');
    // S9: SIN ✓ on the title; the copy glyph swap is client-only, so the
    // static receipt never carries a checkmark.
    expect(html).not.toContain('✓');
    // S6: the hold mechanic is never visible to the clienta.
    expect(html).not.toMatch(/12\s*h/);
  });

  it('renders the glass card rows: service with add-ons, fecha, seña', () => {
    const html = renderRecibo();
    expect(html).toContain('Lifting + perfilado');
    expect(html).toContain('mar 3 · 11:00 · 1 h');
    expect(clean(html)).toContain(clean(formatCents(1_000_000, 'ARS')));
  });

  it('has NO "resto al llegar" row (the dueña called it redundant)', () => {
    const html = renderRecibo();
    expect(html).not.toMatch(/resto/i);
    expect(html).not.toMatch(/remaining at the studio/i);
  });

  it('exposes the alias and CBU/CVU values with copy buttons beside them', () => {
    const html = renderRecibo();
    expect(html).toContain(payment.alias);
    expect(html).toContain(payment.cvu);
    expect(html).toContain(`aria-label="Copiar: ${payment.alias}"`);
    expect(html).toContain(`aria-label="Copiar: ${payment.cvu}"`);
    // The copy square glyph (the ✓ swap is client-only state).
    expect(html).toContain('⧉');
  });

  it('announces the copied state via a dedicated live region (H4)', () => {
    const html = renderRecibo();
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it('builds a wa.me deep link with the pre-filled comprobante message', () => {
    const html = renderRecibo();
    expect(html).toContain(`https://wa.me/${payment.whatsappPhone}?text=`);
    expect(html).toContain(encodeURIComponent('Agendé para Lifting + perfilado'));
  });

  it('links to the personal estado door', () => {
    const html = renderRecibo();
    expect(html).toContain(`/es/estado/${bookingId}`);
    expect(html).toContain('ver estado de mi turno');
  });
});
