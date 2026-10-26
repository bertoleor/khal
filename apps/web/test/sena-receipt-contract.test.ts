import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [S9 — the v7 recibo, preview §5] Contract tests for the receipt.
 *
 * Owner-approved v7 anatomy: "Tu turno está reservado" (no ✓ in the title),
 * ONE glass card (servicio with add-ons, fecha, the seña big in mono, alias
 * + CBU/CVU each with a copy square), WhatsApp pill CTA, estado link. The
 * v2 receipt language died with D11: no "resto al llegar", no 12h hold bar,
 * no terms block — and the CTA is a REAL pill now (the v7 glass scale
 * replaced the 2px-radius cap, T1).
 */
const read = (rel: string) => readFileSync(join(__dirname, '..', rel), 'utf-8');

describe('recibo — S9 (v7, approved preview §5)', () => {
  it('opens with "Tu turno está reservado" — no v2 kicker, no ✓ in the title', () => {
    const src = read('src/components/payment/payment-step.tsx');
    expect(src).toContain("t('reservedTitle')");
    // The v2 ticket-stub kicker and its pending/confirmed titles are gone.
    expect(src).not.toContain("t('receiptTitle')");
    expect(src).not.toContain("t('depositPendingTitle')");
    expect(src).not.toContain("t('depositConfirmedTitle')");
  });

  it('copy rows: clipboard API + execCommand fallback + the 1.4s «✓ copiado» state', () => {
    const src = read('src/components/payment/payment-step.tsx');
    expect(src).toContain('navigator.clipboard.writeText');
    expect(src).toContain('execCommand');
    expect(src).toContain('1400');
    // H4: the announcement lives in a dedicated sr-only region.
    expect(src).toMatch(/sr-only/);
  });

  it('has NO "resto al llegar", NO hold bar, NO terms block (v7 killed them)', () => {
    const src = read('src/components/payment/payment-step.tsx');
    expect(src).not.toContain('remainderAtStore');
    expect(src).not.toContain('holdBar');
    expect(src).not.toContain('termsNonRefundable');
    expect(src).not.toContain('termsReschedule');
  });

  it('the CTA is a solid pill — v7 glass scale, accent ink (S12)', () => {
    const src = read('src/components/payment/payment-step.tsx');
    expect(src).toContain('rounded-full');
    expect(src).toContain('bg-accent');
    expect(src).toContain('text-accent-contrast');
  });

  it('the service row reflects the add-ons (serviceName arrives pre-joined)', () => {
    const src = read('src/components/payment/payment-step.tsx');
    expect(src).toContain("t('serviceRow')");
    expect(src).toContain('serviceName');
  });

  it('the dormant MP checkout stays out of the receipt', () => {
    const src = read('src/components/payment/payment-step.tsx');
    expect(src).not.toContain('createCheckoutPreference');
    expect(src).not.toContain('payOnline');
  });
});
