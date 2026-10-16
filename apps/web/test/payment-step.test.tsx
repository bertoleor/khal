// @vitest-environment node
// Server-rendered component tests for the manual payment step (PaymentStep).
// Rendered via ReactDOMServer (react-dom is already a dep) so no DOM/jsdom is
// needed; next-intl is mocked to the Spanish `payment` namespace strings.
import { formatCents } from '@khal/utils';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PaymentStep, type PaymentInfo } from '../src/components/payment/payment-step';

vi.mock('next-intl', () => {
  const pay: Record<string, string> = {
    alias: 'Alias',
    cvu: 'CBU/CVU',
    copy: 'Copiar',
    copied: '¡Copiado!',
    amountDue: 'A pagar',
    depositAmountLabel: 'Seña a transferir',
    totalLabel: 'Total: {amount}',
    remainderAtStore: 'Resto {amount} en el local',
    transferTo: 'Transferir a',
    instructions:
      'Transferí {amount} por CBU o alias y después enviá el comprobante por WhatsApp para confirmar tu turno.',
    depositPendingTitle: 'Seña pendiente',
    depositPendingBody:
      'Tu turno está reservado. Transferí {amount} y enviá el comprobante por WhatsApp para confirmarlo.',
    depositConfirmedTitle: 'Seña confirmada',
    sendComprobante: 'Enviar comprobante por WhatsApp',
    whatsappMessage: 'Hola! Agendé para {service} el {date} a las {slot}.',
  };
  return {
    useLocale: () => 'es',
    useTranslations:
      () =>
      (key: string, vars: Record<string, string | number> = {}) => {
        let s = pay[key] ?? key;
        for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
        return s;
      },
  };
});

const payment: PaymentInfo = {
  alias: 'KHAL.TURNOS.MP',
  cvu: '00000031000485526',
  whatsappPhone: '5491122334455',
  amountDueCents: 25000,
  totalCents: 50000,
  currencyCode: 'ARS',
  isDeposit: true,
  depositStatus: 'pending',
};

function renderPayment() {
  return renderToStaticMarkup(
    <PaymentStep payment={payment} serviceName="Lash lifting" date="2026-10-21" slot="14:00" />
  );
}

/** Strips all whitespace so currency strings with NBSP/regular spaces compare cleanly. */
function clean(s: string): string {
  return s.replace(/\s/g, '');
}

describe('PaymentStep (manual payment UI)', () => {
  it('A3: announces copy result via a dedicated live status region (not a plain button)', () => {
    const html = renderPayment();
    // A <span role="status"> live region must exist to announce the copied value to SR.
    expect(html).toContain('<span role="status"');
  });

  it('A3: copy button exposes the value being copied via aria-label', () => {
    const html = renderPayment();
    expect(html).toContain(`aria-label="Copiar: ${payment.alias}"`);
  });

  it('renders the alias and CVU values the client must see to transfer', () => {
    const html = renderPayment();
    expect(html).toContain(payment.alias);
    expect(html).toContain(payment.cvu);
  });

  it('renders the deposit amount and remainder in formatted currency', () => {
    const html = renderPayment();
    expect(clean(html)).toContain(clean(formatCents(25000, 'ARS')));
    expect(clean(html)).toContain(clean(formatCents(50000 - 25000, 'ARS')));
  });

  it('builds a wa.me deep link to the phone with the pre-filled comprobante message', () => {
    const html = renderPayment();
    expect(html).toContain(`https://wa.me/${payment.whatsappPhone}?text=`);
    // the pre-filled message is URL-encoded in the deep link
    expect(html).toContain(encodeURIComponent('Agendé para Lash lifting'));
  });
});
