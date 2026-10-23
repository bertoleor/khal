import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [T-F2.4 — seña receipt, board s04] Contract tests for the v2 receipt.
 *
 * Owner-approved spec: recibo (monto ENORME, alias COPIAR, CBU chico),
 * barra 12 h (the D2 hold made visible at the commit moment), CTA único
 * WhatsApp, términos de plata repetidos (D1: the money-critical terms come
 * back on the comprobante screen).
 *
 * The receipt is the evolution of the v1 PaymentStep — same props, same
 * CopyRow clipboard logic, same buildWhatsAppLink CTA — restyled to the v2
 * language (D11: sharp, hairline separators, semantic tokens) with the new
 * business rules surfaced (12h hold).
 */
const read = (rel: string) => readFileSync(join(__dirname, '..', rel), 'utf-8');

describe('seña receipt — T-F2.4 (v2 comprobante screen)', () => {
  it('opens as a receipt: kicker title, no v1 box styling', () => {
    const src = read('src/components/payment/payment-step.tsx');
    expect(src).toContain("t('receiptTitle')");
    // The v1 glass boxes are gone (D11)…
    expect(src).not.toContain('rounded-2xl');
    expect(src).not.toContain('backdrop-blur-sm');
  });

  it('shows the monto ENORME (receipt hero amount)', () => {
    const src = read('src/components/payment/payment-step.tsx');
    // Bigger than the v1 text-3xl; fits 390px via the clamp.
    expect(src).toMatch(/text-\[clamp\(/);
    expect(src).not.toContain('text-3xl');
  });

  it('carries the D2 12h hold bar (label + body + the bar itself)', () => {
    const src = read('src/components/payment/payment-step.tsx');
    expect(src).toContain("t('holdBarLabel')");
    expect(src).toContain("t('holdBarBody')");
    // The bar: a 2px functional rule (D11 border discipline).
    expect(src).toMatch(/h-\[?2px\]?|h-0\.5/);
  });

  it('keeps the clipboard rows (alias prominent + CBU) and the single WhatsApp CTA', () => {
    const src = read('src/components/payment/payment-step.tsx');
    expect(src).toContain('navigator.clipboard.writeText');
    expect(src).toContain('buildWhatsAppLink');
    expect(src).toContain("t('sendComprobante')");
    // Single CTA, v2 accent, sharp (no pill).
    expect(src).not.toContain('rounded-full');
    expect(src).toContain('bg-accent');
  });

  it('repeats the money-critical terms (D1 on the comprobante screen)', () => {
    const src = read('src/components/payment/payment-step.tsx');
    expect(src).toContain("t('termsNonRefundable')");
    expect(src).toContain("t('termsReschedule')");
  });

  it('the v1 online-payment section is NOT part of the receipt (dormant MP flow)', () => {
    const src = read('src/components/payment/payment-step.tsx');
    // The MP checkout UI is dead in every call path (no caller passes
    // bookingId+serviceId to this screen) — removed per the F2 dead-code
    // precedent. The MP infrastructure (action, webhook, /pago pages)
    // stays untouched per the owner rule.
    expect(src).not.toContain('createCheckoutPreference');
    expect(src).not.toContain('payOnline');
  });
});
