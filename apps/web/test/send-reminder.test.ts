import { beforeEach, describe, expect, it, vi } from 'vitest';
// vitest hoists vi.mock calls above all imports, so the module-under-test
// still sees the mocked 'resend' factory regardless of this import's position.
import { sendBookingReminder } from '../src/lib/send-reminder';

const { sendMock, ResendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  ResendMock: vi.fn(),
}));

vi.mock('resend', () => ({
  // Must be a real class: prod code calls `new Resend(key)`, and an arrow
  // function is not a constructor (TypeError swallowed by the try/catch → the
  // configured-path test got false). 2026-09-17 suite run.
  Resend: class {
    emails = { send: sendMock };
    constructor(...args: unknown[]) {
      ResendMock(...args);
    }
  },
}));

describe('sendBookingReminder (Resend client)', () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    sendMock.mockReset();
    ResendMock.mockReset();
  });

  it('is a no-op when Resend is unconfigured', async () => {
    await expect(
      sendBookingReminder({ to: 'lucia@example.com', nombre: 'Lucía', hora: '18:30' })
    ).resolves.toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('sends the es-AR voseo copy when configured', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.RESEND_FROM_EMAIL = 'khal@example.com';
    sendMock.mockResolvedValue({ data: { id: 'email_123' }, error: null });

    const ok = await sendBookingReminder({
      to: 'lucia@example.com',
      nombre: 'Lucía',
      hora: '18:30',
    });

    expect(ok).toBe(true);
    expect(ResendMock).toHaveBeenCalledWith('re_test');
    expect(sendMock).toHaveBeenCalledWith({
      from: 'khal@example.com',
      to: ['lucia@example.com'],
      subject: 'Recordatorio de reserva — 18:30',
      text: 'Che, Lucía, te recordamos tu reserva de las 18:30.',
    });
  });

  it('returns false when the Resend API reports an error', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.RESEND_FROM_EMAIL = 'khal@example.com';
    sendMock.mockResolvedValue({ data: null, error: { message: 'rejected' } });

    await expect(
      sendBookingReminder({ to: 'marti@example.com', nombre: 'Martín', hora: '10:00' })
    ).resolves.toBe(false);
  });
});
