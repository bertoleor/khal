import { describe, expect, it } from 'vitest';

import { bookingInputSchema } from '../src/index';

/**
 * [D3 — owner rule 2026-10-20] Booking input carries the external-work flag.
 *
 * The action converts the checkbox (`formData.get('externalWork') === 'on'`)
 * to a boolean; the schema must accept its ABSENCE as false (the current v1
 * form does not send it — every existing booking flow and the e2e happy path
 * must keep validating) and reject non-boolean junk.
 */
const validBase = {
  serviceId: '0b7d0d2c-9f3e-4f5a-8f21-1c2f4a9d3e10',
  date: '2026-11-02',
  slotStart: '10:00',
  name: 'Maria Fernandez',
  phone: '+5491122334455',
  email: 'maria@example.com',
};

describe('bookingInputSchema — externalWork flag (D3)', () => {
  it('defaults to false when the field is absent (v1 form + e2e keep working)', () => {
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
