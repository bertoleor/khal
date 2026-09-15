import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * T1 + T2 — tono es-AR formal (auditoría 2026-09-14 §4).
 * Lee el diccionario real: si el copy cambia, el test lo refleja.
 */
const es = JSON.parse(readFileSync(join(__dirname, '..', 'messages', 'es.json'), 'utf-8')) as {
  catalog: { book: string };
  payment: { whatsappMessage: string };
};

describe('tono es-AR (web)', () => {
  it('T1: payment.whatsappMessage abre con "¡Hola!" (signo de apertura)', () => {
    expect(es.payment.whatsappMessage.startsWith('¡Hola!')).toBe(true);
  });

  it('T2: catalog.book usa sentence-case ("Agendar cita")', () => {
    expect(es.catalog.book).toBe('Agendar cita');
  });
});
