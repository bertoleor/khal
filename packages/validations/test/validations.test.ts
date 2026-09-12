import {
  appointmentSchema,
  calendarExceptionInputSchema,
  canTransitionAppointment,
} from '@khal/validations';
import { describe, expect, it } from 'vitest';

describe('canTransitionAppointment', () => {
  it('allows pending -> confirmed, canceled, no-show', () => {
    expect(canTransitionAppointment('pendiente', 'confirmado')).toBe(true);
    expect(canTransitionAppointment('pendiente', 'cancelado')).toBe(true);
    expect(canTransitionAppointment('pendiente', 'no_asistio')).toBe(true);
  });

  it('allows confirmed -> canceled, no-show', () => {
    expect(canTransitionAppointment('confirmado', 'cancelado')).toBe(true);
    expect(canTransitionAppointment('confirmado', 'no_asistio')).toBe(true);
  });

  it('rejects arbitrary jumps and terminal reversals', () => {
    expect(canTransitionAppointment('cancelado', 'confirmado')).toBe(false);
    expect(canTransitionAppointment('no_asistio', 'confirmado')).toBe(false);
    expect(canTransitionAppointment('pendiente', 'pendiente')).toBe(false);
  });
});

describe('appointmentSchema', () => {
  it('accepts a valid appointment', () => {
    const result = appointmentSchema.safeParse({
      id: '11111111-1111-4111-8111-111111111111',
      clientName: 'María',
      serviceName: 'Lifting de Pestañas',
      date: '2026-09-07',
      time: '14:30',
      status: 'pendiente',
      priceCents: 4500000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid status', () => {
    const result = appointmentSchema.safeParse({
      id: '11111111-1111-4111-8111-111111111111',
      clientName: 'María',
      serviceName: 'Lifting de Pestañas',
      date: '2026-09-07',
      time: '14:30',
      status: 'pagado',
      priceCents: 4500000,
    });
    expect(result.success).toBe(false);
  });
});

describe('calendarExceptionInputSchema', () => {
  it('accepts a full-day holiday block', () => {
    const result = calendarExceptionInputSchema.safeParse({
      title: 'Feriado',
      type: 'holiday',
      date: '2026-12-25',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid exception type', () => {
    const result = calendarExceptionInputSchema.safeParse({
      title: 'X',
      type: 'cierre',
      date: '2026-12-25',
    });
    expect(result.success).toBe(false);
  });
});
