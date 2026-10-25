'use client';

import { SlotPicker, type DaySlot } from '@/components/booking/slot-picker';
import { PaymentStep, type PaymentInfo } from '@/components/payment/payment-step';
import { Field } from '@/components/shared/field';
import { Link } from '@/i18n/navigation';
import { createBooking, type BookingState } from '@/lib/actions/booking';
import type { Service } from '@khal/validations';
import { useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';

const initialBookingState: BookingState = { ok: false };

type ErrorKey =
  | 'error.invalid'
  | 'error.duplicate'
  | 'error.blacklisted'
  | 'error.conflict'
  | 'error.unavailable';

function errorKeyFor(code: BookingState['code']): ErrorKey {
  switch (code) {
    case 'duplicate':
      return 'error.duplicate';
    case 'blacklisted':
      return 'error.blacklisted';
    case 'conflict':
      return 'error.conflict';
    case 'unavailable':
      return 'error.unavailable';
    default:
      return 'error.invalid';
  }
}

export function BookingForm({
  service,
  days,
  payment,
}: {
  service: Service;
  days: DaySlot[];
  payment: PaymentInfo;
}) {
  const t = useTranslations('booking');
  const [selectedDate, setSelectedDate] = useState(days[0]?.date ?? '');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(createBooking, initialBookingState);

  if (state.ok && state.bookingId && selectedSlot && selectedDate) {
    return (
      <PaymentStep
        payment={payment}
        serviceName={service.name}
        date={selectedDate}
        slot={selectedSlot}
        bookingId={state.bookingId}
      />
    );
  }

  const error = !state.ok && state.code ? t(errorKeyFor(state.code)) : null;

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
  }

  return (
    <div className="space-y-6">
      <SlotPicker
        days={days}
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        onSelectDate={handleSelectDate}
        onSelectSlot={setSelectedSlot}
      />

      {selectedSlot ? (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="serviceId" value={service.id} />
          <input type="hidden" name="date" value={selectedDate} />
          <input type="hidden" name="slotStart" value={selectedSlot} />
          <Field label={t('name')} name="name" type="text" autoComplete="name" />
          <Field label={t('phone')} name="phone" type="tel" autoComplete="tel" />
          <Field label={t('email')} name="email" type="email" autoComplete="email" />

          {/* D3 — "¿venís con trabajo de otro lugar?": persists via
              create_booking (0014) and surfaces in the approval queue. */}
          <div className="flex items-start gap-2 pt-1">
            <input
              id="externalWork"
              name="externalWork"
              type="checkbox"
              className="mt-0.5 size-4 accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
            <label htmlFor="externalWork" className="cursor-pointer text-sm text-muted">
              {t('externalWorkLabel')}
            </label>
          </div>

          {/* D1 — terms gate: required client-side AND enforced server-side
              (bookingInputSchema.termsAccepted is z.literal(true)). */}
          <div className="flex items-start gap-2 pt-1">
            <input
              id="termsAccepted"
              name="termsAccepted"
              type="checkbox"
              required
              className="mt-0.5 size-4 accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
            <p className="text-sm text-muted">
              <label htmlFor="termsAccepted" className="cursor-pointer">
                {t('termsLabel')}
              </label>{' '}
              <Link
                href="/politicas"
                className="font-mono-khal text-[11px] uppercase tracking-[1.5px] text-accent-soft underline-offset-4 hover:text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {t('termsLink')}
              </Link>
            </p>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-accent px-6 py-3 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? t('submitting') : t('confirmHold')}
          </button>
        </form>
      ) : null}
    </div>
  );
}
