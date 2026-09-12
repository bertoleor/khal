'use client';

import { SlotPicker, type DaySlot } from '@/components/booking/slot-picker';
import { PaymentStep, type PaymentInfo } from '@/components/payment/payment-step';
import { Field } from '@/components/shared/field';
import { createBooking, type BookingState } from '@/lib/actions/booking';
import { formatCents } from '@khal/utils';
import type { Service } from '@khal/validations';
import { useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';

const initialBookingState: BookingState = { ok: false };

type ErrorKey = 'error.invalid' | 'error.duplicate' | 'error.blacklisted';

function errorKeyFor(code: BookingState['code']): ErrorKey {
  switch (code) {
    case 'duplicate':
      return 'error.duplicate';
    case 'blacklisted':
      return 'error.blacklisted';
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
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? t('submitting') : t('confirm')}
          </button>
        </form>
      ) : null}

      <p className="pb-4 text-xs text-slate-400">
        {formatCents(service.price_cents, service.currency_code)}
      </p>
    </div>
  );
}
