import { describe, expect, it } from 'vitest';

import { bookingInputSchema } from '../src/index';

/**
 * [D1 + D3 — owner rules 2026-10-20] Booking input contract.
 *
 * D3: the external-work flag defaults to false when absent.
 * D1: the clienta MUST accept the studio terms at the review step — the
 * schema enforces literal true, so the server action rejects any submit
 * without the checkbox (the e2e happy path checks the box).
 */
const validBase = {
  serviceId: '0b7d0d2c-9f3e-4f5a-8f21-1c2f4a9d3e10',
  date: '2026-11-02',
  slotStart: '10:00',
  name: 'Maria Fernandez',
  // The e2e fixture phone (booking-happy-path.spec.ts) — proven to pass
  // phoneSchema end to end through the real server action.
  phone: '+54 9 11 5555 5555',
  email: 'maria@example.com',
  termsAccepted: true,
};

describe('bookingInputSchema — externalWork flag (D3)', () => {
  it('defaults to false when the field is absent (checkbox unchecked)', () => {
    const parsed = bookingInputSchema.safeParse(validBase);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.externalWork).toBe(false);
    }
  });

  it('accepts an explicit true and round-trips it', () => {
    const parsed = bookingInputSchema.safeParse({ ...validBase, externalWork: true });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.externalWork).toBe(true);
    }
  });

  it('rejects non-boolean junk', () => {
    const parsed = bookingInputSchema.safeParse({ ...validBase, externalWork: 'yes' });
    expect(parsed.success).toBe(false);
  });
});

describe('bookingInputSchema — terms acceptance (D1)', () => {
  it('accepts a valid submit with the terms checkbox on', () => {
    const parsed = bookingInputSchema.safeParse(validBase);
    expect(parsed.success).toBe(true);
  });

  it('REJECTS a submit without the terms checkbox (server-enforced gate)', () => {
    const withoutTerms: Partial<typeof validBase> = { ...validBase };
    delete withoutTerms.termsAccepted;
    const parsed = bookingInputSchema.safeParse(withoutTerms);
    expect(parsed.success).toBe(false);
  });

  it('rejects an unchecked checkbox (termsAccepted: false)', () => {
    const parsed = bookingInputSchema.safeParse({ ...validBase, termsAccepted: false });
    expect(parsed.success).toBe(false);
  });
});
