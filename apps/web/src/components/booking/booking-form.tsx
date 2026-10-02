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

type ErrorKey =
  | 'error.invalid'
  | 'error.duplicate'
  | 'error.blacklisted'
  | 'error.conflict'
  | 'error.unavailable'
  | 'error.captcha_failed'
  | 'error.rate_limited';

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
    case 'captcha_failed':
      return 'error.captcha_failed';
    case 'rate_limited':
      return 'error.rate_limited';
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
  // [KHAL-A4] Stable per-form-lifetime idempotency key: a retry after a
  // network error replays the SAME key server-side (idempotent RPC replay)
  // instead of minting a second booking. A successful booking unmounts
  // this form, so a fresh mount naturally starts with a fresh key.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [state, formAction, isPending] = useActionState(createBooking, initialBookingState);

  if (state.ok && state.bookingId && selectedSlot && selectedDate) {
    return (
      <PaymentStep
        payment={payment}
        serviceName={service.name}
        date={selectedDate}
        slot={selectedSlot}
        bookingId={state.bookingId}
        serviceId={service.id}
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
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          <Field label={t('name')} name="name" type="text" autoComplete="name" />
          <Field label={t('phone')} name="phone" type="tel" autoComplete="tel" />
          <Field label={t('email')} name="email" type="email" autoComplete="email" />
          {/* [KHAL-A4] Cloudflare Turnstile widget — implicit rendering via the
              api.js script. The server action verifies the token fail-closed
              (lib/security/turnstile.ts); without a valid token there is NO
              booking. Site key comes from the required NEXT_PUBLIC_TURNSTILE_SITE_KEY. */}
          <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div
            className="cf-turnstile"
            data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            data-theme="light"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? t('submitting') : t('confirm')}
          </button>
        </form>
      ) : null}

      <p className="pb-4 text-xs text-slate-500">
        {formatCents(service.price_cents, service.currency_code)}
      </p>
    </div>
  );
}
