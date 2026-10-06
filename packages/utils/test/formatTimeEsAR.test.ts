import { formatTimeEsAR, turnoMessage } from '@khal/utils';
import { describe, expect, it } from 'vitest';

describe('formatTimeEsAR', () => {
  it('formats an afternoon hour with fixed suffix', () => {
    expect(formatTimeEsAR('19:30')).toBe('19:30 h');
  });

  it('drops hour padding at midnight', () => {
    expect(formatTimeEsAR('00:00')).toBe('0:00 h');
  });

  it('formats the end-of-day edge', () => {
    expect(formatTimeEsAR('23:59')).toBe('23:59 h');
  });

  it('drops hour padding but keeps minute padding', () => {
    expect(formatTimeEsAR('09:05')).toBe('9:05 h');
  });

  it.each([['7:30 PM'], ['25:00'], ['ab:cd'], ['']])(
    'rejects invalid input %p with RangeError',
    (input) => {
      expect(() => formatTimeEsAR(input)).toThrow(RangeError);
    }
  );

  it('includes the received value in the RangeError message', () => {
    expect(() => formatTimeEsAR('25:00')).toThrow(/25:00/);
  });
});

describe('turnoMessage', () => {
  it('uses voseo with the formatted hour', () => {
    const msg = turnoMessage('19:30');
    expect(msg).toContain('Tenés turno a las 19:30 h');
    expect(msg).not.toContain('tienes');
  });
});
