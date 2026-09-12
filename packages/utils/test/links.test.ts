import { buildWhatsAppLink } from '@khal/utils';
import { describe, expect, it } from 'vitest';

describe('buildWhatsAppLink', () => {
  it('builds a wa.me deep link with encoded text', () => {
    expect(buildWhatsAppLink('5491100000000', 'Hola')).toBe(
      'https://wa.me/5491100000000?text=Hola'
    );
  });

  it('percent-encodes special characters and spaces', () => {
    const link = buildWhatsAppLink('5491100000000', 'Hola! Agendé un turno');
    expect(link).toContain('text=Hola!%20Agend%C3%A9%20un%20turno');
  });
});
