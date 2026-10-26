import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [S10 — the 4-state estado, preview §5] Contract tests.
 *
 * The clienta's personal link renders FOUR states, status box and data box
 * ALWAYS the same width (both w-full children of the same centered column):
 * pendiente (countdown + 3 numbered steps), confirmado (recordatorios
 * NUMBERED 1-4 — never bullet dots), no confirmada (the 0012 sweeper MARKS
 * expired holds as cancelado + hold_released_at, never deletes) and
 * cancelado (with no_asistio in the same closed family). The closed states
 * close with "Si creés que fue un error, escribinos." + "Reservar otra
 * vez". The 12h hold mechanic is NEVER visible to the clienta (S6).
 */
const read = (rel: string) => readFileSync(join(__dirname, '..', rel), 'utf-8');

const pageSrc = read('src/app/[locale]/estado/[bookingId]/page.tsx');

type Dict = Record<string, Record<string, string>>;
const es = JSON.parse(read('messages/es.json')) as Dict;
const en = JSON.parse(read('messages/en.json')) as Dict;

describe('estado — S10 (v7, the 4 states)', () => {
  it('derives "reserva no confirmada" from cancelado + hold_released_at (0012 marks, never deletes)', () => {
    expect(pageSrc).toContain("=== 'cancelado' && (status.holdReleasedAt ?? '') !== ''");
    expect(pageSrc).toContain("'noConfirmado'");
  });

  it('renders all four UI states from the DB status family', () => {
    // The status box label flows straight from the DB status
    // (pendiente/confirmado/cancelado/no_asistio) or the derived
    // 'noConfirmado' — one mapping, no state left unrendered.
    expect(pageSrc).toContain("isHoldReleased ? 'noConfirmado' : status.status");
    expect(pageSrc).toContain('t(view.statusKey)');
    // Three bodies cover the four states: pendiente, confirmado and the
    // closed family (no confirmada / cancelado / no asistio).
    expect(pageSrc).toContain('PendienteBody');
    expect(pageSrc).toContain('ConfirmadoBody');
    expect(pageSrc).toContain('ClosedBody');
    expect(pageSrc).toContain('!view.isOpen ?');
  });

  it('status box and data box are ALWAYS the same width (w-full, one column)', () => {
    // Both boxes carry w-full explicitly — same width, centered by the same
    // max-w-lg column, in every state.
    expect(pageSrc).toMatch(/const STATUS_BOX =\s*'mt-3 flex w-full/);
    expect(pageSrc).toMatch(/const DATA_BOX =\s*'w-full/);
  });

  it('pendiente: the 3 numbered steps (circles, never dots)', () => {
    expect(pageSrc).toContain("t('step1')");
    expect(pageSrc).toContain("t('step2')");
    expect(pageSrc).toContain("t('step3')");
    // The numbered circle anatomy (S10: ①②③).
    expect(pageSrc).toContain('size-[21px]');
    expect(pageSrc).toContain('rounded-full');
  });

  it('confirmado: the recordatorios are NUMBERED 1-4 (never bullet dots)', () => {
    for (const key of ['reminder1', 'reminder2', 'reminder3', 'reminder4']) {
      expect(pageSrc).toContain(`t('${key}')`);
      expect(es.estado[key]).toBeTruthy();
      expect(en.estado[key]).toBeTruthy();
    }
    // The reminders reuse the same numbered StepRow as pendiente.
    expect(pageSrc).toContain('reminders.map');
  });

  it('the closed states end with "fue un error" and offer "Reservar otra vez"', () => {
    expect(pageSrc).toContain("t('errorLine')");
    expect(pageSrc).toContain("t('rebook')");
    expect(pageSrc).toContain("t('noConfirmadoBody')");
    expect(pageSrc).toContain("t('canceladoLead')");
    expect(es.estado.errorLine).toBe('Si creés que fue un error, escribinos.');
    expect(es.estado.rebook).toBe('Reservar otra vez');
  });

  it('the service renders WITH its add-ons, like the recibo', () => {
    expect(pageSrc).toContain('serviceWithAddons');
  });
});

describe('the 12h hold mechanic is invisible to the clienta (S6/S10)', () => {
  // The clienta-facing dictionaries never mention the number: no "12 h",
  // no "doce horas", no "twelve hours". The hold is said delicately
  // ("te guardamos el turno mientras confirmás la seña") or not at all.
  const CLIENTA_NAMESPACES = ['booking', 'addons', 'payment', 'estado'];

  /** Deep string values of a namespace (booking.error nests an object). */
  function deepValues(node: unknown): string[] {
    if (typeof node === 'string') {
      return [node];
    }
    if (node && typeof node === 'object') {
      return Object.values(node).flatMap(deepValues);
    }
    return [];
  }

  it.each(CLIENTA_NAMESPACES)('namespace "%s" carries no 12h text (es)', (ns) => {
    for (const value of deepValues(es[ns])) {
      expect(value, `${ns}: ${value}`).not.toMatch(/12\s*h/i);
      expect(value, `${ns}: ${value}`).not.toMatch(/doce horas/i);
    }
  });

  it.each(CLIENTA_NAMESPACES)('namespace "%s" carries no 12h text (en)', (ns) => {
    for (const value of deepValues(en[ns])) {
      expect(value, `${ns}: ${value}`).not.toMatch(/12\s*h/i);
      expect(value, `${ns}: ${value}`).not.toMatch(/twelve hours/i);
    }
  });

  it('the v2 hold labels are gone from the dictionaries', () => {
    expect(es.estado.holdLabel).toBeUndefined();
    expect(es.estado.holdExpired).toBeUndefined();
    expect(es.booking.confirmHold).toBeUndefined();
    expect(es.payment.holdBarLabel).toBeUndefined();
    expect(en.estado.holdLabel).toBeUndefined();
    expect(en.booking.confirmHold).toBeUndefined();
  });
});
