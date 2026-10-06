import { formatReminderEsAR, REMINDER_LIVE_ROLE } from '@khal/utils';
import { describe, expect, it } from 'vitest';

describe('formatReminderEsAR (RED: module does not exist yet)', () => {
  it('renders the spec copy for Lucía at 18:30', () => {
    expect(formatReminderEsAR({ nombre: 'Lucía', hora: '18:30' })).toBe(
      'Che, Lucía, te recordamos tu reserva de las 18:30.'
    );
  });

  it('interpolates arbitrary slots with voseo copy', () => {
    expect(formatReminderEsAR({ nombre: 'Martín', hora: '10:00' })).toBe(
      'Che, Martín, te recordamos tu reserva de las 10:00.'
    );
  });

  it('exposes a polite live region role (status, never alert)', () => {
    expect(REMINDER_LIVE_ROLE).toBe('status');
    expect(REMINDER_LIVE_ROLE).not.toBe('alert');
  });
});
